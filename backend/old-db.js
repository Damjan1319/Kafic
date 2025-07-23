const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafe_ordering',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database and tables
const initDatabase = async () => {
    try {
        const connection = await pool.getConnection();

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.query(`USE ${dbConfig.database}`);

        // Create tables
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS waiters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'waiter') DEFAULT 'waiter',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.execute(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_number INT UNIQUE NOT NULL,
        qr_code VARCHAR(100) UNIQUE NOT NULL,
        location ENUM('indoor', 'outdoor') DEFAULT 'indoor',
        x_position INT DEFAULT 0,
        y_position INT DEFAULT 0,
        current_order_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        stock INT DEFAULT 0,
        available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

        await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        order_number INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'approved', 'completed') DEFAULT 'pending',
        waiter_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables(id),
        FOREIGN KEY (waiter_id) REFERENCES waiters(id)
      )
    `);

        await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        item_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES menu_items(id)
      )
    `);

        // Add location column to existing tables if it doesn't exist
        try {
            await connection.execute(`
        ALTER TABLE tables 
        ADD COLUMN location ENUM('indoor', 'outdoor') DEFAULT 'indoor'
      `);
            console.log('Location column added to tables');
        } catch (error) {
            // Column already exists, ignore error
            console.log('Location column already exists or error adding it:', error.message);
        }

        // Add x_position column to existing tables if it doesn't exist
        try {
            await connection.execute(`
        ALTER TABLE tables 
        ADD COLUMN x_position INT DEFAULT 0
      `);
            console.log('x_position column added to tables');
        } catch (error) {
            // Column already exists, ignore error
            console.log('x_position column already exists or error adding it:', error.message);
        }

        // Add y_position column to existing tables if it doesn't exist
        try {
            await connection.execute(`
        ALTER TABLE tables 
        ADD COLUMN y_position INT DEFAULT 0
      `);
            console.log('y_position column added to tables');
        } catch (error) {
            // Column already exists, ignore error
            console.log('y_position column already exists or error adding it:', error.message);
        }

        // Add stock column to menu_items if it doesn't exist
        try {
            await connection.execute(`
        ALTER TABLE menu_items 
        ADD COLUMN stock INT DEFAULT 0
      `);
            console.log('stock column added to menu_items');
        } catch (error) {
            // Column already exists, ignore error
            console.log('stock column already exists or error adding it:', error.message);
        }

        // Add updated_at column to menu_items if it doesn't exist
        try {
            await connection.execute(`
        ALTER TABLE menu_items 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
            console.log('updated_at column added to menu_items');
        } catch (error) {
            // Column already exists, ignore error
            console.log('updated_at column already exists or error adding it:', error.message);
        }

        connection.release();
        console.log('Database and tables initialized successfully');

        // Insert default data - ZAKOMENTARISANO da se ne upisuju testni podaci
        // await insertDefaultData();

    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Insert default data
const insertDefaultData = async () => {
    try {
        const connection = await pool.getConnection();
        const bcrypt = require('bcryptjs');

        // Insert default waiters
        const waiters = [
            { username: 'admin', password: bcrypt.hashSync('admin123', 10), name: 'Admin', role: 'admin' },
            { username: 'waiter', password: bcrypt.hashSync('waiter123', 10), name: 'Waiter 1', role: 'waiter' },
            { username: 'waiter2', password: bcrypt.hashSync('waiter123', 10), name: 'Waiter 2', role: 'waiter' },
            { username: 'konobar1', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 1', role: 'waiter' },
            { username: 'konobar2', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 2', role: 'waiter' },
            { username: 'konobar3', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 3', role: 'waiter' },
            { username: 'konobar4', password: bcrypt.hashSync('konobar123', 10), name: 'Konobar 4', role: 'waiter' }
        ];

        for (const waiter of waiters) {
            await connection.execute(
                'INSERT IGNORE INTO waiters (username, password, name, role) VALUES (?, ?, ?, ?)',
                [waiter.username, waiter.password, waiter.name, waiter.role]
            );
        }

        // Clear existing orders and menu items, then insert comprehensive menu
        // ZAKOMENTARISANO - ne ubacujemo testne stavke menija
        // await connection.execute('DELETE FROM order_items');
        // await connection.execute('DELETE FROM orders');
        // await connection.execute('DELETE FROM menu_items');

        // ZAKOMENTARISANO - ne ubacujemo testne stavke menija
        // const menuItems = [
        //   // KAFE
        //   { name: 'Espresso', category: 'coffee', price: 120, description: 'Classic Italian espresso', stock: 100 },
        //   { name: 'Cappuccino', category: 'coffee', price: 150, description: 'Espresso with steamed milk foam', stock: 100 },
        //   { name: 'Latte', category: 'coffee', price: 160, description: 'Espresso with steamed milk', stock: 100 },
        //   { name: 'Machiato', category: 'coffee', price: 130, description: 'Espresso with a dash of milk', stock: 100 },
        //   { name: 'Americano', category: 'coffee', price: 140, description: 'Espresso with hot water', stock: 100 },
        //   { name: 'Turska Kafa', category: 'coffee', price: 100, description: 'Traditional Turkish coffee', stock: 100 },
        //   { name: 'Nescafe', category: 'coffee', price: 110, description: 'Instant coffee with hot water', stock: 100 },
        //   { name: 'Mocha', category: 'coffee', price: 170, description: 'Espresso with chocolate and milk', stock: 100 },
        //   { name: 'Flat White', category: 'coffee', price: 160, description: 'Espresso with microfoam', stock: 100 },
        //   { name: 'Ristretto', category: 'coffee', price: 120, description: 'Concentrated espresso shot', stock: 100 },
        //
        //   // SOKOVI
        //   { name: 'Coca Cola', category: 'soda', price: 120, description: 'Classic carbonated soft drink', stock: 100 },
        //   { name: 'Fanta', category: 'soda', price: 120, description: 'Orange flavored soda', stock: 100 },
        //   { name: 'Sprite', category: 'soda', price: 120, description: 'Lemon-lime flavored soda', stock: 100 },
        //   { name: 'Pepsi', category: 'soda', price: 120, description: 'Pepsi cola soft drink', stock: 100 },
        //   { name: 'Schweppes', category: 'soda', price: 130, description: 'Premium tonic water', stock: 100 },
        //   { name: 'Red Bull', category: 'energy', price: 180, description: 'Energy drink with caffeine', stock: 100 },
        //   { name: 'Monster', category: 'energy', price: 200, description: 'High energy drink', stock: 100 },
        //   { name: 'Cedevita', category: 'soda', price: 100, description: 'Vitamin drink powder', stock: 100 },
        //
        //   // ŽESTOKA PIĆA
        //   { name: 'Rakija šljiva', category: 'spirits', price: 250, description: 'Plum brandy (šljivovica)', stock: 100 },
        //   { name: 'Rakija kajsija', category: 'spirits', price: 270, description: 'Apricot brandy', stock: 100 },
        //   { name: 'Rakija dunja', category: 'spirits', price: 270, description: 'Quince brandy', stock: 100 },
        //   { name: 'Rakija loza', category: 'spirits', price: 250, description: 'Grape brandy', stock: 100 },
        //   { name: 'Vodka', category: 'spirits', price: 300, description: 'Premium vodka shot', stock: 100 },
        //   { name: 'Whiskey Jameson', category: 'spirits', price: 350, description: 'Jameson Irish whiskey', stock: 100 },
        //   { name: 'Whiskey Jack Daniel’s', category: 'spirits', price: 370, description: 'Jack Daniel’s Tennessee whiskey', stock: 100 },
        //   { name: 'Whiskey Ballantine’s', category: 'spirits', price: 360, description: 'Ballantine’s Scotch whisky', stock: 100 },
        //   { name: 'Rum Havana Club', category: 'spirits', price: 320, description: 'Havana Club white rum', stock: 100 },
        //   { name: 'Rum Captain Morgan', category: 'spirits', price: 340, description: 'Captain Morgan spiced rum', stock: 100 },
        //   { name: 'Gin Beefeater', category: 'spirits', price: 340, description: 'Beefeater London dry gin', stock: 100 },
        //   { name: 'Gin Bombay Sapphire', category: 'spirits', price: 360, description: 'Bombay Sapphire gin', stock: 100 },
        //   { name: 'Tequila Olmeca', category: 'spirits', price: 360, description: 'Olmeca tequila shot', stock: 100 },
        //   { name: 'Tequila Sierra', category: 'spirits', price: 370, description: 'Sierra tequila shot', stock: 100 },
        //   { name: 'Cognac Hennessy', category: 'spirits', price: 400, description: 'Hennessy French cognac', stock: 100 },
        //   { name: 'Cognac Courvoisier', category: 'spirits', price: 420, description: 'Courvoisier French cognac', stock: 100 },
        //   { name: 'Absinthe', category: 'spirits', price: 450, description: 'Green fairy spirit', stock: 100 },
        //   { name: 'Jägermeister', category: 'spirits', price: 320, description: 'Herbal liqueur', stock: 100 },
        //   { name: 'Baileys', category: 'spirits', price: 320, description: 'Irish cream liqueur', stock: 100 },
        //   { name: 'Amaretto', category: 'spirits', price: 320, description: 'Almond liqueur', stock: 100 },
        //
        //   // PIVA
        //   { name: 'Jelen', category: 'beer', price: 150, description: 'Serbian lager beer', stock: 100 },
        //   { name: 'Lav', category: 'beer', price: 140, description: 'Serbian lager beer', stock: 100 },
        //   { name: 'Zaječarsko', category: 'beer', price: 150, description: 'Serbian lager beer', stock: 100 },
        //   { name: 'Heineken', category: 'beer', price: 180, description: 'Dutch premium lager', stock: 100 },
        //   { name: 'Corona', category: 'beer', price: 200, description: 'Mexican lager with lime', stock: 100 },
        //   { name: 'Stella Artois', category: 'beer', price: 190, description: 'Belgian premium lager', stock: 100 },
        //   { name: 'Tuborg', category: 'beer', price: 160, description: 'Danish lager beer', stock: 100 },
        //   { name: 'Guinness', category: 'beer', price: 220, description: 'Irish dry stout', stock: 100 },
        //   { name: 'Paulaner', category: 'beer', price: 230, description: 'German wheat beer', stock: 100 },
        //   { name: 'Kozel', category: 'beer', price: 180, description: 'Czech dark lager', stock: 100 },
        //   { name: 'Budweiser', category: 'beer', price: 180, description: 'American lager', stock: 100 },
        //   { name: 'IPA', category: 'beer', price: 210, description: 'India Pale Ale', stock: 100 },
        //   { name: 'Pilsner', category: 'beer', price: 190, description: 'Pilsner style beer', stock: 100 },
        //
        //   // VINA
        //   { name: 'Vranac', category: 'wine', price: 220, description: 'Red wine, Vranac grape', stock: 100 },
        //   { name: 'Merlot', category: 'wine', price: 240, description: 'Red wine, Merlot grape', stock: 100 },
        //   { name: 'Cabernet Sauvignon', category: 'wine', price: 250, description: 'Red wine, Cabernet Sauvignon grape', stock: 100 },
        //   { name: 'Prokupac', category: 'wine', price: 210, description: 'Serbian red wine', stock: 100 },
        //   { name: 'Chardonnay', category: 'wine', price: 230, description: 'White wine, Chardonnay grape', stock: 100 },
        //   { name: 'Sauvignon Blanc', category: 'wine', price: 230, description: 'White wine, Sauvignon Blanc grape', stock: 100 },
        //   { name: 'Graševina', category: 'wine', price: 210, description: 'White wine, Graševina grape', stock: 100 },
        //   { name: 'Rose', category: 'wine', price: 220, description: 'Rosé wine', stock: 100 },
        //   { name: 'Prosecco', category: 'wine', price: 260, description: 'Italian sparkling wine', stock: 100 },
        //   { name: 'Šampanjac', category: 'wine', price: 500, description: 'Champagne', stock: 100 },
        //   { name: 'Desertno vino', category: 'wine', price: 300, description: 'Sweet dessert wine', stock: 100 },
        //
        //   // VODE
        //   { name: 'Rosa Voda', category: 'water', price: 80, description: 'Natural spring water', stock: 100 },
        //   { name: 'Knjaz Miloš', category: 'water', price: 90, description: 'Premium mineral water', stock: 100 },
        //   { name: 'Aqua Viva', category: 'water', price: 70, description: 'Pure drinking water', stock: 100 },
        //   { name: 'Jana', category: 'water', price: 85, description: 'Natural mineral water', stock: 100 },
        //   { name: 'Voda sa Limunom', category: 'water', price: 100, description: 'Water with fresh lemon', stock: 100 },
        //   { name: 'Voda sa Limetom', category: 'water', price: 100, description: 'Water with fresh lime', stock: 100 },
        //
        //   // KOKTELI
        //   { name: 'Mojito', category: 'cocktails', price: 280, description: 'Rum, mint, lime and soda', stock: 100 },
        //   { name: 'Margarita', category: 'cocktails', price: 320, description: 'Tequila, lime and triple sec', stock: 100 },
        //   { name: 'Martini', category: 'cocktails', price: 350, description: 'Gin and vermouth cocktail', stock: 100 },
        //   { name: 'Negroni', category: 'cocktails', price: 380, description: 'Gin, vermouth and campari', stock: 100 },
        //   { name: 'Old Fashioned', category: 'cocktails', price: 400, description: 'Whiskey, bitters and sugar', stock: 100 },
        //   { name: 'Manhattan', category: 'cocktails', price: 420, description: 'Whiskey and vermouth cocktail', stock: 100 },
        //   { name: 'Daiquiri', category: 'cocktails', price: 300, description: 'Rum, lime and sugar', stock: 100 },
        //   { name: 'Cosmopolitan', category: 'cocktails', price: 360, description: 'Vodka, cranberry and lime', stock: 100 },
        //   { name: 'Pina Colada', category: 'cocktails', price: 320, description: 'Rum, coconut and pineapple', stock: 100 },
        //   { name: 'Sex on the Beach', category: 'cocktails', price: 340, description: 'Vodka, peach and cranberry', stock: 100 },
        //   { name: 'Long Island Iced Tea', category: 'cocktails', price: 380, description: 'Multiple spirits with cola', stock: 100 },
        //   { name: 'Blue Lagoon', category: 'cocktails', price: 300, description: 'Vodka, blue curaçao and lemon', stock: 100 },
        //   { name: 'White Russian', category: 'cocktails', price: 360, description: 'Vodka, coffee liqueur and cream', stock: 100 },
        //   { name: 'Black Russian', category: 'cocktails', price: 320, description: 'Vodka and coffee liqueur', stock: 100 },
        //   { name: 'Gin Tonic', category: 'cocktails', price: 280, description: 'Gin and tonic water', stock: 100 },
        //   { name: 'Rum Cola', category: 'cocktails', price: 260, description: 'Rum and cola', stock: 100 },
        //   { name: 'Whiskey Sour', category: 'cocktails', price: 320, description: 'Whiskey, lemon and sugar', stock: 100 },
        //
        //   // TOPLI NAPITCI
        //   { name: 'Čaj', category: 'tea', price: 80, description: 'Hot tea selection', stock: 100 },
        //   { name: 'Kamilica', category: 'tea', price: 90, description: 'Chamomile herbal tea', stock: 100 },
        //   { name: 'Nana', category: 'tea', price: 90, description: 'Mint herbal tea', stock: 100 },
        //   { name: 'Zeleni Čaj', category: 'tea', price: 100, description: 'Green tea', stock: 100 },
        //   { name: 'Crni Čaj', category: 'tea', price: 80, description: 'Black tea', stock: 100 },
        //   { name: 'Topla Čokolada', category: 'tea', price: 140, description: 'Hot chocolate with milk', stock: 100 }
        // ];
        // for (const item of menuItems) {
        //   await connection.execute(
        //     'INSERT INTO menu_items (name, category, price, description, stock) VALUES (?, ?, ?, ?, ?)',
        //     [item.name, item.category, item.price, item.description, item.stock]
        //   );
        // }

        // Insert default tables SAMO AKO NEMA NIJEDNOG
        const [tableCountRows] = await connection.execute('SELECT COUNT(*) as count FROM tables');
        if (tableCountRows[0].count === 0) {
            const tablePositions = [
                // Indoor tables (1-12)
                { number: 1, x: 100, y: 50, location: 'indoor' },
                { number: 2, x: 200, y: 50, location: 'indoor' },
                { number: 3, x: 300, y: 50, location: 'indoor' },
                { number: 4, x: 100, y: 150, location: 'indoor' },
                { number: 5, x: 200, y: 150, location: 'indoor' },
                { number: 6, x: 300, y: 150, location: 'indoor' },
                { number: 7, x: 100, y: 250, location: 'indoor' },
                { number: 8, x: 200, y: 250, location: 'indoor' },
                { number: 9, x: 300, y: 250, location: 'indoor' },
                { number: 10, x: 100, y: 350, location: 'indoor' },
                { number: 11, x: 200, y: 350, location: 'indoor' },
                { number: 12, x: 300, y: 350, location: 'indoor' },
                // Outdoor tables (13-30)
                { number: 13, x: 500, y: 50, location: 'outdoor' },
                { number: 14, x: 600, y: 50, location: 'outdoor' },
                { number: 15, x: 700, y: 50, location: 'outdoor' },
                { number: 16, x: 500, y: 150, location: 'outdoor' },
                { number: 17, x: 600, y: 150, location: 'outdoor' },
                { number: 18, x: 700, y: 150, location: 'outdoor' },
                { number: 19, x: 500, y: 250, location: 'outdoor' },
                { number: 20, x: 600, y: 250, location: 'outdoor' },
                { number: 21, x: 700, y: 250, location: 'outdoor' },
                { number: 22, x: 500, y: 350, location: 'outdoor' },
                { number: 23, x: 600, y: 350, location: 'outdoor' },
                { number: 24, x: 700, y: 350, location: 'outdoor' },
                { number: 25, x: 500, y: 450, location: 'outdoor' },
                { number: 26, x: 600, y: 450, location: 'outdoor' },
                { number: 27, x: 700, y: 450, location: 'outdoor' },
                { number: 28, x: 500, y: 550, location: 'outdoor' },
                { number: 29, x: 600, y: 550, location: 'outdoor' },
                { number: 30, x: 700, y: 550, location: 'outdoor' }
            ];
            for (const table of tablePositions) {
                await connection.execute(
                    'INSERT IGNORE INTO tables (table_number, qr_code, x_position, y_position, location) VALUES (?, ?, ?, ?, ?)',
                    [table.number, `TABLE_${table.number.toString().padStart(3, '0')}`, table.x, table.y, table.location]
                );
            }
        }

        // Force update all tables with correct location
        await connection.execute(`
      UPDATE tables 
      SET location = 'indoor' 
      WHERE table_number <= 12
    `);

        await connection.execute(`
      UPDATE tables 
      SET location = 'outdoor' 
      WHERE table_number > 12
    `);

        console.log('Updated table locations:');
        const [updatedTables] = await connection.execute('SELECT table_number, location FROM tables ORDER BY table_number');
        console.log(updatedTables);

        // Funkcija za postavljanje default pozicija stolova
        await setDefaultTablePositions(connection);

        connection.release();
        console.log('Default data inserted successfully');

    } catch (error) {
        console.error('Error inserting default data:', error);
        throw error;
    }
};

// Funkcija za postavljanje default pozicija stolova
async function setDefaultTablePositions(connection) {
    try {
        // Pronađi sve stolove koji imaju x_position=0 i y_position=0
        const [tables] = await connection.execute('SELECT * FROM tables WHERE x_position = 0 AND y_position = 0');
        if (tables.length > 0) {
            console.log('Postavljam default pozicije za stolove...');
            let indoorIndex = 0;
            let outdoorIndex = 0;
            for (let i = 0; i < tables.length; i++) {
                const table = tables[i];
                let x, y;
                if (table.location === 'indoor') {
                    // Unutrašnji stolovi - grid
                    const row = Math.floor(indoorIndex / 4);
                    const col = indoorIndex % 4;
                    x = 100 + (col * 120);
                    y = 100 + (row * 120);
                    indoorIndex++;
                } else {
                    // Spoljašnji stolovi - krug
                    const angle = (outdoorIndex * 45) * (Math.PI / 180);
                    x = 400 + Math.cos(angle) * 150;
                    y = 300 + Math.sin(angle) * 150;
                    outdoorIndex++;
                }
                await connection.execute(
                    'UPDATE tables SET x_position = ?, y_position = ? WHERE id = ?',
                    [Math.round(x), Math.round(y), table.id]
                );
            }
            console.log('Default pozicije stolova postavljene');
        }
    } catch (error) {
        console.error('Greška pri postavljanju default pozicija:', error);
    }
}

// Database helper functions
const dbHelpers = {
    // Get all waiters
    getWaiters: async () => {
        const [rows] = await pool.execute('SELECT * FROM waiters');
        return rows;
    },

    // Get waiter by username
    getWaiterByUsername: async (username) => {
        const [rows] = await pool.execute('SELECT * FROM waiters WHERE username = ?', [username]);
        return rows[0];
    },

    // Get waiter by ID
    getWaiterById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM waiters WHERE id = ?', [id]);
        return rows[0];
    },

    // Get tables with positions
    getTablesWithPositions: async () => {
        const [rows] = await pool.execute('SELECT * FROM tables ORDER BY location, table_number');
        console.log('Database: Loaded tables with positions:', rows.map(t => ({
            id: t.id,
            table_number: t.table_number,
            x_position: t.x_position,
            y_position: t.y_position
        })));
        return rows;
    },

    // Update table position
    updateTablePosition: async (id, x, y) => {
        console.log(`Database: Updating table ${id} position to x=${x}, y=${y}`);
        const [result] = await pool.execute(
            'UPDATE tables SET x_position = ?, y_position = ? WHERE id = ?',
            [x, y, id]
        );
        console.log(`Database: Update result:`, result);

        // Verify the update
        const [verify] = await pool.execute(
            'SELECT x_position, y_position FROM tables WHERE id = ?',
            [id]
        );
        console.log(`Database: Verified position for table ${id}:`, verify[0]);

        return result;
    },

    // Get all tables
    getTables: async () => {
        const [rows] = await pool.execute('SELECT * FROM tables');
        return rows;
    },

    // Get table by QR code
    getTableByQRCode: async (qrCode) => {
        const [rows] = await pool.execute('SELECT * FROM tables WHERE qr_code = ?', [qrCode]);
        return rows[0];
    },

    // Get table by number
    getTableByNumber: async (tableNumber) => {
        const [rows] = await pool.execute('SELECT * FROM tables WHERE table_number = ?', [tableNumber]);
        return rows[0];
    },

    // Get tables with order details
    getTablesWithOrders: async () => {
        const [tables] = await pool.execute('SELECT * FROM tables ORDER BY location, table_number');

        for (let table of tables) {
            // Get active orders for this table
            const [orders] = await pool.execute(`
        SELECT o.*, w.name as waiter_name
        FROM orders o
        LEFT JOIN waiters w ON o.waiter_id = w.id
        WHERE o.table_id = ? AND o.status IN ('pending', 'approved')
        ORDER BY o.created_at DESC
      `, [table.id]);

            // Get order items for each order
            for (let order of orders) {
                const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
                order.items = items;
            }

            table.orders = orders;
            table.pendingOrders = orders.filter(o => o.status === 'pending');
            table.approvedOrders = orders.filter(o => o.status === 'approved');
            table.totalOrders = orders.length;
        }

        return tables;
    },

    // Get tables positions view (for interactive map)
    getTablesPositionsView: async () => {
        const [tables] = await pool.execute(`
      SELECT id, table_number, x_position, y_position, location, current_order_count
      FROM tables 
      ORDER BY table_number
    `);
        return tables;
    },

    // Get all orders with items
    getOrders: async (waiterId = null) => {
        let query = `
      SELECT o.*, t.table_number, w.name as waiter_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN waiters w ON o.waiter_id = w.id
    `;

        let params = [];

        // If waiterId is provided, only show orders that this waiter approved or pending orders
        if (waiterId) {
            query += ` WHERE (o.waiter_id = ? OR o.status = 'pending')`;
            params.push(waiterId);
        }

        query += ` ORDER BY o.created_at DESC`;

        const [orders] = await pool.execute(query, params);

        // Get items for each order
        for (let order of orders) {
            const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            order.items = items;
        }

        return orders;
    },

    // Get order by ID
    getOrderById: async (id) => {
        const [orders] = await pool.execute(`
      SELECT o.*, t.table_number, w.name as waiter_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN waiters w ON o.waiter_id = w.id
      WHERE o.id = ?
    `, [id]);

        if (orders.length === 0) {
            return null;
        }

        const order = orders[0];
        const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;

        return order;
    },

    // Create new order
    createOrder: async (tableId, items, totalPrice) => {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Get current order count for table
            const [tables] = await connection.execute('SELECT current_order_count FROM tables WHERE id = ?', [tableId]);
            const table = tables[0];
            const orderNumber = (table.current_order_count || 0) + 1;

            // Create order
            const [result] = await connection.execute(`
        INSERT INTO orders (table_id, order_number, total_price, status)
        VALUES (?, ?, ?, 'pending')
      `, [tableId, orderNumber, totalPrice]);

            const orderId = result.insertId;

            // Insert order items
            for (const item of items) {
                await connection.execute(`
          INSERT INTO order_items (order_id, item_id, name, price, quantity)
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, item.id, item.name, item.price, item.quantity]);
            }

            // Update table order count
            await connection.execute('UPDATE tables SET current_order_count = ? WHERE id = ?', [orderNumber, tableId]);

            await connection.commit();

            // Get the created order
            return await dbHelpers.getOrderById(orderId);

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Update order status
    updateOrderStatus: async (orderId, status, waiterId = null) => {
        if (waiterId) {
            await pool.execute(`
        UPDATE orders 
        SET status = ?, waiter_id = ?
        WHERE id = ?
      `, [status, waiterId, orderId]);
        } else {
            await pool.execute(`
        UPDATE orders 
        SET status = ?
        WHERE id = ?
      `, [status, orderId]);
        }

        return await dbHelpers.getOrderById(orderId);
    },

    // Delete order
    deleteOrder: async (orderId) => {
        await pool.execute('DELETE FROM orders WHERE id = ?', [orderId]);
        return { message: 'Order deleted successfully' };
    },

    // Get menu items
    getMenuItems: async () => {
        const [rows] = await pool.execute('SELECT * FROM menu_items WHERE available = 1');
        return rows;
    },

    // Get statistics
    getStatistics: async () => {
        console.log('=== Getting statistics ===');

        // Product statistics
        const [productStats] = await pool.execute(`
      SELECT 
        oi.name,
        SUM(oi.quantity) as totalQuantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
        COUNT(DISTINCT oi.order_id) as orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      GROUP BY oi.name
    `);
        console.log('Product stats:', productStats);

        // Waiter statistics
        const [waiterStats] = await pool.execute(`
      SELECT 
        w.id,
        w.name,
        COUNT(o.id) as ordersHandled,
        COALESCE(SUM(o.total_price), 0) as totalRevenue,
        COALESCE(SUM(oi.quantity), 0) as itemsSold
      FROM waiters w
      LEFT JOIN orders o ON w.id = o.waiter_id AND o.status IN ('approved', 'completed')
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE w.role = 'waiter'
      GROUP BY w.id, w.name
      ORDER BY w.name
    `);
        console.log('Waiter stats:', waiterStats);

        // Overall statistics
        const [overallStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total_price), 0) as totalRevenue,
        COALESCE(AVG(total_price), 0) as averageOrderValue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedOrders
      FROM orders
    `);
        console.log('Overall stats:', overallStats[0]);

        // Debug: Check all waiters
        const [allWaiters] = await pool.execute('SELECT * FROM waiters WHERE role = "waiter"');
        console.log('All waiters:', allWaiters);

        // Debug: Check all orders with waiter_id
        const [ordersWithWaiters] = await pool.execute('SELECT id, waiter_id, status FROM orders WHERE waiter_id IS NOT NULL');
        console.log('Orders with waiters:', ordersWithWaiters);

        return {
            productStats,
            waiterStats,
            overallStats: overallStats[0]
        };
    },

    // Get waiter shift statistics
    getWaiterShiftStats: async (waiterId) => {
        console.log('=== Getting waiter shift stats for waiter ID:', waiterId, '===');

        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        console.log('Today:', today);

        // Product statistics for today - include all orders approved by this waiter
        const [productStats] = await pool.execute(`
      SELECT 
        oi.name,
        SUM(oi.quantity) as quantitySold,
        COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
        COUNT(DISTINCT oi.order_id) as orders
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.waiter_id = ? 
        AND o.status IN ('approved', 'completed')
        AND DATE(o.created_at) = ?
      GROUP BY oi.name
      ORDER BY quantitySold DESC
    `, [waiterId, today]);
        console.log('Product stats for waiter:', productStats);

        // Overall statistics for today - FIXED LOGIC
        // 1. Get orders count and revenue from orders table (no LEFT JOIN to avoid duplicates)
        const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total_price), 0) as totalRevenue,
        COALESCE(AVG(total_price), 0) as averageOrderValue
      FROM orders o
      WHERE o.waiter_id = ? 
        AND o.status IN ('approved', 'completed')
        AND DATE(o.created_at) = ?
    `, [waiterId, today]);
        console.log('Order stats for waiter:', orderStats[0]);

        // 2. Get total items count from order_items table
        const [itemStats] = await pool.execute(`
      SELECT 
        COALESCE(SUM(oi.quantity), 0) as totalItems
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.waiter_id = ? 
        AND o.status IN ('approved', 'completed')
        AND DATE(o.created_at) = ?
    `, [waiterId, today]);
        console.log('Item stats for waiter:', itemStats[0]);

        // Debug: Check all orders for this waiter today
        const [debugOrders] = await pool.execute(`
      SELECT id, status, waiter_id, total_price, created_at 
      FROM orders 
      WHERE waiter_id = ? AND DATE(created_at) = ?
    `, [waiterId, today]);
        console.log('Debug - All orders for waiter today:', debugOrders);

        return {
            productStats,
            totalOrders: orderStats[0]?.totalOrders || 0,
            totalRevenue: orderStats[0]?.totalRevenue || 0,
            averageOrderValue: orderStats[0]?.averageOrderValue || 0,
            totalItems: itemStats[0]?.totalItems || 0
        };
    },

    // Get shift statistics (alias for getWaiterShiftStats)
    getShiftStats: async (waiterId) => {
        return await dbHelpers.getWaiterShiftStats(waiterId);
    },

    // Create waiter statistics table
    createWaiterStatsTable: async () => {
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS waiter_statistics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waiter_id INT NOT NULL,
        date DATE NOT NULL,
        shift_start DATETIME NOT NULL,
        shift_end DATETIME NULL,
        total_orders INT DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0.00,
        items_sold JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (waiter_id) REFERENCES waiters(id) ON DELETE CASCADE,
        UNIQUE KEY unique_waiter_date (waiter_id, date)
      )
    `;

        try {
            await pool.execute(createTableSQL);
            console.log('Waiter statistics table created successfully');
        } catch (error) {
            console.error('Error creating waiter statistics table:', error);
            throw error;
        }
    },



    // Get or create today's statistics for waiter
    getOrCreateTodayStats: async (waiterId) => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        try {
            // Check if stats exist for today
            const [existingStats] = await pool.execute(
                'SELECT * FROM waiter_statistics WHERE waiter_id = ? AND date = ?',
                [waiterId, today]
            );

            if (existingStats.length > 0) {
                return existingStats[0];
            }

            // Create new stats for today
            const [result] = await pool.execute(
                `INSERT INTO waiter_statistics 
         (waiter_id, date, shift_start, total_orders, total_revenue, items_sold) 
         VALUES (?, ?, ?, 0, 0.00, '[]')`,
                [waiterId, today, now]
            );

            return {
                id: result.insertId,
                waiter_id: waiterId,
                date: today,
                shift_start: now,
                total_orders: 0,
                total_revenue: 0.00,
                items_sold: '[]'
            };
        } catch (error) {
            console.error('Error getting/creating today stats:', error);
            throw error;
        }
    },

    // Update waiter statistics when order is approved
    updateWaiterStats: async (waiterId, orderData) => {
        try {
            // Get today's stats
            const stats = await dbHelpers.getOrCreateTodayStats(waiterId);

            // Parse existing items_sold
            const existingItems = JSON.parse(stats.items_sold || '[]');

            // Add new items to statistics
            const newItems = orderData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity
            }));

            // Merge with existing items
            const mergedItems = [...existingItems, ...newItems];

            // Calculate totals
            const totalRevenue = parseFloat(stats.total_revenue) + parseFloat(orderData.total_price);
            const totalOrders = stats.total_orders + 1;

            // Update statistics
            await pool.execute(
                `UPDATE waiter_statistics 
         SET total_orders = ?, total_revenue = ?, items_sold = ?, updated_at = NOW()
         WHERE id = ?`,
                [totalOrders, totalRevenue, JSON.stringify(mergedItems), stats.id]
            );

            console.log(`Updated stats for waiter ${waiterId}: ${totalOrders} orders, ${totalRevenue} revenue`);

            return {
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                items_sold: mergedItems
            };
        } catch (error) {
            console.error('Error updating waiter stats:', error);
            throw error;
        }
    },

    // Get waiter statistics for today (current shift)
    getWaiterTodayStats: async (waiterId) => {
        try {
            // Get today's date
            const today = new Date().toISOString().split('T')[0];

            // Get product statistics for today - include all orders processed by this waiter (approved, completed)
            const [productStats] = await pool.execute(`
        SELECT 
          oi.name,
          SUM(oi.quantity) as quantitySold,
          COALESCE(SUM(oi.price * oi.quantity), 0) as totalRevenue,
          COUNT(DISTINCT oi.order_id) as orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.waiter_id = ? 
          AND o.status IN ('approved', 'completed')
          AND DATE(o.created_at) = ?
        GROUP BY oi.name
        ORDER BY quantitySold DESC
      `, [waiterId, today]);

            // Get overall statistics for today - FIXED LOGIC
            // 1. Get orders count and revenue from orders table (no LEFT JOIN to avoid duplicates)
            const [orderStats] = await pool.execute(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(total_price), 0) as totalRevenue,
          COALESCE(AVG(total_price), 0) as averageOrderValue
        FROM orders o
        WHERE o.waiter_id = ? 
          AND o.status IN ('approved', 'completed')
          AND DATE(o.created_at) = ?
      `, [waiterId, today]);

            // 2. Get total items count from order_items table
            const [itemStats] = await pool.execute(`
        SELECT 
          COALESCE(SUM(oi.quantity), 0) as totalItems
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.waiter_id = ? 
          AND o.status IN ('approved', 'completed')
          AND DATE(o.created_at) = ?
      `, [waiterId, today]);

            // Get or create today's stats record
            const stats = await dbHelpers.getOrCreateTodayStats(waiterId);

            const result = {
                total_orders: orderStats[0]?.totalOrders || 0,
                total_revenue: parseFloat(orderStats[0]?.totalRevenue || 0),
                average_order_value: parseFloat(orderStats[0]?.averageOrderValue || 0),
                total_items: itemStats[0]?.totalItems || 0,
                product_stats: productStats,
                shift_start: stats.shift_start,
                date: stats.date
            };

            console.log('getWaiterTodayStats result:', result);
            console.log('product_stats:', result.product_stats);

            return result;
        } catch (error) {
            console.error('Error getting waiter today stats:', error);
            throw error;
        }
    },

    // Reset waiter statistics (end shift)
    resetWaiterStats: async (waiterId) => {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const today = new Date().toISOString().split('T')[0];

        try {
            // Delete all orders for this waiter from today
            await pool.execute(
                `DELETE FROM order_items WHERE order_id IN (
          SELECT id FROM orders WHERE waiter_id = ? AND DATE(created_at) = ?
        )`,
                [waiterId, today]
            );

            // Delete all orders for this waiter from today
            await pool.execute(
                `DELETE FROM orders WHERE waiter_id = ? AND DATE(created_at) = ?`,
                [waiterId, today]
            );

            // Delete waiter statistics for today
            await pool.execute(
                `DELETE FROM waiter_statistics WHERE waiter_id = ? AND date = ?`,
                [waiterId, today]
            );

            console.log(`Completely reset all data for waiter ${waiterId} for ${today}`);
            return { success: true, reset_time: now };
        } catch (error) {
            console.error('Error resetting waiter stats:', error);
            throw error;
        }
    },

    // Get historical statistics for waiter
    getWaiterHistoricalStats: async (waiterId, days = 30) => {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM waiter_statistics 
         WHERE waiter_id = ? 
         AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         ORDER BY date DESC`,
                [waiterId, days]
            );

            return rows.map(row => ({
                ...row,
                items_sold: JSON.parse(row.items_sold || '[]')
            }));
        } catch (error) {
            console.error('Error getting historical stats:', error);
            throw error;
        }
    },

    // Get all menu items
    getMenuItems: async () => {
        try {
            const [rows] = await pool.execute('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name');
            return rows;
        } catch (error) {
            console.error('Error getting menu items:', error);
            throw error;
        }
    },

    // Add new menu item
    addMenuItem: async (itemData) => {
        try {
            const stock = itemData.initialStock || 0;
            const [result] = await pool.execute(
                'INSERT INTO menu_items (name, category, price, description, stock) VALUES (?, ?, ?, ?, ?)',
                [itemData.name, itemData.category, itemData.price, itemData.description, stock]
            );

            const menuItemId = result.insertId;
            console.log(`Added menu item ${itemData.name} with stock ${stock}`);

            return { id: menuItemId, ...itemData, stock };
        } catch (error) {
            console.error('Error adding menu item:', error);
            throw error;
        }
    },

    // Get inventory (menu items with stock)
    getInventory: async () => {
        try {
            const [rows] = await pool.execute(`
        SELECT 
          id,
          name,
          category,
          price,
          description,
          stock
        FROM menu_items
        ORDER BY category, name
      `);
            return rows;
        } catch (error) {
            console.error('Error getting inventory:', error);
            throw error;
        }
    },

    // Update inventory stock
    updateInventoryStock: async (itemId, newStock) => {
        try {
            await pool.execute(
                'UPDATE menu_items SET stock = ? WHERE id = ?',
                [newStock, itemId]
            );
            return { success: true };
        } catch (error) {
            console.error('Error updating inventory stock:', error);
            throw error;
        }
    },

    // Decrease inventory when order is approved
    decreaseInventory: async (orderItems) => {
        try {
            console.log('=== DECREASE INVENTORY FUNCTION START ===');
            console.log('Order items received:', JSON.stringify(orderItems, null, 2));

            for (const item of orderItems) {
                console.log(`\n--- Processing item: ${item.name} ---`);
                console.log(`Item details:`, {
                    id: item.id,
                    item_id: item.item_id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                });

                if (!item.item_id) {
                    console.log(`ERROR: item_id is missing for item ${item.name}`);
                    continue;
                }

                // Check current stock before update
                const [currentStock] = await pool.execute(
                    'SELECT stock FROM menu_items WHERE id = ?',
                    [item.item_id]
                );
                console.log(`Current stock for item ${item.name}: ${currentStock[0]?.stock || 'Not found'}`);

                if (currentStock.length === 0) {
                    console.log(`ERROR: No menu item found with id ${item.item_id}`);
                    continue;
                }

                const affectedRows = await pool.execute(
                    'UPDATE menu_items SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.item_id]
                );
                console.log(`UPDATE affected rows: ${affectedRows[0].affectedRows}`);

                // Check stock after update
                const [newStock] = await pool.execute(
                    'SELECT stock FROM menu_items WHERE id = ?',
                    [item.item_id]
                );
                console.log(`New stock for item ${item.name}: ${newStock[0]?.stock || 'Not found'}`);
            }

            console.log('=== DECREASE INVENTORY FUNCTION COMPLETED ===');
            return { success: true };
        } catch (error) {
            console.error('=== DECREASE INVENTORY FUNCTION ERROR ===');
            console.error('Error decreasing inventory:', error);
            throw error;
        }
    }
};

// Dodaj/izmeni helper za ažuriranje pozicije stola
async function updateTablePosition(id, x, y) {
    const [result] = await pool.execute(
        'UPDATE tables SET x_position = ?, y_position = ? WHERE id = ?',
        [x, y, id]
    );
    return result;
}

// Helper za kreiranje novog stola
async function createTable(tableNumber, xPosition, yPosition, location = 'indoor') {
    const qrCode = `table_${tableNumber}_${Date.now()}`;
    const [result] = await pool.execute(
        'INSERT INTO tables (table_number, qr_code, x_position, y_position, location) VALUES (?, ?, ?, ?, ?)',
        [tableNumber, qrCode, xPosition, yPosition, location]
    );
    return result.insertId;
}

module.exports = { pool, dbHelpers, initDatabase };
module.exports.updateTablePosition = updateTablePosition;
module.exports.createTable = createTable;
module.exports.updateWaiterStats = dbHelpers.updateWaiterStats;
module.exports.decreaseInventory = dbHelpers.decreaseInventory;