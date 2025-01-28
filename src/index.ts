import {getUpcomingInvoices, getUsersBeforeThirdCharge} from './services/third-charge.service';
import {sendGmailLetter} from './services/mail.service';
import {alreadySentEmail, logEmailSent} from './services/email-log.service';
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
        // Сначала синхронизируем данные из Stripe
        await syncStripeData();

        // Находим пользователей с 2 платежами
        const usersWithTwoCharges = await getUsersBeforeThirdCharge();
        console.log('\n=== Found users for third charge notification ===');
        console.log('Total users found:', usersWithTwoCharges.length);

        // Проверяем у кого скоро третий платеж
        const upcomingInvoices = await getUpcomingInvoices(usersWithTwoCharges);
        
        console.log('\n=== Users that would receive emails ===');
        for (const [subscriptionId, data] of Object.entries(upcomingInvoices)) {
            console.log(`\nSubscription: ${subscriptionId}`);
            console.log(`Customer: ${data.stripe_user_id}`);
            console.log(`Email: ${data.email}`);
            console.log(`Last charge: ${data.last_charge_date}`);
            console.log(`Next payment: ${data.next_payment_date} ${data.payment_time} (in ${data.hours_until_payment}h)`);
            console.log(`Amount: $${(data.total / 100).toFixed(2)}`);
            console.log(`Plan: ${data.plan}`);
        }

        console.log('\n=== Summary ===');
        console.log('Total users found:', usersWithTwoCharges.length);
        console.log('Total emails that would be sent:', Object.keys(upcomingInvoices).length);
        console.log('Mode: DRY RUN (no emails sent)');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();

// И каждые 12 часов
setInterval(main, 12 * 60 * 60 * 1000);