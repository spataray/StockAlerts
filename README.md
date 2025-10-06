# StockAlerts

Automated stock price monitoring system that sends SMS alerts with candlestick charts when stocks hit your custom thresholds.

## Features

- 📊 Real-time stock price monitoring
- 📱 FREE SMS alerts via email-to-SMS (no Twilio needed!)
- 📈 Interactive candlestick charts with 30-day history
- 📉 3-month, 6-month, and 12-month trend analysis
- ⚙️ Custom thresholds per stock
- 🔄 Runs automatically on schedule

## What You Get in Alerts

When a stock hits your threshold, you receive:

- SMS notification with current price
- Price change percentage
- 3/6/12 month performance trends (positive and negative)
- Link to interactive candlestick chart
- Volume data

## Prerequisites

- Node.js (v14 or higher)
- GitHub account
- Email account with SMTP access (Gmail, Outlook, etc.) - FREE!
- Stock API key from Alpha Vantage - [Get free API key](https://www.alphavantage.co/support/#api-key)

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/StockAlerts.git
cd StockAlerts
npm install
```

### 2. Configure Email-to-SMS (FREE!)

Create a `.env` file in the root directory:

```env
# Email-to-SMS Configuration (FREE alternative to Twilio!)
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Your Phone Number (no + needed)
ALERT_PHONE_NUMBER=1234567890

# Optional: Specify your carrier for accuracy
CARRIER_OVERRIDE=verizon

# Stock API
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Chart URL (your deployed website)
CHART_BASE_URL=https://yourdomain.com
```

#### Setting up Gmail App Password:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security → App passwords
3. Generate an app password for "Mail"
4. Use this app password (not your regular password) for EMAIL_PASS

#### Supported Carriers:
- Verizon: auto-detected or set `CARRIER_OVERRIDE=verizon`
- AT&T: set `CARRIER_OVERRIDE=att`
- T-Mobile: set `CARRIER_OVERRIDE=tmobile`
- Sprint: set `CARRIER_OVERRIDE=sprint`
- And many more...

### 3. Set Your Stock Watchlist

Edit `data/watchlist.json`:

```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "threshold": 150.00,
      "alertType": "below"
    },
    {
      "symbol": "TSLA",
      "name": "Tesla Inc.",
      "threshold": 200.00,
      "alertType": "below"
    }
  ]
}
```

### 4. Test Email-to-SMS Setup

```bash
npm run test-alert
```

This sends a test SMS to verify your email-to-SMS configuration works.

### 5. Test Stock Monitoring

```bash
npm test
```

This will check one time if any stocks are below threshold and send real alerts.

## Deployment Options

### Option A: GitHub Actions (Recommended - Free)

The system runs automatically via GitHub Actions every 30 minutes during market hours.

1. Go to your GitHub repository Settings → Secrets and variables → Actions
1. Add these secrets:
- `EMAIL_USER`
- `EMAIL_PASS`
- `ALERT_PHONE_NUMBER`
- `CARRIER_OVERRIDE` (optional)
- `ALPHA_VANTAGE_API_KEY`
1. The workflow file `.github/workflows/stock-monitor.yml` is already configured!

### Option B: Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set EMAIL_USER=xxx
heroku config:set EMAIL_PASS=xxx
heroku config:set ALERT_PHONE_NUMBER=xxx
heroku config:set CARRIER_OVERRIDE=xxx
heroku config:set ALPHA_VANTAGE_API_KEY=xxx
git push heroku main
```

### Option C: Run on Your Computer

```bash
npm start
```

Keeps running and checks every 30 minutes.

## File Structure

```
StockAlerts/
├── src/
│   ├── priceMonitor.js      # Main monitoring logic
│   ├── trendCalculator.js   # Calculates 3/6/12 month trends
│   ├── alertSender.js       # Sends SMS via Twilio
│   └── chartGenerator.js    # Generates chart data
├── web/
│   ├── index.html           # Chart viewer page
│   ├── chart.js             # Candlestick rendering
│   └── styles.css           # Styling
├── data/
│   └── watchlist.json       # Your stocks & thresholds
├── .github/
│   └── workflows/
│       └── stock-monitor.yml # Automated scheduling
├── .env.example             # Environment variables template
├── package.json
└── README.md
```

## Costs

- **Alpha Vantage API**: Free (25 requests/day)
- **Email-to-SMS**: FREE! (uses your existing email account)
- **GitHub Actions**: Free (2,000 minutes/month)
- **Total**: $0/month! 🎉

## Customization

### Change Check Frequency

Edit `.github/workflows/stock-monitor.yml`:

```yaml
schedule:
  - cron: '*/30 9-16 * * 1-5'  # Every 30 min, Mon-Fri, 9am-4pm
```

### Add More Stocks

Just add to `data/watchlist.json`:

```json
{
  "symbol": "GOOGL",
  "name": "Alphabet Inc.",
  "threshold": 2500.00,
  "alertType": "below"
}
```

### Alert Types

- `"below"` - Alert when price drops below threshold
- `"above"` - Alert when price rises above threshold

## Troubleshooting

**Not receiving SMS alerts?**

- Run `npm run test-alert` to test your setup
- Check your email spam folder
- Verify your EMAIL_USER and EMAIL_PASS are correct
- For Gmail, ensure you're using an App Password (not regular password)
- Try setting CARRIER_OVERRIDE to your specific carrier
- Check GitHub Actions logs for errors

**API rate limits?**

- Alpha Vantage free tier: 25 calls/day
- Upgrade to paid tier or use Polygon.io

**Wrong trends showing?**

- Ensure API key has historical data access
- Check date calculations in trendCalculator.js

## Support

Open an issue on GitHub or contact the developer.

## License

MIT License - Free to use and modify