const { v4: uuidv4 } = require('uuid');
const database = require('./index');

class UserDatabase {
    // Create or get user by email
    async createOrGetUser(email) {
        try {
            // First, try to get existing user
            let user = await this.getUserByEmail(email);

            if (user) {
                return user;
            }

            // Create new user
            const userId = uuidv4();

            await database.run(
                'INSERT INTO users (id, email) VALUES (?, ?)',
                [userId, email]
            );

            return await this.getUserById(userId);
        } catch (error) {
            console.error('Error creating or getting user:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await database.get(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            if (user) {
                return this.formatUser(user);
            }

            return null;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const user = await database.get(
                'SELECT * FROM users WHERE email = ?',
                [email.toLowerCase()]
            );

            if (user) {
                return this.formatUser(user);
            }

            return null;
        } catch (error) {
            console.error('Error getting user by email:', error);
            throw error;
        }
    }

    async updateUser(userId, updates) {
        try {
            const allowedFields = ['name', 'phone_number', 'carrier', 'email_reminders', 'email_summary'];
            const updateFields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No valid fields to update');
            }

            // Add updated_at timestamp
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(userId);

            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

            await database.run(sql, values);

            return await this.getUserById(userId);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            // Delete user (CASCADE will handle related records)
            const result = await database.run(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Magic link operations
    async createMagicLink(email, token, expiresIn = 3600000) { // 1 hour default
        try {
            const linkId = uuidv4();
            const expiresAt = new Date(Date.now() + expiresIn);

            await database.run(
                'INSERT INTO magic_links (id, email, token, expires_at) VALUES (?, ?, ?, ?)',
                [linkId, email.toLowerCase(), token, expiresAt.toISOString()]
            );

            return {
                id: linkId,
                email: email.toLowerCase(),
                token,
                expiresAt
            };
        } catch (error) {
            console.error('Error creating magic link:', error);
            throw error;
        }
    }

    async getMagicLink(token) {
        try {
            const link = await database.get(
                'SELECT * FROM magic_links WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
                [token]
            );

            return link;
        } catch (error) {
            console.error('Error getting magic link:', error);
            throw error;
        }
    }

    async useMagicLink(token) {
        try {
            const result = await database.run(
                'UPDATE magic_links SET used = 1 WHERE token = ?',
                [token]
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error using magic link:', error);
            throw error;
        }
    }

    async cleanupExpiredMagicLinks() {
        try {
            const result = await database.run(
                'DELETE FROM magic_links WHERE expires_at < datetime("now") OR used = 1'
            );

            return result.changes;
        } catch (error) {
            console.error('Error cleaning up magic links:', error);
            throw error;
        }
    }

    // User stocks operations
    async getUserStocks(userId) {
        try {
            const stocks = await database.all(
                `SELECT us.*, sp.current_price, sp.change_percent, sp.last_updated
                 FROM user_stocks us
                 LEFT JOIN stock_prices sp ON us.symbol = sp.symbol
                 WHERE us.user_id = ? AND us.is_active = 1
                 ORDER BY us.created_at DESC`,
                [userId]
            );

            return stocks.map(stock => ({
                id: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                threshold: stock.threshold,
                alertType: stock.alert_type,
                currentPrice: stock.current_price,
                changePercent: stock.change_percent,
                lastUpdated: stock.last_updated,
                createdAt: stock.created_at,
                updatedAt: stock.updated_at
            }));
        } catch (error) {
            console.error('Error getting user stocks:', error);
            throw error;
        }
    }

    async addUserStock(userId, stockData) {
        try {
            const stockId = uuidv4();
            const { symbol, name, threshold, alertType } = stockData;

            await database.run(
                'INSERT INTO user_stocks (id, user_id, symbol, name, threshold, alert_type) VALUES (?, ?, ?, ?, ?, ?)',
                [stockId, userId, symbol.toUpperCase(), name, threshold, alertType]
            );

            return {
                id: stockId,
                symbol: symbol.toUpperCase(),
                name,
                threshold,
                alertType
            };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                throw new Error('You are already monitoring this stock');
            }
            console.error('Error adding user stock:', error);
            throw error;
        }
    }

    async updateUserStock(userId, stockId, updates) {
        try {
            const allowedFields = ['name', 'threshold', 'alert_type'];
            const updateFields = [];
            const values = [];

            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No valid fields to update');
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(userId, stockId);

            const sql = `UPDATE user_stocks SET ${updateFields.join(', ')} WHERE user_id = ? AND id = ?`;

            const result = await database.run(sql, values);

            if (result.changes === 0) {
                throw new Error('Stock not found or not owned by user');
            }

            return true;
        } catch (error) {
            console.error('Error updating user stock:', error);
            throw error;
        }
    }

    async removeUserStock(userId, stockId) {
        try {
            const result = await database.run(
                'UPDATE user_stocks SET is_active = 0 WHERE user_id = ? AND id = ?',
                [userId, stockId]
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error removing user stock:', error);
            throw error;
        }
    }

    // Alert history operations
    async getUserAlerts(userId, limit = 50) {
        try {
            const alerts = await database.all(
                `SELECT * FROM alert_history
                 WHERE user_id = ?
                 ORDER BY sent_at DESC
                 LIMIT ?`,
                [userId, limit]
            );

            return alerts.map(alert => ({
                id: alert.id,
                symbol: alert.symbol,
                price: alert.price,
                threshold: alert.threshold,
                alertType: alert.alert_type,
                message: alert.message,
                sentSuccessfully: alert.sent_successfully === 1,
                errorMessage: alert.error_message,
                sentAt: alert.sent_at
            }));
        } catch (error) {
            console.error('Error getting user alerts:', error);
            throw error;
        }
    }

    async addAlertHistory(userId, stockId, alertData) {
        try {
            const alertId = uuidv4();
            const { symbol, price, threshold, alertType, message, sentSuccessfully, errorMessage } = alertData;

            await database.run(
                `INSERT INTO alert_history
                 (id, user_id, stock_id, symbol, price, threshold, alert_type, message, sent_successfully, error_message)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [alertId, userId, stockId, symbol, price, threshold, alertType, message, sentSuccessfully ? 1 : 0, errorMessage]
            );

            return alertId;
        } catch (error) {
            console.error('Error adding alert history:', error);
            throw error;
        }
    }

    // Helper method to format user object
    formatUser(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phoneNumber: user.phone_number,
            carrier: user.carrier,
            emailReminders: user.email_reminders === 1,
            emailSummary: user.email_summary === 1,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }
}

module.exports = new UserDatabase();