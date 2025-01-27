/* eslint-disable camelcase */

/*
  Example: Create "analytics.emails_sent" table
*/

exports.up = (pgm) => {
    pgm.createSchema('analytics', {ifNotExists: true});

    pgm.createTable({schema: 'analytics', name: 'emails_sent'}, {
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
            default: 'third_charge_reminder',
        },
        sent_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('NOW()'),
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable({schema: 'analytics', name: 'emails_sent'});
};