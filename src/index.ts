import {getUpcomingInvoices, getUsersBeforeThirdCharge} from './services/third-charge.service';
import {sendGmailLetter} from './services/mail.service';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    try {
        const userIds = await getUsersBeforeThirdCharge();
        console.log('Found user IDs:', userIds);

        const upcoming = await getUpcomingInvoices(userIds);
        console.log('Upcoming invoices:', upcoming);

       for (const [subscriptionId, data] of Object.entries(upcoming)) {
            const {email, next_payment_date, total} = data;
            if (!email) continue;

            const subject = `Your 3rd payment is coming on ${next_payment_date}`;
            const html = `
        <p>Hello!</p>
        <p>Your next payment of <b>$${(total / 100).toFixed(
                2
            )}</b> is scheduled for <b>${next_payment_date}</b>.</p>
        <p>Thank you for using ChaChat!</p>
      `;

            await sendGmailLetter({
                to: email,
                subject,
                html,
            });

            console.log('Sent email to:', email);
            // TODO: записать логику логирования в Postgres:
            // e.g. await logEmailSent(subscriptionId, email, next_payment_date)
        }

        console.log('Done with all emails');
    } catch (err) {
        console.error('Error in main:', err);
    } finally {
        // pool.end();
    }
}

main();