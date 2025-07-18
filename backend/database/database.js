const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafe_ordering',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
});

module.exports = pool;