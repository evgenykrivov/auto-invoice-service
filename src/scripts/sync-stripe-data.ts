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
        
        console.log('Fetching active subscriptions...');
        let activeSubscriptions = new Set<string>();
        let hasMoreSubs = true;
        let startingAfterSub: string | undefined;

        while (hasMoreSubs) {
            const subscriptions = await stripe.subscriptions.list({
                status: 'active',
                limit: 100,
                starting_after: startingAfterSub,
                expand: ['data.customer']
            });

            for (const sub of subscriptions.data) {
                const customer = sub.customer as Stripe.Customer;
                if (customer && 'email' in customer && customer.email) {
                    activeSubscriptions.add(sub.id);
                }
            }

            hasMoreSubs = subscriptions.has_more;
            if (subscriptions.data.length > 0) {
                startingAfterSub = subscriptions.data[subscriptions.data.length - 1].id;
            }
        }

        console.log(`Found ${activeSubscriptions.size} active subscriptions with email`);

        const startTime = Math.floor(DateTime.now().minus({days: 45}).toSeconds());
        let hasMore = true;
        let startingAfter: string | undefined;
        let totalCharges = 0;

        while (hasMore) {
            const charges = await stripe.charges.list({
                created: { gte: startTime },
                limit: 100,
                starting_after: startingAfter,
                expand: ['data.invoice']
            });

            for (const charge of charges.data) {
                if (charge.status !== 'succeeded') continue;
                if (!charge.invoice) continue;
                
                const invoice = charge.invoice as Stripe.Invoice;
                const subscriptionId = typeof invoice.subscription === 'string' 
                    ? invoice.subscription 
                    : invoice.subscription?.id;

                if (!subscriptionId || !activeSubscriptions.has(subscriptionId)) continue;

                const isFirstCharge = !await pool.query(`
                    SELECT 1 FROM analytics.stripe_charges 
                    WHERE subscription_id = $1 AND created < $2
                    LIMIT 1
                `, [subscriptionId, charge.created]).then(r => r.rows.length > 0);

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

            totalCharges += charges.data.length;
            hasMore = charges.has_more;
            
            if (charges.data.length > 0) {
                startingAfter = charges.data[charges.data.length - 1].id;
            }

            console.log(`Processed ${totalCharges} relevant charges so far...`);
        }

        console.log(`Successfully synced all ${totalCharges} relevant charges from Stripe`);
    } catch (error) {
        console.error('Error syncing Stripe data:', error);
        throw error;
    }
}

if (require.main === module) {
    syncStripeData()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
} 