/* eslint-disable camelcase */

exports.up = async (pgm) => {
    // Удаляем существующую таблицу и схему если они есть
    await pgm.sql(`DROP TABLE IF EXISTS analytics.emails_sent CASCADE;`);
    await pgm.sql(`DROP SCHEMA IF EXISTS analytics CASCADE;`);

    // Создаем схему
    await pgm.sql(`CREATE SCHEMA IF NOT EXISTS analytics;`);
    
    // Создаем таблицу
    await pgm.createTable({ schema: 'analytics', name: 'emails_sent' }, {
        id: {
            type: 'serial',
            primaryKey: true,
        },
        subscription_id: {
            type: 'varchar(255)',
            notNull: true,
        },
        email: {
            type: 'varchar(255)',
            notNull: true,
        },
        email_type: {
            type: 'varchar(255)',
            notNull: true,
            default: pgm.func(`'third_charge_reminder'`),
        },
        sent_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('NOW()'),
        },
    }, {
        ifNotExists: true
    });

    // Проверяем создание таблицы
    await pgm.sql(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT FROM pg_tables 
                WHERE schemaname = 'analytics' 
                AND tablename = 'emails_sent'
            ) THEN
                RAISE EXCEPTION 'Table analytics.emails_sent was not created properly';
            END IF;
        END
        $$;
    `);
};

exports.down = async (pgm) => {
    await pgm.dropTable({ schema: 'analytics', name: 'emails_sent' }, { cascade: true, ifExists: true });
    await pgm.dropSchema('analytics', { ifExists: true });
}; 