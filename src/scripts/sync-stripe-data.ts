import Stripe from 'stripe';
import {pool} from '../db';
import dotenv from 'dotenv';
import {DateTime} from 'luxon';

dotenv.config();

export async function syncStripeData() {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20' as any,
    });

    try {
        console.log('Starting Stripe data sync...');
        
        // Сначала получим список активных подписок с email
        console.log('Fetching active subscriptions...');
        let activeSubscriptions = new Set<string>();
        let hasMoreSubs = true;
        let startingAfterSub: string | undefined;

        while (hasMoreSubs) {
            const subscriptions = await stripe.subscriptions.list({
                status: 'active',  // Только активные подписки
                limit: 100,
                starting_after: startingAfterSub,
                expand: ['data.customer']
            });

            for (const sub of subscriptions.data) {
                const customer = sub.customer as Stripe.Customer;
                // Проверяем наличие email
                if (customer && 'email' in customer && customer.email) {
                    activeSubscriptions.add(sub.id);
                }
            }

            hasMoreSubs = subscriptions.has_more;
            if (subscriptions.data.length > 0) {
                startingAfterSub = subscriptions.data[subscriptions.data.length - 1].id;
            }
            console.log(`Found ${activeSubscriptions.size} active subscriptions with email so far...`);
        }

        console.log(`Total active subscriptions with email: ${activeSubscriptions.size}`);

        // Теперь получаем платежи только для этих подписок
        const startTime = Math.floor(DateTime.now().minus({days: 45}).toSeconds());
        let totalCharges = 0;
        let hasMore = true;
        let startingAfter: string | undefined;

        while (hasMore) {
            const charges = await stripe.charges.list({
                created: { gte: startTime },
                limit: 100,
                starting_after: startingAfter,
                expand: ['data.invoice']
            });

            console.log(`Got batch of ${charges.data.length} charges, filtering...`);
            
            const subscriptionCharges = new Map<string, Stripe.Charge[]>();
            let relevantChargesInBatch = 0;
            
            for (const charge of charges.data) {
                if (charge.status !== 'succeeded') continue;
                if (!charge.invoice) continue;
                
                const invoice = charge.invoice as Stripe.Invoice;
                const subscriptionId = typeof invoice.subscription === 'string' 
                    ? invoice.subscription 
                    : invoice.subscription?.id;
                
                // Пропускаем платежи не из активных подписок с email
                if (!subscriptionId || !activeSubscriptions.has(subscriptionId)) continue;

                relevantChargesInBatch++;

                if (!subscriptionCharges.has(subscriptionId)) {
                    subscriptionCharges.set(subscriptionId, []);
                }
                subscriptionCharges.get(subscriptionId)!.push(charge);
            }

            // Сохраняем только релевантные платежи
            for (const [subscriptionId, charges] of subscriptionCharges.entries()) {
                charges.sort((a, b) => a.created - b.created);
                
                for (let i = 0; i < charges.length; i++) {
                    const charge = charges[i];
                    const isFirstCharge = i === 0;

                    await pool.query(`
                        INSERT INTO analytics.stripe_charges 
                        (subscription_id, stripe_user_id, price_name, created, is_first_user_charge)
                        VALUES ($1, $2, $3, to_timestamp($4), $5)
                        ON CONFLICT (subscription_id, created) DO UPDATE 
                        SET is_first_user_charge = $5,
                            price_name = $3
                    `, [
                        subscriptionId,
                        charge.customer,
                        charge.description || 'Unknown',
                        charge.created,
                        isFirstCharge
                    ]);
                }
            }

            totalCharges += relevantChargesInBatch;
            hasMore = charges.has_more;
            
            if (charges.data.length > 0) {
                startingAfter = charges.data[charges.data.length - 1].id;
            }

            console.log(`Processed batch: ${relevantChargesInBatch} relevant out of ${charges.data.length} total charges`);
            console.log(`Total relevant charges so far: ${totalCharges}`);
        }

        console.log(`Successfully synced all ${totalCharges} relevant charges from Stripe`);
    } catch (error) {
        console.error('Error syncing Stripe data:', error);
        throw error;
    }
}

// Запускаем только если файл запущен напрямую
if (require.main === module) {
    syncStripeData()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} 