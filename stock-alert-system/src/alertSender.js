require(‘dotenv’).config();
const twilio = require(‘twilio’);
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const alertPhone = process.env.ALERT_PHONE_NUMBER;
let client = null;
function initializeTwilio() {
if (!accountSid || !authToken) {
console.warn(‘Twilio credentials not configured. Running in test mode.’);
return null;
}
return twilio(accountSid, authToken);
}
function formatTrend(value) {
const sign = value >= 0 ? ‘+’ : ‘’;
return `${sign}${value.toFixed(1)}%`;
}
function getTrendEmoji(value) {
if (value > 5) return ‘📈’;
if (value < -5) return ‘📉’;
return ‘➡️’;
}
async function sendAlert(alertData) {
const {
symbol,
name,
price,
change,
changePercent,
threshold,
trends,
chartUrl
} = alertData;
// Format the SMS message
const message = `
🔔 ${symbol} Alert: $${price.toFixed(2)} (${changePercent})
${name}
Threshold: $${threshold.toFixed(2)}
📊 Trends:
${getTrendEmoji(trends[‘3mo’])} 3mo: ${formatTrend(trends[‘3mo’])}
${getTrendEmoji(trends[‘6mo’])} 6mo: ${formatTrend(trends[‘6mo’])}
${getTrendEmoji(trends[‘12mo’])} 12mo: ${formatTrend(trends[‘12mo’])}
📈 Chart: ${chartUrl}
`.trim();
console.log(’\n’ + ‘=’.repeat(50));
console.log(‘SENDING ALERT:’);
console.log(’=’.repeat(50));
console.log(message);
console.log(’=’.repeat(50) + ‘\n’);
// Initialize Twilio client if not already done
if (!client) {
client = initializeTwilio();
}
// Send SMS if Twilio is configured
if (client && twilioPhone && alertPhone) {
try {
const messageResponse = await client.messages.create({
body: message,
from: twilioPhone,
to: alertPhone
});
```
 console.log(`✓ SMS sent successfully! Message SID: ${messageResponse.sid}`);
 return true;
} catch (error) {
 console.error('✗ Error sending SMS:', error.message);
 return false;
}
```
} else {
console.log(‘⚠ Test mode: SMS would be sent to’, alertPhone || ‘NOT_CONFIGURED’);
console.log(‘⚠ Configure Twilio credentials in .env to enable SMS’);
return false;
}
}
module.exports = { sendAlert };