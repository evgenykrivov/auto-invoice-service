// src/services/mail.service.ts
import {google} from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

interface SendMailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendGmailLetter(params: SendMailParams) {
    // Допустим, мы храним JSON ключ сервис-аккаунта в переменной окружения
    // GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 (base64-encoded JSON).
    // Или берем из файла.
    const base64json = process.env.GSA_JSON_BASE64;
    if (!base64json) {
        throw new Error('No GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 in env');
    }

    const rawJson = Buffer.from(base64json, 'base64').toString('utf-8');
    const credentials = JSON.parse(rawJson);

    // JWT аутентификация
    const jwtClient = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        // subject: при необходимости, почта от чьего имени отправлять
    });

    await jwtClient.authorize();

    const gmail = google.gmail({version: 'v1', auth: jwtClient});

    // Сформируем "raw" письмо в base64url
    const raw = makeRawEmail({
        from: 'ChaChat <support@chachat.app>',
        to: params.to,
        subject: params.subject,
        html: params.html,
    });

    // Отправляем
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw,
        },
    });
}

function makeRawEmail(opts: {
    from: string;
    to: string;
    subject: string;
    html: string;
}): string {
    const messageParts = [
        'Content-Type: text/html; charset="UTF-8"',
        'MIME-Version: 1.0',
        `From: ${opts.from}`,
        `To: ${opts.to}`,
        `Subject: ${opts.subject}`,
        '',
        opts.html,
    ];

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return encodedMessage;
}