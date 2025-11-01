require('dotenv').config();
const nodemailer = require('nodemailer');

// Email configuration
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = process.env.EMAIL_PORT || 587;
const alertEmail = process.env.ALERT_EMAIL;

let transporter = null;
function initializeEmail() {
    if (!emailUser || !emailPass) {
        console.warn('Email credentials not configured. Running in test mode.');
        return null;
    }

    return nodemailer.createTransporter({
        host: emailHost,
        port: emailPort,
        secure: false, // true for 465, false for other ports
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
}
function formatTrend(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

function getTrendEmoji(value) {
    if (value > 5) return '📈';
    if (value < -5) return '📉';
    return '➡️';
}

function buildHtmlEmail(alertData) {
    const { symbol, name, price, changePercent, threshold, alertType, trends, chartUrl } = alertData;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .alert-info { background: #f7f7f7; padding: 20px; border-radius: 0 0 10px 10px; }
        .stock-price { font-size: 36px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .threshold { background: white; padding: 15px; border-left: 4px solid #764ba2; margin: 15px 0; }
        .trends { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
        .trend-item { background: white; padding: 15px; border-radius: 5px; text-align: center; }
        .chart-link { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Stock Alert: ${symbol}</h1>
            <p style="margin: 5px 0 0 0;">${name}</p>
        </div>
        <div class="alert-info">
            <div class="stock-price">$${price.toFixed(2)} <span style="font-size: 20px;">${changePercent}</span></div>

            <div class="threshold">
                <strong>Alert Triggered:</strong> Price went ${alertType} your threshold of $${threshold.toFixed(2)}
            </div>

            <h3>📊 Performance Trends</h3>
            <div class="trends">
                <div class="trend-item">
                    <div style="font-size: 24px;">${getTrendEmoji(trends['3mo'])}</div>
                    <div><strong>3 Month</strong></div>
                    <div style="color: ${trends['3mo'] >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">${formatTrend(trends['3mo'])}</div>
                </div>
                <div class="trend-item">
                    <div style="font-size: 24px;">${getTrendEmoji(trends['6mo'])}</div>
                    <div><strong>6 Month</strong></div>
                    <div style="color: ${trends['6mo'] >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">${formatTrend(trends['6mo'])}</div>
                </div>
                <div class="trend-item">
                    <div style="font-size: 24px;">${getTrendEmoji(trends['12mo'])}</div>
                    <div><strong>12 Month</strong></div>
                    <div style="color: ${trends['12mo'] >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">${formatTrend(trends['12mo'])}</div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${chartUrl}" class="chart-link">📈 View Full Chart</a>
            </div>
        </div>

        <div class="footer">
            <p>You're receiving this because you set up a stock alert for ${symbol}.</p>
            <p>Log in to your dashboard to manage your alerts.</p>
        </div>
    </div>
</body>
</html>`;
}

async function sendAlert(alertData) {
    const { symbol, name, price, changePercent, threshold, alertType } = alertData;

    console.log('\n' + '='.repeat(50));
    console.log('SENDING EMAIL ALERT:');
    console.log('='.repeat(50));
    console.log(`Stock: ${symbol} (${name})`);
    console.log(`Price: $${price.toFixed(2)} ${changePercent}`);
    console.log(`Threshold: $${threshold.toFixed(2)} (${alertType})`);
    console.log(`Email: ${alertEmail}`);
    console.log('='.repeat(50) + '\n');

    // Initialize email transporter if not already done
    if (!transporter) {
        transporter = initializeEmail();
    }

    // Send email if configured
    if (transporter && alertEmail) {
        try {
            const htmlContent = buildHtmlEmail(alertData);
            const textContent = `
🔔 ${symbol} Alert: $${price.toFixed(2)} (${changePercent})
${name}

Alert Triggered: Price went ${alertType} your threshold of $${threshold.toFixed(2)}

📊 Performance Trends:
${getTrendEmoji(alertData.trends['3mo'])} 3mo: ${formatTrend(alertData.trends['3mo'])}
${getTrendEmoji(alertData.trends['6mo'])} 6mo: ${formatTrend(alertData.trends['6mo'])}
${getTrendEmoji(alertData.trends['12mo'])} 12mo: ${formatTrend(alertData.trends['12mo'])}

📈 View Chart: ${alertData.chartUrl}

---
You're receiving this because you set up a stock alert for ${symbol}.
Log in to your dashboard to manage your alerts.
`.trim();

            console.log(`📧 Sending to: ${alertEmail}`);

            const mailOptions = {
                from: emailUser,
                to: alertEmail,
                subject: `🔔 Stock Alert: ${symbol} is now $${price.toFixed(2)}`,
                text: textContent,
                html: htmlContent
            };

            const result = await transporter.sendMail(mailOptions);
            console.log(`✓ Email sent successfully! Message ID: ${result.messageId}`);
            return true;
        } catch (error) {
            console.error('✗ Error sending email:', error.message);
            return false;
        }
    } else {
        console.log('⚠ Test mode: Email would be sent to', alertEmail || 'NOT_CONFIGURED');
        console.log('⚠ Configure email credentials in .env to enable email alerts');
        return false;
    }
}

// Test function to send a test alert
async function sendTestAlert() {
    console.log('🧪 Sending test alert...\n');

    const testData = {
        symbol: 'TEST',
        name: 'Test Stock Alert',
        price: 150.00,
        change: -2.50,
        changePercent: '-1.6%',
        threshold: 152.50,
        alertType: 'below',
        trends: {
            '3mo': -5.2,
            '6mo': 12.3,
            '12mo': 8.7
        },
        chartUrl: 'https://example.com/chart/TEST'
    };

    const result = await sendAlert(testData);

    if (result) {
        console.log('✅ Test alert sent successfully!');
    } else {
        console.log('❌ Test alert failed to send.');
    }

    return result;
}

module.exports = { sendAlert, sendTestAlert };