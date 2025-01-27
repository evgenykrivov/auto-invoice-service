import {pool} from '../db';

export async function alreadySentEmail(subscriptionId: string): Promise<boolean> {
    const query = `
    SELECT 1
    FROM analytics.emails_sent
    WHERE subscription_id = $1
      AND email_type = 'third_charge_reminder'
    LIMIT 1
  `;
    const {rows} = await pool.query(query, [subscriptionId]);
    return rows.length > 0;
}

export async function logEmailSent(subscriptionId: string, email: string) {
    const query = `
    INSERT INTO analytics.emails_sent (subscription_id, email, email_type)
    VALUES ($1, $2, 'third_charge_reminder')
  `;
    await pool.query(query, [subscriptionId, email]);
}