#!/usr/bin/env node
require('dotenv').config();
const database = require('./database');
const userDb = require('./database/users');

async function testAlertSystem() {
    try {
        console.log('🧪 Stock Alert System Test\n');
        console.log('=' .repeat(60));

        // Initialize database
        await database.initialize();

        // Check users
        console.log('\n👥 Checking Users...');
        const users = await database.all('SELECT id, email, name FROM users');

        if (users.length === 0) {
            console.log('❌ No users found!');
            console.log('\n📝 To test the system:');
            console.log('1. Start the server: npm start');
            console.log('2. Go to http://localhost:3000');
            console.log('3. Sign up with your email');
            console.log('4. Add some stock alerts');
            console.log('5. Run this test again');
            process.exit(1);
        }

        console.log(`✓ Found ${users.length} user(s):`);
        users.forEach(user => {
            console.log(`  - ${user.email} ${user.name ? `(${user.name})` : ''}`);
        });

        // Check stocks
        console.log('\n📊 Checking Active Stock Alerts...');
        const stocks = await database.all(`
            SELECT us.*, u.email, u.name
            FROM user_stocks us
            JOIN users u ON us.user_id = u.id
            WHERE us.is_active = 1
            ORDER BY u.email, us.symbol
        `);

        if (stocks.length === 0) {
            console.log('❌ No active stock alerts found!');
            console.log('\n📝 To add alerts:');
            console.log('1. Log in to the dashboard');
            console.log('2. Click "Add Stock"');
            console.log('3. Enter stock symbol, threshold, and alert type');
            console.log('4. Run this test again');
            process.exit(1);
        }

        console.log(`✓ Found ${stocks.length} active alert(s):\n`);

        const stocksByUser = {};
        stocks.forEach(stock => {
            if (!stocksByUser[stock.email]) {
                stocksByUser[stock.email] = [];
            }
            stocksByUser[stock.email].push(stock);
        });

        for (const [email, userStocks] of Object.entries(stocksByUser)) {
            console.log(`  ${email}:`);
            userStocks.forEach(stock => {
                console.log(`    • ${stock.symbol}: Alert when ${stock.alert_type} $${stock.threshold}`);
            });
            console.log('');
        }

        // Check email configuration
        console.log('📧 Email Configuration:');
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            console.log('❌ Email not configured!');
            console.log('   Set EMAIL_USER and EMAIL_PASS in your .env file');
            process.exit(1);
        }

        console.log(`✓ Email: ${emailUser}`);
        console.log(`✓ Password: ***${emailPass.slice(-4)}`);
        console.log(`✓ Host: ${process.env.EMAIL_HOST || 'smtp.gmail.com'}`);

        // Check API key
        console.log('\n🔑 Alpha Vantage API Key:');
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

        if (!apiKey) {
            console.log('❌ API key not configured!');
            console.log('   Get one free at: https://www.alphavantage.co/support/#api-key');
            process.exit(1);
        }

        console.log(`✓ API Key: ***${apiKey.slice(-4)}`);

        // Test actual price fetch
        console.log('\n💰 Testing Stock Price Fetch...');
        const testSymbol = stocks[0].symbol;
        console.log(`   Fetching current price for ${testSymbol}...`);

        const axios = require('axios');
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${testSymbol}&apikey=${apiKey}`;

        try {
            const response = await axios.get(url, { timeout: 10000 });
            const quote = response.data['Global Quote'];

            if (!quote || !quote['05. price']) {
                console.log(`⚠️  No price data returned for ${testSymbol}`);
                console.log('   This could mean:');
                console.log('   - Invalid stock symbol');
                console.log('   - API rate limit reached');
                console.log('   - API key issue');
            } else {
                const price = parseFloat(quote['05. price']);
                const change = quote['10. change percent'];
                console.log(`✓ ${testSymbol}: $${price.toFixed(2)} (${change})`);

                // Check which alerts would trigger
                console.log('\n🚨 Checking Alert Conditions...');
                let alertCount = 0;

                for (const stock of stocks.filter(s => s.symbol === testSymbol)) {
                    const shouldAlert =
                        (stock.alert_type === 'below' && price <= stock.threshold) ||
                        (stock.alert_type === 'above' && price >= stock.threshold);

                    if (shouldAlert) {
                        console.log(`   ✓ WOULD ALERT ${stock.email}:`);
                        console.log(`     ${stock.symbol} is $${price.toFixed(2)} (${stock.alert_type} $${stock.threshold})`);
                        alertCount++;
                    } else {
                        console.log(`   ✗ No alert for ${stock.email}:`);
                        console.log(`     ${stock.symbol} is $${price.toFixed(2)} (needs to be ${stock.alert_type} $${stock.threshold})`);
                    }
                }

                if (alertCount === 0) {
                    console.log('\n⚠️  No alerts would trigger with current prices');
                    console.log('   This is normal if stock prices haven\'t crossed your thresholds');
                }
            }
        } catch (error) {
            console.log(`❌ Error fetching price: ${error.message}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n✅ System Check Complete!\n');
        console.log('🔬 To test with forced alert trigger:');
        console.log('   npm run monitor-test');
        console.log('\n🔍 To check all stocks once:');
        console.log('   npm run monitor-once');
        console.log('\n🔄 To start the monitor service:');
        console.log('   npm run monitor');
        console.log('   (Checks every 30 min during market hours 9am-4pm ET)');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await database.close();
        process.exit(0);
    }
}

testAlertSystem();
