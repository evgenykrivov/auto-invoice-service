/* eslint-disable camelcase */

exports.up = async (pgm) => {
    // Создаем схему
    await pgm.sql(`CREATE SCHEMA IF NOT EXISTS analytics;`);
    
    // Создаем таблицу emails_sent
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
        },
        is_first_user_charge: {
            type: 'boolean',
            notNull: true,
            default: false,
        }
    });

    // Добавляем уникальный индекс
    await pgm.sql(`
        CREATE UNIQUE INDEX stripe_charges_subscription_created_unique_idx 
        ON analytics.stripe_charges (subscription_id, created);
    `);

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
    });

    // Создаем индексы
    await pgm.sql(`
        CREATE INDEX IF NOT EXISTS stripe_charges_subscription_id_created_index 
        ON analytics.stripe_charges (subscription_id, created);
        
        CREATE INDEX IF NOT EXISTS stripe_cancellations_subscription_id_canceled_at_index 
        ON analytics.stripe_cancellations (subscription_id, canceled_at);
    `);
};

exports.down = async (pgm) => {
    await pgm.dropTable({ schema: 'analytics', name: 'emails_sent' }, { cascade: true, ifExists: true });
    await pgm.dropTable({ schema: 'analytics', name: 'stripe_charges' }, { cascade: true, ifExists: true });
    await pgm.dropTable({ schema: 'analytics', name: 'stripe_cancellations' }, { cascade: true, ifExists: true });
    await pgm.dropSchema('analytics', { ifExists: true });
}; 