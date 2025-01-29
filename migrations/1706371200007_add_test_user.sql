-- Очищаем существующие данные
TRUNCATE analytics.stripe_charges CASCADE;
TRUNCATE analytics.stripe_cancellations CASCADE;
TRUNCATE analytics.emails_sent CASCADE;

-- Добавляем тестового пользователя с двумя успешными платежами
INSERT INTO analytics.stripe_charges 
(subscription_id, stripe_user_id, price_name, created, is_first_user_charge)
VALUES 
-- Первый платеж (45 дней назад)
('sub_test123', 'cus_test123', '1M Pro Plan (succeeded)', NOW() - INTERVAL '45 days', true),
-- Второй платеж (15 дней назад)
('sub_test123', 'cus_test123', '1M Pro Plan (succeeded)', NOW() - INTERVAL '15 days', false); 