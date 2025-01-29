import {getUpcomingInvoices, getUsersBeforeThirdCharge} from './services/third-charge.service';
import {sendGmailLetter} from './services/mail.service';
import {getThirdPaymentEmailTemplate} from './templates/third-payment-email';
import dotenv from 'dotenv';
import {syncStripeData} from './scripts/sync-stripe-data';

dotenv.config();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TEST_EMAILS = [
    'evgenykrivov@outlook.com',
    'ekrivov@mynalabs.ai',
    'krivovevgeny5@gmail.com',
    'evgenytryzo@gmail.com'
];

async function main() {
    try {
        await syncStripeData();

        const users = await getUsersBeforeThirdCharge();
        console.log('\n=== Found users for third charge notification ===');
        console.log('Total users found:', users.length);

        const upcomingInvoices = await getUpcomingInvoices(users);
        
        console.log('\n=== Sending emails ===');
        for (const [subscriptionId, data] of Object.entries(upcomingInvoices)) {
            console.log(`\nProcessing subscription: ${subscriptionId}`);
            console.log(`Email: ${data.email}`);
            console.log(`Next payment: ${data.next_payment_date}`);

            try {
                const htmlContent = getThirdPaymentEmailTemplate({
                    total: data.total,
                    plan: data.plan,
                    next_payment_date: data.next_payment_date,
                    user_id: data.stripe_user_id
                });

                await sendGmailLetter({
                    to: data.email,
                    subject: 'Your third payment is coming up',
                    html: htmlContent
                });
                console.log('✓ Email sent successfully');
            } catch (error) {
                console.error('✗ Failed to send email:', error);
            }
        }

        console.log('\n=== Summary ===');
        console.log('Total users found:', users.length);
        console.log('Total emails sent:', Object.keys(upcomingInvoices).length);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

setInterval(main, 12 * 60 * 60 * 1000);
main();