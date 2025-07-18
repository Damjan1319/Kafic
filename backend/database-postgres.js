const {Pool} = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafe_ordering',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false, // For Render/secure connections
    max: 10, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Initialize database and tables
const initDatabase = async () => {
    try {
        const client = await pool.connect();

        // Create database if it doesn't exist (Postgres requires connecting to a default DB first, like 'postgres')
        // Note: For Render, the DB is pre-created; skip if already exists.
        // await client.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        // For switching DB: await client.query(`\\c ${dbConfig.database}`); but better to connect directly.

        // Create tables (use IF NOT EXISTS)
        await client.query(`
            CREATE TABLE IF NOT EXISTS waiters
            (
                id
                SERIAL
                PRIMARY
                KEY,
                username
                VARCHAR
            (
                50
            ) UNIQUE NOT NULL,
                password VARCHAR
            (
                255
            ) NOT NULL,
                name VARCHAR
            (
                100
            ) NOT NULL,
                role TEXT DEFAULT 'waiter' CHECK
            (
                role
                IN
            (
                'admin',
                'waiter'
            )),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS tables
            (
                id
                SERIAL
                PRIMARY
                KEY,
                table_number
                INT
                UNIQUE
                NOT
                NULL,
                qr_code
                VARCHAR
            (
                100
            ) UNIQUE NOT NULL,
                location TEXT DEFAULT 'indoor' CHECK
            (
                location
                IN
            (
                'indoor',
                'outdoor'
            )),
                x_position INT DEFAULT 0,
                y_position INT DEFAULT 0,
                current_order_count INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS menu_items
            (
                id
                SERIAL
                PRIMARY
                KEY,
                name
                VARCHAR
            (
                100
            ) NOT NULL,
                category VARCHAR
            (
                50
            ) NOT NULL,
                price DECIMAL
            (
                10,
                2
            ) NOT NULL,
                description TEXT,
                stock INT DEFAULT 0,
                available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders
            (
                id
                SERIAL
                PRIMARY
                KEY,
                table_id
                INT
                NOT
                NULL
                REFERENCES
                tables
            (
                id
            ),
                order_number INT NOT NULL,
                total_price DECIMAL
            (
                10,
                2
            ) NOT NULL,
                status TEXT DEFAULT 'pending' CHECK
            (
                status
                IN
            (
                'pending',
                'approved',
                'completed'
            )),
                waiter_id INT REFERENCES waiters
            (
                id
            ),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS order_items
            (
                id
                SERIAL
                PRIMARY
                KEY,
                order_id
                INT
                NOT
                NULL
                REFERENCES
                orders
            (
                id
            ) ON DELETE CASCADE,
                item_id INT NOT NULL REFERENCES menu_items
            (
                id
            ),
                name VARCHAR
            (
                100
            ) NOT NULL,
                price DECIMAL
            (
                10,
                2
            ) NOT NULL,
                quantity INT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                )
        `);

        // Add columns if not exist (Postgres doesn't have direct ALTER IF NOT EXISTS for columns; use a function or check)
        // For simplicity, wrap in try-catch as before
        try {
            await client.query(`ALTER TABLE tables
                ADD COLUMN location TEXT DEFAULT 'indoor' CHECK (location IN ('indoor', 'outdoor'))`);
        } catch {
        } // Ignore if exists
        try {
            await client.query(`ALTER TABLE tables
                ADD COLUMN x_position INT DEFAULT 0`);
        } catch {
        }
        try {
            await client.query(`ALTER TABLE tables
                ADD COLUMN y_position INT DEFAULT 0`);
        } catch {
        }
        try {
            await client.query(`ALTER TABLE menu_items
                ADD COLUMN stock INT DEFAULT 0`);
        } catch {
        }
        try {
            await client.query(`ALTER TABLE menu_items
                ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`);
        } catch {
        }

        client.release();
        console.log('Database and tables initialized successfully');

        // Insert default data (adapted; uncomment if needed)
        // await insertDefaultData();

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// The rest of your insertDefaultData, setDefaultTablePositions, and dbHelpers functions need similar adjustments:
// - Use client.query instead of execute.
// - Parameters use $1, $2... placeholders: e.g., await pool.query('SELECT * FROM waiters WHERE username = $1', [username]);
// - Update all queries in dbHelpers accordingly (e.g., for getWaiters: await pool.query('SELECT * FROM waiters') then rows = result.rows)
// - For transactions: Use client from pool.connect(), client.query('BEGIN'), etc.

const dbHelpers = {
    // Example adjusted helper
    getWaiters: async () => {
        const result = await pool.query('SELECT * FROM waiters');
        return result.rows;
    },

    // ... Adjust all others similarly: Use pool.query(sql, params), return result.rows
    // For INSERT/UPDATE: result.rowCount for affected rows
    // Full adjustments for all helpers would be lengthy; apply the pattern.

    // Example for createOrder (transaction):
    createOrder: async (tableId, items, totalPrice) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Queries with $1 placeholders...
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    getMenuItems: async () => {
        console.log('usao')
        try {
            const {rows} = await pool.query('SELECT * FROM menu_items WHERE available = true ORDER BY category, name');
            console.log(rows)
            return rows;
        } catch (error) {
            console.error('Error getting menu items:', error);
            throw error;
        }
    }, // Etc.
};

// Export
module.exports = {pool, dbHelpers, initDatabase};