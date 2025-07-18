export const initScript = `
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
        created_at TIMESTAMPTZ DEFAULT now
    (
    )
        );

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
        created_at TIMESTAMPTZ DEFAULT now
    (
    )
        );

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
        created_at TIMESTAMPTZ DEFAULT now
    (
    ),
        updated_at TIMESTAMPTZ DEFAULT now
    (
    )
        );

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
        created_at TIMESTAMPTZ DEFAULT now
    (
    ),
        updated_at TIMESTAMPTZ DEFAULT now
    (
    )
        );

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
        created_at TIMESTAMPTZ DEFAULT now
    (
    )
        );

-- idempotent column adds (ignore errors if already present)
    DO
    $$
    BEGIN
    ALTER TABLE tables
        ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'indoor';
    ALTER TABLE tables
        ADD COLUMN IF NOT EXISTS x_position INT DEFAULT 0;
    ALTER TABLE tables
        ADD COLUMN IF NOT EXISTS y_position INT DEFAULT 0;
    ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;
    ALTER TABLE menu_items
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    END $$;
`;