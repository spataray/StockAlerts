# Copilot Instructions for StockAlerts

## Project Overview
- **StockAlerts** is an automated Node.js system for monitoring stock prices and sending SMS alerts (with candlestick charts) when user-defined thresholds are crossed.
- The system integrates with Twilio (for SMS) and Alpha Vantage (for stock data). Charts are served via a web UI.

## Architecture & Key Components
- `src/priceMonitor.js`: Main entry point. Loads watchlist, fetches prices, checks thresholds, triggers alerts.
- `src/alertSender.js`: Handles SMS sending via Twilio.
- `src/trendCalculator.js`: Computes 3/6/12 month trends for stocks.
- `src/chartGenerator.js`: Prepares chart data for the web UI.
- `data/watchlist.json`: User-editable list of stocks, thresholds, and alert types.
- `web/`: Static site for interactive candlestick charts (`chart.html`, `chart.js`).
- `.github/workflows/stock-monitor.yml`: GitHub Actions workflow for scheduled runs.

## Developer Workflows
- **Local test run:** `npm test` (checks thresholds and sends test alerts once)
- **Continuous monitoring:** `npm start` (runs every 30 minutes)
- **GitHub Actions:** Automated runs every 30 minutes during market hours (see workflow YAML for schedule)
- **Configuration:**
  - Set API keys and phone numbers in `.env` (see `.env.example`)
  - Edit `data/watchlist.json` to add/remove stocks or change thresholds

## Project-Specific Patterns & Conventions
- **Alert Types:** `"below"` (alert if price drops below threshold), `"above"` (alert if price rises above threshold)
- **Trend Calculation:** 3, 6, and 12 month trends are calculated in `trendCalculator.js` and included in alerts
- **Chart Links:** Alerts include a link to the web UI for interactive chart viewing
- **Environment Variables:** All secrets (API keys, phone numbers) are loaded from `.env` or GitHub Actions secrets
- **Data Flow:**
  1. `priceMonitor.js` loads watchlist and fetches prices
  2. If a threshold is crossed, it calls `alertSender.js` and `chartGenerator.js`
  3. `alertSender.js` sends SMS with price, trends, and chart link

## Integration Points
- **Twilio:** Used for sending SMS alerts (`alertSender.js`)
- **Alpha Vantage:** Used for fetching stock prices and historical data
- **Web UI:** Receives chart data from backend, renders with `chart.js` and `candlestick.js`

## Examples
- To add a new stock, edit `data/watchlist.json` and add an object with `symbol`, `name`, `threshold`, and `alertType`.
- To change alert frequency, edit the `cron` schedule in `.github/workflows/stock-monitor.yml`.

## Troubleshooting
- Check logs in GitHub Actions for errors
- Ensure API keys and phone numbers are valid and in correct format
- Watch for Alpha Vantage rate limits (25 calls/day on free tier)

---
For more details, see `README.md` and comments in each source file.
