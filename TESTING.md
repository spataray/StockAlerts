# Stock Alerts Testing Guide

This guide will help you test and verify that your stock alert system is working correctly.

## Quick Start Testing

### 1. Check System Configuration

```bash
npm run test-setup
```

This will verify:
- ✓ Environment variables are set
- ✓ Email configuration is correct
- ✓ Alpha Vantage API key is configured
- ✓ Database exists

### 2. Check Alert System Status

```bash
npm run test-alerts
```

This comprehensive test will:
- ✓ Show all registered users
- ✓ List all active stock alerts
- ✓ Test fetching real stock prices from Alpha Vantage
- ✓ Show which alerts would trigger at current prices
- ✓ Verify email configuration

### 3. Force a Test Alert (Recommended)

```bash
npm run monitor-test
```

This will:
- Find one of your configured stock alerts
- Temporarily adjust the threshold to force it to trigger
- Send an actual email alert to the user's address
- **Use this to verify email delivery works!**

### 4. Check All Stocks Once

```bash
npm run monitor-once
```

This runs the monitor once with real conditions (doesn't force alerts).

### 5. Start the Monitor Service

```bash
npm run monitor
```

This starts the scheduled monitoring:
- Checks every 30 minutes
- Only during market hours (9 AM - 4 PM ET)
- Only on weekdays (Monday - Friday)

---

## Complete Testing Workflow

### Step 1: Initial Setup

1. **Copy the example environment file:**
   ```bash
   cp stock-alert-system/.env.example .env
   ```

2. **Edit `.env` with your credentials:**
   ```bash
   nano .env  # or use your preferred editor
   ```

   Required settings:
   ```env
   # Email Configuration (for sending alerts)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password-here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587

   # Stock Data API
   ALPHA_VANTAGE_API_KEY=your-api-key-here

   # Authentication
   JWT_SECRET=change-this-to-random-string

   # Server
   PORT=3000
   FRONTEND_URL=http://localhost:3000
   ```

3. **For Gmail users:**
   - Enable 2-Factor Authentication
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Use the App Password as `EMAIL_PASS`

4. **Get Alpha Vantage API key:**
   - Free tier: https://www.alphavantage.co/support/#api-key
   - 500 requests/day limit (sufficient for most users)

### Step 2: Start the Application

```bash
npm install  # Install dependencies
npm start    # Start the web server
```

Open http://localhost:3000 and:
1. Create an account
2. Add some stock alerts
3. Note your alert thresholds

### Step 3: Verify Configuration

```bash
npm run test-setup
```

Expected output:
```
✓ EMAIL_USER: your-email@gmail.com
✓ EMAIL_PASS: ***word
✓ ALPHA_VANTAGE_API_KEY: ***key
✓ Database exists
```

### Step 4: Check Alert Status

```bash
npm run test-alerts
```

This will show you:
- All configured alerts
- Current stock prices
- Which alerts would trigger

Example output:
```
👥 Found 1 user(s):
  - user@example.com

📊 Found 2 active alert(s):
  user@example.com:
    • AAPL: Alert when above $150
    • TSLA: Alert when below $200

💰 Testing Stock Price Fetch...
✓ AAPL: $175.50 (+2.3%)

🚨 Checking Alert Conditions...
  ✓ WOULD ALERT user@example.com:
    AAPL is $175.50 (above $150)
```

### Step 5: Test Email Delivery

```bash
npm run monitor-test
```

This forces an alert to trigger and sends a real email. Check your inbox!

Expected console output:
```
🧪 Running test mode...
📧 Sending to: user@example.com
✓ Email sent successfully! Message ID: <...>
✅ Test alert sent successfully!
```

### Step 6: Monitor Logs

When running the monitor service:

```bash
npm run monitor
```

You'll see logs like:
```
🚀 Multi-user stock monitor initialized
⏰ Scheduled monitoring started (every 30 minutes)

🔍 Starting stock price check at 2025-01-06T10:30:00.000Z
📊 Monitoring 5 stocks across all users
💰 AAPL: $175.50
💰 TSLA: $245.30
🚨 ALERT: AAPL for user user@example.com
✓ Email sent successfully!
✅ Stock price check completed
```

---

## Troubleshooting

### No alerts being sent?

**Check these common issues:**

1. **No stocks configured:**
   ```bash
   npm run test-alerts
   ```
   If you see "No active stock alerts found", add stocks via the web UI.

2. **Thresholds not met:**
   - Check current prices vs. your thresholds
   - Example: Alert set for "above $200" but stock is at $150
   - Use `npm run monitor-test` to force a test

3. **Email not configured:**
   ```bash
   npm run test-setup
   ```
   Make sure EMAIL_USER and EMAIL_PASS are set.

4. **Gmail blocking:**
   - Must use App Password (not regular password)
   - Enable 2FA first
   - Check "Less secure app access" is not blocking

5. **API rate limits:**
   - Free tier: 5 calls/minute, 500/day
   - Multiple stocks? Requests are spaced 1 second apart
   - Monitor logs for API errors

6. **Outside market hours:**
   - Monitor only runs 9 AM - 4 PM ET, Monday-Friday
   - Use `npm run monitor-once` to test anytime

### Alert sent once but not again?

**This is by design!**
- System sends max 1 alert per stock per day
- Prevents spam
- If you want another alert, wait until next day

### How to check alert history?

Log in to the dashboard and check the "Recent Alerts" section.

---

## Monitoring in Production

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the server
pm2 start server.js --name stockalerts-server

# Start the monitor
pm2 start multiUserMonitor.js --name stockalerts-monitor

# View logs
pm2 logs stockalerts-monitor

# Monitor status
pm2 status
```

### Using systemd (Linux)

Create `/etc/systemd/system/stockalerts-monitor.service`:

```ini
[Unit]
Description=Stock Alerts Monitor
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/StockAlerts
ExecStart=/usr/bin/node multiUserMonitor.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable stockalerts-monitor
sudo systemctl start stockalerts-monitor
sudo journalctl -u stockalerts-monitor -f  # View logs
```

---

## Testing Checklist

Use this checklist to verify everything works:

- [ ] `.env` file created with all credentials
- [ ] `npm run test-setup` shows all ✓
- [ ] Server starts: `npm start`
- [ ] Can create account via web UI
- [ ] Can add stock alerts via web UI
- [ ] `npm run test-alerts` shows your configured alerts
- [ ] `npm run test-alerts` successfully fetches real stock prices
- [ ] `npm run monitor-test` sends test email
- [ ] Test email arrives in inbox
- [ ] Email is properly formatted (HTML with colors/charts)
- [ ] `npm run monitor` starts without errors
- [ ] Monitor logs show it checking stocks
- [ ] Real alert arrives when threshold is crossed

---

## Getting Help

If you're still having issues:

1. Check logs for error messages
2. Verify all environment variables are set correctly
3. Test email settings with a simple nodemailer test
4. Check Alpha Vantage API status
5. Verify stock symbols are correct (use Yahoo Finance to confirm)

**Debug mode:**
```bash
NODE_ENV=development npm run monitor-test
```

This provides more detailed logging.
