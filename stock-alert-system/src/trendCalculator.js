require(‘dotenv’).config();

const axios = require(‘axios’);

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function getHistoricalData(symbol) {

try {

const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`;

const response = await axios.get(url);

```

if (!response.data['Time Series (Daily)']) {

  throw new Error('No historical data available');

}

return response.data['Time Series (Daily)'];

```

} catch (error) {

console.error(`Error fetching historical data for ${symbol}:`, error.message);

return null;

}

}

function getDateMonthsAgo(months) {

const date = new Date();

date.setMonth(date.getMonth() - months);

return date.toISOString().split(‘T’)[0];

}

function findClosestPrice(data, targetDate) {

const dates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));

// Find the closest date to target

let closestDate = dates[0];

let minDiff = Math.abs(new Date(targetDate) - new Date(closestDate));

for (const date of dates) {

const diff = Math.abs(new Date(targetDate) - new Date(date));

if (diff < minDiff) {

minDiff = diff;

closestDate = date;

}

}

return parseFloat(data[closestDate][‘4. close’]);

}

async function calculateTrends(symbol) {

try {

const data = await getHistoricalData(symbol);

```

if (!data) {

  return {

    '3mo': 0,

    '6mo': 0,

    '12mo': 0

  };

}

const dates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));

const currentPrice = parseFloat(data[dates[0]]['4. close']);

// Get prices from 3, 6, and 12 months ago

const price3mo = findClosestPrice(data, getDateMonthsAgo(3));

const price6mo = findClosestPrice(data, getDateMonthsAgo(6));

const price12mo = findClosestPrice(data, getDateMonthsAgo(12));

// Calculate percentage changes

const trend3mo = ((currentPrice - price3mo) / price3mo) * 100;

const trend6mo = ((currentPrice - price6mo) / price6mo) * 100;

const trend12mo = ((currentPrice - price12mo) / price12mo) * 100;

return {

  '3mo': parseFloat(trend3mo.toFixed(1)),

  '6mo': parseFloat(trend6mo.toFixed(1)),

  '12mo': parseFloat(trend12mo.toFixed(1

require(‘dotenv’).config();
const axios = require(‘axios’);
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
async function getHistoricalData(symbol) {
try {
const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_KEY}`;
const response = await axios.get(url);
```
if (!response.data['Time Series (Daily)']) {
 throw new Error('No historical data available');
}
return response.data['Time Series (Daily)'];
```
} catch (error) {
console.error(`Error fetching historical data for ${symbol}:`, error.message);
return null;
}
}
function getDateMonthsAgo(months) {
const date = new Date();
date.setMonth(date.getMonth() - months);
return date.toISOString().split(‘T’)[0];
}
function findClosestPrice(data, targetDate) {
const dates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
// Find the closest date to target
let closestDate = dates[0];
let minDiff = Math.abs(new Date(targetDate) - new Date(closestDate));
for (const date of dates) {
const diff = Math.abs(new Date(targetDate) - new Date(date));
if (diff < minDiff) {
minDiff = diff;
closestDate = date;
}
}
return parseFloat(data[closestDate][‘4. close’]);
}
async function calculateTrends(symbol) {
try {
const data = await getHistoricalData(symbol);
```
if (!data) {
 return {
   '3mo': 0,
   '6mo': 0,
   '12mo': 0
 };
}
const dates = Object.keys(data).sort((a, b) => new Date(b) - new Date(a));
const currentPrice = parseFloat(data[dates[0]]['4. close']);
// Get prices from 3, 6, and 12 months ago
const price3mo = findClosestPrice(data, getDateMonthsAgo(3));
const price6mo = findClosestPrice(data, getDateMonthsAgo(6));
const price12mo = findClosestPrice(data, getDateMonthsAgo(12));
// Calculate percentage changes
const trend3mo = ((currentPrice - price3mo) / price3mo) * 100;
const trend6mo = ((currentPrice - price6mo) / price6mo) * 100;
const trend12mo = ((currentPrice - price12mo) / price12mo) * 100;
return {
 '3mo': parseFloat(trend3mo.toFixed(1)),
 '6mo': parseFloat(trend6mo.toFixed(1)),
 '12mo': parseFloat(trend12mo.toFixed(1))
};
```
} catch (error) {
console.error(`Error calculating trends for ${symbol}:`, error.message);
return {
‘3mo’: 0,
‘6mo’: 0,
‘12mo’: 0
};
}
}
module.exports = { calculateTrends }
 