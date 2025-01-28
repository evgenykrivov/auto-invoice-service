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
    WITH successful_charges AS (
        -- Выбираем только успешные платежи
        SELECT
            subscription_id,
            stripe_user_id,
            created,
            ROW_NUMBER() OVER (PARTITION BY subscription_id ORDER BY created) as charge_number,
            COUNT(*) OVER (PARTITION BY subscription_id) as total_charges
        FROM analytics.stripe_charges
        WHERE created >= $1
        AND price_name ILIKE '%succeeded%'  -- Только успешные платежи
    ),
    users_with_exactly_two_charges AS (
        -- Находим пользователей с ровно 2 успешными платежами
        SELECT DISTINCT
            stripe_user_id,
            subscription_id,
            MAX(created) as last_charge_date
        FROM successful_charges
        WHERE total_charges = 2  -- Ровно 2 платежа
        GROUP BY stripe_user_id, subscription_id
    ),
    active_subscriptions AS (
        -- Проверяем что подписка не отменена и письмо не отправлялось
        SELECT 
            u.stripe_user_id,
            u.subscription_id,
            u.last_charge_date
        FROM users_with_exactly_two_charges u
        LEFT JOIN analytics.stripe_cancellations can 
            ON u.subscription_id = can.subscription_id
        LEFT JOIN analytics.emails_sent e 
            ON u.subscription_id = e.subscription_id
            AND e.email_type = 'third_charge_reminder'
        WHERE can.subscription_id IS NULL  -- Подписка не отменена
        AND e.subscription_id IS NULL      -- Письмо еще не отправляли
    )
    SELECT 
        stripe_user_id,
        subscription_id,
        last_charge_date
    FROM active_subscriptions;
    `;

    const {rows} = await pool.query(query, [startDate]);
    console.log(`Found ${rows.length} users with exactly 2 successful charges`);
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

    for (const user of users) {
        try {
            const customer = await stripe.customers.retrieve(user.stripe_user_id);
            
            if (!customer || customer.deleted) {
                console.log(`[SKIP] Customer ${user.stripe_user_id} not found or deleted`);
                continue;
            }

            const customerEmail = 'email' in customer ? customer.email : null;
            if (!customerEmail) {
                console.log(`[SKIP] No email for customer ${user.stripe_user_id}`);
                continue;
            }

            const invoice = await stripe.invoices.retrieveUpcoming({
                customer: user.stripe_user_id,
            });

            if (!invoice?.next_payment_attempt) {
                console.log(`[SKIP] No upcoming payment for customer ${user.stripe_user_id}`);
                continue;
            }

            const paymentDate = DateTime.fromSeconds(invoice.next_payment_attempt);
            const hoursUntilPayment = paymentDate.diff(now, 'hours').hours;

            // Проверяем что платеж будет в ближайшие 24-72 часа
            if (hoursUntilPayment < 24 || hoursUntilPayment > 72) {
                console.log(`[SKIP] Payment for ${user.stripe_user_id} is outside 24-72h window (${Math.floor(hoursUntilPayment)}h)`);
                continue;
            }

            console.log(`[FOUND] Customer ${user.stripe_user_id} with email ${customerEmail} will have their 3rd payment in ${Math.floor(hoursUntilPayment)}h`);

            upcomingInvoices[user.subscription_id] = {
                stripe_user_id: user.stripe_user_id,
                total: invoice.total,
                plan: invoice.lines.data[0]?.description ?? 'N/A',
                next_payment_date: paymentDate.toFormat('yyyy-MM-dd'),
                payment_time: paymentDate.toFormat('HH:mm'),
                hours_until_payment: Math.floor(hoursUntilPayment),
                email: customerEmail,
                last_charge_date: DateTime.fromJSDate(user.last_charge_date).toFormat('yyyy-MM-dd HH:mm')
            };
        } catch (error) {
            console.error(`[ERROR] Failed to get upcoming invoice for user ${user.stripe_user_id}:`, error);
        }
    }

    return upcomingInvoices;
}