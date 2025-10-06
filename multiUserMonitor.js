require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const database = require('./database');
const userDb = require('./database/users');
const { sendAlert } = require('./stock-alert-system/src/alertSender');

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

class MultiUserStockMonitor {
    constructor() {
        this.isRunning = false;
        this.lastCheck = null;
    }

    async initialize() {
        try {
            await database.initialize();
            console.log('🚀 Multi-user stock monitor initialized');
        } catch (error) {
            console.error('Failed to initialize monitor:', error);
            throw error;
        }
    }

    async checkAllUserStocks() {
        if (this.isRunning) {
            console.log('⏳ Monitor already running, skipping this cycle');
            return;
        }

        this.isRunning = true;
        this.lastCheck = new Date();

        try {
            console.log(`\n🔍 Starting stock price check at ${this.lastCheck.toISOString()}`);

            // Get all active stocks from all users
            const allStocks = await database.all(`
                SELECT DISTINCT us.*, u.phone_number, u.carrier, u.email
                FROM user_stocks us
                JOIN users u ON us.user_id = u.id
                WHERE us.is_active = 1
                AND u.phone_number IS NOT NULL
                AND u.carrier IS NOT NULL
            `);

            if (allStocks.length === 0) {
                console.log('📭 No stocks to monitor');
                return;
            }

            console.log(`📊 Monitoring ${allStocks.length} stocks across all users`);

            // Group stocks by symbol to minimize API calls
            const stocksBySymbol = {};
            allStocks.forEach(stock => {
                if (!stocksBySymbol[stock.symbol]) {
                    stocksBySymbol[stock.symbol] = [];
                }
                stocksBySymbol[stock.symbol].push(stock);
            });

            // Check each unique symbol
            for (const [symbol, userStocks] of Object.entries(stocksBySymbol)) {
                try {
                    await this.checkStockSymbol(symbol, userStocks);

                    // Small delay between API calls to be respectful
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`Error checking ${symbol}:`, error.message);
                }
            }

            console.log('✅ Stock price check completed\n');

        } catch (error) {
            console.error('Error in stock monitoring cycle:', error);
        } finally {
            this.isRunning = false;
        }
    }

    async checkStockSymbol(symbol, userStocks) {
        try {
            // Get current price
            const currentPrice = await this.getCurrentPrice(symbol);

            if (!currentPrice) {
                console.log(`⚠️ Could not get price for ${symbol}`);
                return;
            }

            console.log(`💰 ${symbol}: $${currentPrice.toFixed(2)}`);

            // Check each user's alert thresholds for this stock
            for (const stock of userStocks) {
                await this.checkUserStockAlert(stock, currentPrice);
            }

        } catch (error) {
            console.error(`Error checking stock ${symbol}:`, error);
        }
    }

    async checkUserStockAlert(stock, currentPrice) {
        try {
            const shouldAlert = this.shouldTriggerAlert(stock, currentPrice);

            if (!shouldAlert) {
                return;
            }

            // Check if we already sent an alert today for this stock
            const today = new Date().toISOString().split('T')[0];
            const existingAlert = await database.get(`
                SELECT * FROM alert_history
                WHERE user_id = ? AND stock_id = ? AND date(sent_at) = ?
                ORDER BY sent_at DESC
                LIMIT 1
            `, [stock.user_id, stock.id, today]);

            if (existingAlert) {
                console.log(`📵 Already alerted user for ${stock.symbol} today`);
                return;
            }

            // Get user details
            const user = await userDb.getUserById(stock.user_id);
            if (!user || !user.phoneNumber || !user.carrier) {
                console.log(`⚠️ User ${stock.user_id} missing phone configuration`);
                return;
            }

            // Get trends (simplified for now)
            const trends = {
                '3mo': 0,
                '6mo': 0,
                '12mo': 0
            };

            // Prepare alert data
            const alertData = {
                symbol: stock.symbol,
                name: stock.name || stock.symbol,
                price: currentPrice,
                change: 0, // Could calculate from previous price
                changePercent: '0.0%',
                threshold: stock.threshold,
                trends: trends,
                chartUrl: `${process.env.CHART_BASE_URL || ''}/chart/${stock.symbol}`
            };

            console.log(`🚨 ALERT: ${stock.symbol} for user ${user.email}`);

            // Set environment variables for this user
            process.env.ALERT_PHONE_NUMBER = user.phoneNumber;
            process.env.CARRIER_OVERRIDE = user.carrier;

            // Send alert
            const alertSent = await sendAlert(alertData);

            // Record alert in history
            await userDb.addAlertHistory(stock.user_id, stock.id, {
                symbol: stock.symbol,
                price: currentPrice,
                threshold: stock.threshold,
                alertType: stock.alert_type,
                message: this.buildAlertMessage(alertData),
                sentSuccessfully: alertSent,
                errorMessage: alertSent ? null : 'Failed to send SMS'
            });

        } catch (error) {
            console.error(`Error checking alert for ${stock.symbol}:`, error);
        }
    }

    shouldTriggerAlert(stock, currentPrice) {
        if (stock.alert_type === 'below') {
            return currentPrice <= stock.threshold;
        } else if (stock.alert_type === 'above') {
            return currentPrice >= stock.threshold;
        }
        return false;
    }

    buildAlertMessage(alertData) {
        return `🔔 ${alertData.symbol} Alert: $${alertData.price.toFixed(2)} (${alertData.changePercent})
${alertData.name}
Threshold: $${alertData.threshold.toFixed(2)}
📊 Chart: ${alertData.chartUrl}`.trim();
    }

    async getCurrentPrice(symbol) {
        try {
            if (!ALPHA_VANTAGE_KEY) {
                console.error('Alpha Vantage API key not configured');
                return null;
            }

            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
            const response = await axios.get(url, { timeout: 10000 });

            const quote = response.data['Global Quote'];
            if (!quote || !quote['05. price']) {
                console.error(`No price data for ${symbol}`);
                return null;
            }

            const price = parseFloat(quote['05. price']);
            const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

            // Update price cache in database
            await database.run(`
                INSERT OR REPLACE INTO stock_prices (symbol, current_price, change_percent, last_updated)
                VALUES (?, ?, ?, ?)
            `, [symbol, price, changePercent, new Date().toISOString()]);

            return price;

        } catch (error) {
            console.error(`Error getting price for ${symbol}:`, error.message);

            // Try to get cached price from database
            try {
                const cached = await database.get(
                    'SELECT current_price FROM stock_prices WHERE symbol = ?',
                    [symbol]
                );

                if (cached) {
                    console.log(`📋 Using cached price for ${symbol}`);
                    return cached.current_price;
                }
            } catch (cacheError) {
                console.error('Failed to get cached price:', cacheError);
            }

            return null;
        }
    }

    startScheduledMonitoring() {
        // Run every 30 minutes during market hours (9 AM - 4 PM ET, Monday-Friday)
        cron.schedule('*/30 9-16 * * 1-5', async () => {
            await this.checkAllUserStocks();
        }, {
            timezone: "America/New_York"
        });

        console.log('⏰ Scheduled monitoring started (every 30 minutes during market hours)');
    }

    async runOnce() {
        console.log('🔍 Running one-time stock check...');
        await this.checkAllUserStocks();
        process.exit(0);
    }

    async runTest() {
        console.log('🧪 Running test mode...');

        // Force alerts for testing (temporarily lower thresholds)
        const testUsers = await database.all(`
            SELECT DISTINCT us.*, u.phone_number, u.carrier, u.email
            FROM user_stocks us
            JOIN users u ON us.user_id = u.id
            WHERE us.is_active = 1
            AND u.phone_number IS NOT NULL
            AND u.carrier IS NOT NULL
            LIMIT 1
        `);

        if (testUsers.length === 0) {
            console.log('❌ No configured users found for testing');
            return;
        }

        const testStock = testUsers[0];
        const currentPrice = await this.getCurrentPrice(testStock.symbol);

        if (currentPrice) {
            // Force trigger alert by temporarily modifying threshold
            const originalThreshold = testStock.threshold;
            testStock.threshold = testStock.alert_type === 'below' ? currentPrice + 1 : currentPrice - 1;

            console.log(`🔧 Test: Modified ${testStock.symbol} threshold from $${originalThreshold} to $${testStock.threshold}`);

            await this.checkUserStockAlert(testStock, currentPrice);
        }

        process.exit(0);
    }
}

// CLI handling
async function main() {
    const monitor = new MultiUserStockMonitor();

    try {
        await monitor.initialize();

        const args = process.argv.slice(2);

        if (args.includes('--once')) {
            await monitor.runOnce();
        } else if (args.includes('--test')) {
            await monitor.runTest();
        } else {
            // Start scheduled monitoring
            monitor.startScheduledMonitoring();

            // Also run once immediately
            await monitor.checkAllUserStocks();

            console.log('🔄 Multi-user stock monitor is running...');
            console.log('Press Ctrl+C to stop');
        }

    } catch (error) {
        console.error('❌ Monitor failed to start:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️ Shutting down stock monitor...');
    await database.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️ Shutting down stock monitor...');
    await database.close();
    process.exit(0);
});

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = MultiUserStockMonitor;