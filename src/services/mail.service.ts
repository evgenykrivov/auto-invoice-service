import {google} from 'googleapis';
import {JWT} from 'google-auth-library';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendGmailLetter(options: EmailOptions) {
    try {
        // Декодируем JSON ключ из base64
        const credentials = JSON.parse(Buffer.from(process.env.GSA_JSON_BASE64 || '', 'base64').toString());

        // Создаем JWT клиент
        const auth = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
            subject: 'support@chachat.app'
        });

        // Явная авторизация
        await auth.authorize();

        // Создаем Gmail клиент
        const gmail = google.gmail({version: 'v1', auth});

        // Формируем email в формате RFC 822
        const message = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `To: ${options.to}`,
            'From: ChaChat Support <support@chachat.app>',
            `Subject: ${options.subject}`,
            '',
            options.html
        ].join('\n');

        // Кодируем сообщение в base64
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Отправляем письмо
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}