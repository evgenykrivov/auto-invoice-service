import {getUsersBeforeThirdCharge, getUpcomingInvoices} from '../services/third-charge.service';
import {sendGmailLetter} from '../services/mail.service';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailFlow() {
    try {
        console.log('Starting test email flow...');

        const users = await getUsersBeforeThirdCharge();
        console.log('\n=== Found users ===');
        console.log(JSON.stringify(users, null, 2));

        const upcomingInvoices = await getUpcomingInvoices(users);
        console.log('\n=== Upcoming invoices ===');
        console.log(JSON.stringify(upcomingInvoices, null, 2));

        for (const [subscriptionId, data] of Object.entries(upcomingInvoices)) {
            console.log(`\nSending email for subscription ${subscriptionId}:`);
            console.log(`To: ${data.email}`);
            console.log(`Next payment: ${data.next_payment_date}`);
            
            if (!process.env.DRY_RUN) {
                await sendGmailLetter({
                    to: data.email,
                    subject: 'Your third payment is coming up',
                    html: `<p>Your next payment of $${(data.total / 100).toFixed(2)} is scheduled for ${data.next_payment_date}</p>`
                });
                console.log('Email sent successfully!');
            }
        }

    } catch (error) {
        console.error('Error in test flow:', error);
    }
}

testEmailFlow(); 