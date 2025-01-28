/* eslint-disable camelcase */

exports.up = async (pgm) => {
    // Создаем схему если её нет
    await pgm.sql(`CREATE SCHEMA IF NOT EXISTS analytics;`);
    
    // Создаем таблицу stripe_charges
    await pgm.createTable({ schema: 'analytics', name: 'stripe_charges' }, {
        id: {
            type: 'serial',
            primaryKey: true,
        },
        subscription_id: {
            type: 'varchar(255)',
            notNull: true,
        },
        stripe_user_id: {
            type: 'varchar(255)',
            notNull: true,
        },
        price_name: {
            type: 'varchar(255)',
            notNull: true,
        },
        created: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('NOW()'),
        },
        is_first_user_charge: {
            type: 'boolean',
            notNull: true,
            default: false,
        }
    }, {
        ifNotExists: true
    });

    // Создаем таблицу stripe_cancellations
    await pgm.createTable({ schema: 'analytics', name: 'stripe_cancellations' }, {
        id: {
            type: 'serial',
            primaryKey: true,
        },
        subscription_id: {
            type: 'varchar(255)',
            notNull: true,
        },
        canceled_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('NOW()'),
        }
    }, {
        ifNotExists: true
    });

    // Создаем индексы с указанием схемы
    await pgm.sql(`
        CREATE INDEX IF NOT EXISTS stripe_charges_subscription_id_created_index 
        ON analytics.stripe_charges (subscription_id, created);
        
        CREATE INDEX IF NOT EXISTS stripe_cancellations_subscription_id_canceled_at_index 
        ON analytics.stripe_cancellations (subscription_id, canceled_at);
    `);

    // Проверяем создание таблиц
    await pgm.sql(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT FROM pg_tables 
                WHERE schemaname = 'analytics' 
                AND tablename = 'stripe_charges'
            ) THEN
                RAISE EXCEPTION 'Table analytics.stripe_charges was not created properly';
            END IF;

            IF NOT EXISTS (
                SELECT FROM pg_tables 
                WHERE schemaname = 'analytics' 
                AND tablename = 'stripe_cancellations'
            ) THEN
                RAISE EXCEPTION 'Table analytics.stripe_cancellations was not created properly';
            END IF;
        END
        $$;
    `);
};

exports.down = async (pgm) => {
    await pgm.dropIndex({ schema: 'analytics', name: 'stripe_charges' }, ['subscription_id', 'created'], { ifExists: true });
    await pgm.dropIndex({ schema: 'analytics', name: 'stripe_cancellations' }, ['subscription_id', 'canceled_at'], { ifExists: true });
    await pgm.dropTable({ schema: 'analytics', name: 'stripe_charges' }, { cascade: true, ifExists: true });
    await pgm.dropTable({ schema: 'analytics', name: 'stripe_cancellations' }, { cascade: true, ifExists: true });
}; 