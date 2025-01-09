import {pool} from '../db';
import {DateTime} from 'luxon';
import Stripe from 'stripe';

/**
 * Возвращает список stripeUserId, у которых за последние 45 дней было ровно 2 списания
 * (не отменено)
 */
export async function getUsersBeforeThirdCharge(): Promise<string[]> {
    const startDate = DateTime.now().minus({days: 45}).toJSDate();

    const query = `
    WITH two_charges AS (
      SELECT
        subscription_id,
        MIN(stripe_user_id) AS stripe_user_id
      FROM analytics.stripe_charges
      WHERE
        created >= $1
        AND (price_name LIKE '1M%' OR price_name LIKE '1W%')
      GROUP BY subscription_id
      HAVING COUNT(*) = 2
        AND COUNT(DISTINCT is_first_user_charge) = 2
    ),
    cancellations AS (
      SELECT
        subscription_id
      FROM analytics.stripe_cancellations sc
      WHERE sc.canceled_at >= $1
    )
    SELECT
      stripe_user_id
    FROM two_charges
    LEFT JOIN cancellations USING (subscription_id)
    WHERE cancellations.subscription_id IS NULL
  `;

    const {rows} = await pool.query(query, [startDate]);
    // rows -> [{ stripe_user_id: 'cus_abc' }, ...]

    const stripeUserIds = rows.map(r => r.stripe_user_id as string);
    return stripeUserIds;
}

/**
 * Возвращает объект со списком предстоящих инвойсов,
 * где дата списания <= 3 дней от сегодня
 */
export async function getUpcomingInvoices(stripeUserIds: string[]): Promise<Record<string, any>> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        "apiVersion": '2024-06-20' as any,
    });

    const upcomingInvoices: Record<string, any> = {};

    const idsLimited = stripeUserIds.slice(0, 10);

    for (const id of idsLimited) {
        const invoice = await stripe.invoices.retrieveUpcoming({customer: id});
        if (!invoice) {
            continue;
        }

        const nextPaymentTimestamp = invoice.next_payment_attempt;
        if (!nextPaymentTimestamp) {
            continue;
        }
        const nextPaymentDate = new Date(nextPaymentTimestamp * 1000);

        const daysDiff = (nextPaymentDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 3) {
            continue;
        }

        const subscriptionId = invoice.subscription;
        if (!subscriptionId) {
            continue;
        }

        const planDescription = invoice.lines.data[0]?.description ?? 'N/A';
        const customerEmail = invoice.customer_email;

        upcomingInvoices[subscriptionId.toString()] = {
            stripe_user_id: id,
            total: invoice.total,
            plan: planDescription,
            next_payment_date: nextPaymentDate.toISOString().slice(0, 10),
            email: customerEmail,
        };
    }

    return upcomingInvoices;
}