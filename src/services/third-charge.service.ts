import {pool} from '../db';
import {DateTime} from 'luxon';
import Stripe from 'stripe';

/**
 * Возвращает список stripeUserId, у которых за последние 45 дней было ровно 2 списания
 * (не отменено)
 */
export async function getUsersBeforeThirdCharge(): Promise<any[]> {
    const startDate = DateTime.now().minus({days: 45}).toJSDate();

    const query = `
    WITH two_charges AS (
        SELECT 
            subscription_id,
            MIN(stripe_user_id) AS stripe_user_id
        FROM 
            analytics.stripe_charges
        WHERE 
            created >= $1
            AND (price_name LIKE '1M%' OR price_name LIKE '1W%')
        GROUP BY 
            subscription_id
        HAVING 
            COUNT(*) = 2
            AND COUNT(DISTINCT is_first_user_charge) = 2
    ),
    cancellations AS (
        SELECT 
            subscription_id
        FROM 
            analytics.stripe_cancellations sc
        WHERE 
            sc.canceled_at >= $1
    )
    SELECT 
        stripe_user_id,
        subscription_id
    FROM 
        two_charges
    LEFT JOIN 
        cancellations USING (subscription_id)
    WHERE 
        cancellations.subscription_id IS NULL;
    `;

    const {rows} = await pool.query(query, [startDate]);
    console.log(`Found ${rows.length} users with exactly 2 charges`);
    return rows;
}

/**
 * Возвращает объект со списком предстоящих инвойсов,
 * где дата списания <= 3 дней от сегодня
 */
export async function getUpcomingInvoices(users: any[]): Promise<Record<string, any>> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20' as any,
    });

    const upcomingInvoices: Record<string, any> = {};
    const now = DateTime.now();

    // Как в Python версии, берем только первые 10 для тестирования
    for (const user of users.slice(0, 10)) {
        try {
            const invoice = await stripe.invoices.retrieveUpcoming({
                customer: user.stripe_user_id,
            });

            const nextPaymentDate = DateTime.fromSeconds(invoice.next_payment_attempt || 0);
            if ((nextPaymentDate.diff(now, 'days').days) > 3) {
                continue;
            }

            const subscriptionId = invoice.subscription;
            const planDescription = invoice.lines.data[0]?.description || 'N/A';
            const customerEmail = invoice.customer_email;

            if (!customerEmail || !subscriptionId) continue;

            upcomingInvoices[subscriptionId.toString()] = {
                stripe_user_id: user.stripe_user_id,
                total: invoice.total,
                plan: planDescription,
                next_payment_date: nextPaymentDate.toFormat('yyyy-MM-dd'),
                email: customerEmail
            };

        } catch (error) {
            console.error(`[ERROR] Failed to get upcoming invoice for user ${user.stripe_user_id}:`, error);
        }
    }

    return upcomingInvoices;
}