exports.up = async (pgm) => {
    await pgm.sql(`
        CREATE UNIQUE INDEX IF NOT EXISTS stripe_charges_subscription_created_unique_idx 
        ON analytics.stripe_charges (subscription_id, created);
    `);
};

exports.down = async (pgm) => {
    await pgm.sql(`
        DROP INDEX IF EXISTS analytics.stripe_charges_subscription_created_unique_idx;
    `);
}; 