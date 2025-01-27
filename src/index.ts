import {getUpcomingInvoices, getUsersBeforeThirdCharge} from './services/third-charge.service';
import {sendGmailLetter} from './services/mail.service';
import {alreadySentEmail, logEmailSent} from './services/email-log.service'; // <-- новый сервис
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    try {
        const userIds = await getUsersBeforeThirdCharge();
        console.log('Found user IDs:', userIds);

        const upcoming = await getUpcomingInvoices(userIds);
        console.log('Upcoming invoices:', upcoming);

        // Проверяем, не включили ли мы тестовый email
        const testEmail = process.env.TEST_EMAIL; // например, "mytest@gmail.com"

        for (const [subscriptionId, data] of Object.entries(upcoming)) {
            const {email, next_payment_date, total} = data;
            if (!email) {
                continue;
            }

            // Проверяем, отправляли ли уже
            const isAlreadySent = await alreadySentEmail(subscriptionId);
            if (isAlreadySent) {
                console.log(`Already sent third-charge reminder for subscription ${subscriptionId}. Skipping.`);
                continue;
            }

            // Формируем письмо
            const realRecipient = email; // Чтобы можно было залогировать
            const actualRecipient = testEmail ? testEmail : email;
            // Если testEmail задан, то отправляем туда (а в логах видно реальный email)

            const subject = `Your 3rd payment is coming on ${next_payment_date}`;
            const html = `
                <p>Hello!</p>
                <p>Your next payment of <b>$${(total / 100).toFixed(2)}</b> is scheduled for <b>${next_payment_date}</b>.</p>
                <p>Thank you for using ChaChat!</p>
            `;

            // Отправляем письмо. Если закомментировано — то письма не уйдут
            await sendGmailLetter({
                to: actualRecipient,
                subject,
                html,
            });

            console.log(`Sent email to ${actualRecipient} (real user: ${realRecipient}), subscriptionId: ${subscriptionId}`);

            // Логируем отправку (запишем в analytics.emails_sent)
            await logEmailSent(subscriptionId, realRecipient);
        }

        console.log('Done with all emails');
    } catch (err) {
        console.error('Error in main:', err);
    } finally {
        // pool.end(); // Если нужно закрывать соединение сразу
    }
}

main();