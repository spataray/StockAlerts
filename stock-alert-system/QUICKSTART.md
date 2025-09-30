# Quick Start Guide
Get your stock alert system running in 10 minutes!
## Step 1: Get Your API Keys (5 minutes)
### Twilio (for SMS)
1. Go to https://www.twilio.com/try-twilio
1. Sign up for free account ($15 free credit)
1. Copy your **Account SID** and **Auth Token**
1. Get a phone number (free trial number works)
### Alpha Vantage (for stock data)
1. Go to https://www.alphavantage.co/support/#api-key
1. Enter your email
1. Copy your free API key (25 requests/day)
## Step 2: Add Files to GitHub (3 minutes)
From your iPhone:
1. Open Safari and go to github.com/YOUR-USERNAME/StockAlerts
1. Click “Add file” → “Upload files”
1. Upload all these files from our chat (you can copy/paste the content)
**OR** From a computer:
```bash
git clone https://github.com/YOUR-USERNAME/StockAlerts.git
cd StockAlerts
# Copy all artifact files here
git add .
git commit -m "Initial commit"
git push
```
## Step 3: Configure Secrets (2 minutes)
1. Go to your repo on GitHub
1. Click **Settings** → **Secrets and variables** → **Actions**
1. Click **New repository secret** and add each:
```
TWILIO_ACCOUNT_SID = (your Twilio SID)
TWILIO_AUTH_TOKEN = (your Twilio token)
TWILIO_PHONE_NUMBER = +12345678901
ALERT_PHONE_NUMBER = +19876543210 (your phone)
ALPHA_VANTAGE_API_KEY = (your key)
CHART_BASE_URL = https://YOUR-USERNAME.github.io/StockAlerts
```
## Step 4: Enable GitHub Pages (1 minute)
1. Go to **Settings** → **Pages**
1. Source: **Deploy from a branch**
1. Branch: **main** → folder: **/ (root)**
1. Click **Save**
Your chart will be at: `https://YOUR-USERNAME.github.io/StockAlerts/web/chart.html`
## Step 5: Test It!
### Manual Test:
1. Go to **Actions** tab
1. Click **Stock Price Monitor**
1. Click **Run workflow** → **Run workflow**
1. Wait 30 seconds, check your phone!
### Automatic Running:
The system now checks every 30 minutes during market hours (Mon-Fri, 9:30 AM - 4:00 PM ET)
## Customize Your Stocks
Edit `data/watchlist.json`:
```json
{
 "stocks": [
   {
     "symbol": "NVDA",
     "name": "NVIDIA Corporation",
     "threshold": 400.00,
     "alertType": "below"
   }
 ]
}
```
Commit and push - done!
## Troubleshooting
**No SMS received?**
- Check Twilio account has credit
- Phone number format: +1234567890 (with country code)
- Check GitHub Actions logs for errors
**“API limit reached”?**
- Free tier = 25 calls/day
- With 3 stocks = runs 8 times/day
- Need more? Upgrade Alpha Vantage or reduce check frequency
**Chart not loading?**
- Wait 2-3 minutes after enabling GitHub Pages
- Check URL matches your username
- Make sure `web/` folder exists in repo
## Need Help?
Check the full README.md or create an issue on GitHub!
-----
**You’re all set!** 🎉 Your customer will now get text alerts with beautiful candlestick charts whenever stocks hit their thresholds.