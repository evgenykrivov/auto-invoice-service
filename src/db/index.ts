import pg from "pg";
import dotenv from 'dotenv';

const {Pool} = pg;

dotenv.config();

export const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
});

// Добавим обработчик ошибок подключения
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});