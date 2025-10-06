# 🚀 FREE POC Deployment Guide

## Step 1: Deploy Frontend (GitHub Pages) - FREE

1. **Push to GitHub**:
```bash
git add .
git commit -m "Complete multi-user StockAlerts platform"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to repo → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/ (root)`
   - Save

✅ **Frontend URL**: `https://yourusername.github.io/StockAlerts`

## Step 2: Deploy Backend (Railway) - FREE

1. **Sign up**: [railway.app](https://railway.app) → "Start a New Project"
2. **Deploy**: "Deploy from GitHub repo" → Select your StockAlerts repo
3. **Environment Variables** (in Railway dashboard):

```env
NODE_ENV=production
FRONTEND_URL=https://yourusername.github.io/StockAlerts
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
ALPHA_VANTAGE_API_KEY=your-api-key
JWT_SECRET=make-this-random-and-secure-123456789
```

✅ **Backend URL**: `https://your-app.railway.app`

## Step 3: Update Frontend Configuration

**After Railway deployment**, update these files with your actual Railway URL:

1. **In `assets/js/dashboard.js`** (line 615):
```javascript
: 'https://your-actual-railway-url.railway.app'; // Replace with your Railway URL
```

2. **In `assets/js/main.js`** (lines 103 and 348):
```javascript
const response = await fetch('https://your-actual-railway-url.railway.app/api/auth/send-magic-link', {
```

## Step 4: Get Your API Keys

### Gmail App Password:
1. Enable 2FA on Gmail
2. Google Account → Security → App passwords
3. Generate password for "Mail"

### Alpha Vantage API:
1. Go to [alphavantage.co](https://www.alphavantage.co/support/#api-key)
2. Get free API key (25 requests/day)

## Step 5: Test Your Deployment

1. **Visit your frontend**: `https://yourusername.github.io/StockAlerts`
2. **Click "Get Started"**
3. **Enter your email** → Should receive magic link
4. **Add phone number** and carrier in profile
5. **Add a stock** to monitor
6. **Test SMS alert** from profile page

## 🎯 Final URLs

- **Frontend**: `https://yourusername.github.io/StockAlerts`
- **Backend**: `https://your-app.railway.app`
- **Database**: SQLite (auto-created on Railway)

## 💰 Cost: $0/month

Both GitHub Pages and Railway free tiers are sufficient for POC testing!

## 🔧 Monitoring Your Stocks

Deploy the stock monitor to run periodically:

### Option A: Railway Cron (Recommended)
Add to your Railway environment:
```env
RAILWAY_CRON_SCHEDULE=*/30 9-16 * * 1-5
RAILWAY_CRON_COMMAND=npm run monitor-once
```

### Option B: GitHub Actions (Free)
The repo includes automated GitHub Actions for stock monitoring.

## 📞 Support

If you run into issues:
1. Check Railway logs for backend errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test individual components (auth, stock API, SMS)

Your POC is now live and ready for testing! 🎉