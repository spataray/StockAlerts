require(‘dotenv’).config();
const axios = require(‘axios’);
const fs = require(‘fs’).promises;
const path = require(‘path’);
const cron = require(‘node-cron’);
const { sendAlert } = require(’./alertSender’);
const { calculateTrends } = require(’./trendCalculator’);
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const WATCHLIST_PATH = path.join(__dirname, ‘../data/watchlist.json’);
const ALERT_HISTORY_PATH = path.join(__dirname, ‘../data/alertHistory.json’);
// Track alerts to avoid spam (only alert once per day per stock)
let alertHistory = {};
async function loadWatchlist() {
try {
const data = await fs.readFile(WATCHLIST_PATH, ‘utf8’);
return JSON.parse(data);
} catch (error) {
console.error(‘Error loading watchlist:’, error.message);
return { stocks: [] };
}
}
async function loadAlertHistory() {
try {
const data = await fs.readFile(ALERT_HISTORY_PATH, ‘utf8’);
alertHistory = JSON.parse(data);
} catch (error) {
alertHistory = {};
}
}
async function saveAlertHistory() {
try {
await fs.writeFile(ALERT_HISTORY_PATH, JSON.stringify(alertHistory, null, 2));
} catch (error) {
console.error(‘Error saving alert history:’, error.message);
}
}
function shouldAlert(symbol) {
const today = new Date().toISOString().split(‘T’)[0];
const lastAlert = alertHistory[symbol];
// Only alert once per day per stock
return !lastAlert || lastAlert !== today;
}
function markAlerted(symbol) {
const today = new Date().toISOString().split(‘T’)[0];
alertHistory[symbol] = today;
}
async function getCurrentPrice(symbol) {
try {
const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
const response = await axios.get(url);
```
if (response.data['Global Quote']) {
 const quote = response.data['Global Quote'];
 return {
   price: parseFloat(quote['05. price']),
   change: parseFloat(quote['09. change']),
   changePercent: quote['10. change percent']
 };
}
throw new Error('Invalid API response');
```
} catch (error) {
console.error(`Error fetching price for ${symbol}:`, error.message);
return null;
}
}
async function checkStock(stock) {
console.log(`Checking ${stock.symbol}...`);
const currentData = await getCurrentPrice(stock.symbol);
if (!currentData) {
return null;
}
const { price, change, changePercent } = currentData;
console.log(`${stock.symbol}: $${price} (${changePercent})`);
// Check if threshold met
let thresholdMet = false;
if (stock.alertType === ‘below’ && price < stock.threshold) {
thresholdMet = true;
} else if (stock.alertType === ‘above’ && price > stock.threshold) {
thresholdMet = true;
}
if (thresholdMet && shouldAlert(stock.symbol)) {
console.log(`🔔 Alert condition met for ${stock.symbol}!`);
```
// Calculate trends
const trends = await calculateTrends(stock.symbol);
// Generate chart URL
const chartUrl = `${process.env.CHART_BASE_URL || 'https://example.com'}/chart.html?symbol=${stock.symbol}`;
// Send alert
await sendAlert({
 symbol: stock.symbol,
 name: stock.name,
 price: price,
 change: change,
 changePercent: changePercent,
 threshold: stock.threshold,
 trends: trends,
 chartUrl: chartUrl
});
markAlerted(stock.symbol);
await saveAlertHistory();
return {
 symbol: stock.symbol,
 alerted: true,
 price: price
};
```
}
return {
symbol: stock.symbol,
alerted: false,
price: price
};
}
async function checkAllStocks() {
console.log(’\n’ + ‘=’.repeat(50));
console.log(`Stock Monitor Check - ${new Date().toLocaleString()}`);
console.log(’=’.repeat(50) + ‘\n’);
await loadAlertHistory();
const watchlist = await loadWatchlist();
if (watchlist.stocks.length === 0) {
console.log(‘No stocks in watchlist’);
return;
}
const results = [];
for (const stock of watchlist.stocks) {
const result = await checkStock(stock);
if (result) {
results.push(result);
}
```
// Rate limiting - wait 12 seconds between API calls (Alpha Vantage free tier)
if (stock !== watchlist.stocks[watchlist.stocks.length - 1]) {
 await new Promise(resolve => setTimeout(resolve, 12000));
}
```
}
console.log(’\n’ + ‘-’.repeat(50));
console.log(‘Summary:’);
results.forEach(r => {
console.log(`${r.symbol}: $${r.price} ${r.alerted ? '🔔 ALERTED' : '✓'}`);
});
console.log(’-’.repeat(50) + ‘\n’);
}
async function main() {
const args = process.argv.slice(2);
if (args.includes(’–test’) || args.includes(’–once’)) {
// Run once for testing
await checkAllStocks();
process.exit(0);
} else {
// Run on schedule
console.log(‘Stock Alert Monitor Started’);
console.log(‘Checking stocks every 30 minutes during market hours…\n’);
```
// Run immediately on start
await checkAllStocks();
// Schedule: Every 30 minutes, Monday-Friday, 9:30 AM - 4:00 PM ET
// Note: Adjust timezone as needed
cron.schedule('*/30 9-16 * * 1-5', async () => {
 await checkAllStocks();
});
console.log('Monitor is running. Press Ctrl+C to stop.\n');
```
}
}
// Handle errors
process.on(‘unhandledRejection’, (error) => {
console.error(‘Unhandled error:’, error);
});
// Start
main();