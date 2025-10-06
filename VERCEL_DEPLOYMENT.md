# 🚀 FREE Vercel Deployment Guide

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

## Step 2: Deploy Backend (Vercel) - FREE

1. **Login to Vercel**: [vercel.com](https://vercel.com) → Dashboard
2. **Import Project**: "Add New..." → "Project" → Import your GitHub repo
3. **Configure**:
   - Framework Preset: "Other"
   - Root Directory: `./` (leave default)
   - Build Command: `npm install` (leave default)
   - Output Directory: `./` (leave default)

4. **Environment Variables** (in Vercel dashboard → Settings → Environment Variables):

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

✅ **Backend URL**: `https://your-app.vercel.app`

## Step 3: Update Frontend Configuration

**After Vercel deployment**, update these files with your actual Vercel URL:

1. **In `assets/js/dashboard.js`** (line 615):
```javascript
: 'https://your-actual-app.vercel.app'; // Replace with your Vercel URL
```

2. **In `assets/js/main.js`** (lines 103 and 348):
```javascript
const response = await fetch('https://your-actual-app.vercel.app/api/auth/send-magic-link', {
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
- **Backend**: `https://your-app.vercel.app`
- **Database**: SQLite (auto-created on Vercel)

## 💰 Cost: $0/month

Both GitHub Pages and Vercel free tiers are sufficient for POC testing!

## 🔧 Stock Monitoring

### Vercel Functions (Serverless)
Since Vercel is serverless, for scheduled stock monitoring you have two options:

#### Option A: External Cron Service (Free)
Use a free service like [cron-job.org](https://cron-job.org) to hit your endpoint every 30 minutes:
- URL: `https://your-app.vercel.app/api/monitor`
- Schedule: `*/30 9-16 * * 1-5` (every 30 min, weekdays, 9am-4pm ET)

#### Option B: GitHub Actions (Free)
Add to `.github/workflows/monitor.yml`:
```yaml
name: Stock Monitor
on:
  schedule:
    - cron: '*/30 13-20 * * 1-5'  # 9am-4pm ET in UTC
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger stock check
        run: curl -X POST https://your-app.vercel.app/api/monitor
```

## ✨ Vercel Advantages

- ✅ **Truly free** for hobby projects
- ✅ **Automatic SSL** certificates
- ✅ **Fast deployment** from GitHub
- ✅ **Global CDN** for fast response times
- ✅ **Automatic scaling** - handles traffic spikes
- ✅ **No sleep time** - always responsive

Your POC is now live and ready for testing! 🎉