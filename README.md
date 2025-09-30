# StockAlerts

Automated stock price monitoring system that sends SMS alerts with candlestick charts when stocks hit your custom thresholds.

## Features

- 📊 Real-time stock price monitoring
- 📱 SMS alerts via Twilio when thresholds are hit
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
- Twilio account (for SMS) - [Sign up free](https://www.twilio.com/try-twilio)
- Stock API key from Alpha Vantage - [Get free API key](https://www.alphavantage.co/support/#api-key)

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/StockAlerts.git
cd StockAlerts
npm install
```

### 2. Configure API Keys

Create a `.env` file in the root directory:

```env
# Twilio Configuration (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Your Phone Number
ALERT_PHONE_NUMBER=+1234567890

# Stock API
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Chart URL (your deployed website)
CHART_BASE_URL=https://yourdomain.com
```

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

### 4. Test Locally

```bash
npm test
```

This will check one time if any stocks are below threshold and send test alert.

## Deployment Options

### Option A: GitHub Actions (Recommended - Free)

The system runs automatically via GitHub Actions every 30 minutes during market hours.

1. Go to your GitHub repository Settings → Secrets and variables → Actions
1. Add these secrets:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ALERT_PHONE_NUMBER`
- `ALPHA_VANTAGE_API_KEY`
1. The workflow file `.github/workflows/stock-monitor.yml` is already configured!

### Option B: Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set TWILIO_ACCOUNT_SID=xxx
heroku config:set TWILIO_AUTH_TOKEN=xxx
# ... set other environment variables
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
- **Twilio SMS**: ~$0.0079 per text message
- **GitHub Actions**: Free (2,000 minutes/month)
- **Total**: Under $5/month for typical use

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

**Not receiving alerts?**

- Check Twilio account is active and funded
- Verify phone number format: +1234567890
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