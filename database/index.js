const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'stockalerts.db');

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('📦 Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    async initialize() {
        await this.connect();
        await this.createTables();
    }

    async createTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                phone_number TEXT,
                carrier TEXT,
                email_reminders BOOLEAN DEFAULT 1,
                email_summary BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Magic links table for authentication
            `CREATE TABLE IF NOT EXISTS magic_links (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // User stocks table (updated to allow multiple alerts per stock)
            `CREATE TABLE IF NOT EXISTS user_stocks (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT,
                threshold REAL NOT NULL,
                alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below')),
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Alert history table
            `CREATE TABLE IF NOT EXISTS alert_history (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                stock_id TEXT NOT NULL,
                symbol TEXT NOT NULL,
                price REAL NOT NULL,
                threshold REAL NOT NULL,
                alert_type TEXT NOT NULL,
                message TEXT NOT NULL,
                sent_successfully BOOLEAN DEFAULT 0,
                error_message TEXT,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (stock_id) REFERENCES user_stocks(id) ON DELETE CASCADE
            )`,

            // Stock price cache table
            `CREATE TABLE IF NOT EXISTS stock_prices (
                symbol TEXT PRIMARY KEY,
                current_price REAL,
                change_percent REAL,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Run migration to remove old UNIQUE constraint if needed
        await this.migrateUserStocksTable();

        // Create indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token)',
            'CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email)',
            'CREATE INDEX IF NOT EXISTS idx_user_stocks_user_id ON user_stocks(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_stocks_symbol ON user_stocks(symbol)',
            'CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_alert_history_sent_at ON alert_history(sent_at)'
        ];

        for (const index of indexes) {
            await this.run(index);
        }

        console.log('✅ Database tables initialized');
    }

    async migrateUserStocksTable() {
        try {
            // Check if the old unique constraint exists
            const tableInfo = await this.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_stocks'");

            if (tableInfo.length > 0 && tableInfo[0].sql.includes('UNIQUE(user_id, symbol)')) {
                console.log('🔄 Migrating user_stocks table to allow multiple alerts per stock...');

                // Create new table with updated schema
                await this.run(`CREATE TABLE IF NOT EXISTS user_stocks_new (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    name TEXT,
                    threshold REAL NOT NULL,
                    alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below')),
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`);

                // Copy data from old table
                await this.run(`INSERT INTO user_stocks_new
                    SELECT id, user_id, symbol, name, threshold, alert_type, is_active, created_at, updated_at
                    FROM user_stocks`);

                // Drop old table
                await this.run('DROP TABLE user_stocks');

                // Rename new table
                await this.run('ALTER TABLE user_stocks_new RENAME TO user_stocks');

                console.log('✅ Migration completed - you can now add multiple alerts per stock');
            }
        } catch (error) {
            console.error('Migration error:', error);
            // Don't throw - allow app to continue even if migration fails
        }
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database run error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database all error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('📦 Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Create and export database instance
const database = new Database();

// Initialize database on module load
database.initialize().catch(console.error);

module.exports = database;