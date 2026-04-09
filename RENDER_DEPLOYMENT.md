# 🚀 Deploy Record Room to Render (Free)

Render is a free hosting platform that works great with Node.js apps and PostgreSQL databases.

## ✅ Why Render?

- Free tier available
- Better environment variable handling
- Persistent storage support
- Automatic deployments from GitHub
- No serverless limitations

## 📋 Prerequisites

- GitHub repository (you already have this)
- Render account (free): https://render.com

## 🚀 Deployment Steps

### Step 1: Create Render Account

1. Go to https://render.com
2. Click **Get Started**
3. Sign up with your GitHub account

### Step 2: Create New Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `crustdebug/Record_room`
3. Click **Connect**

### Step 3: Configure the Service

Fill in these settings:

- **Name:** `record-room` (or any name you want)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** (leave blank)
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Step 4: Add Environment Variables

Click **Advanced** and add these environment variables:

1. **SESSION_SECRET**
   - Value: `record_room_secret_key_change_me_2026`

2. **DATABASE_URL**
   - Value: `postgresql://postgres.syyeblmscnrygttfimjr:password_record_room@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres`

3. **SUPABASE_URL**
   - Value: `https://syyeblmscnrygttfimjr.supabase.co`

4. **SUPABASE_ANON_KEY**
   - Value: `sb_publishable_754QkySDsxmt2JetbUJmPw_PNpn_imZ`

5. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `sb_secret_oJYdl1JipTxgJUsbaHh0wg_WQz0mdzp`

6. **NODE_ENV**
   - Value: `production`

### Step 5: Deploy

1. Click **Create Web Service**
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Start your app
3. Wait 2-3 minutes for deployment to complete

### Step 6: Access Your App

Once deployed, you'll get a URL like:
```
https://record-room.onrender.com
```

## ✅ Advantages Over Vercel

- ✅ No serverless limitations
- ✅ Persistent filesystem (if needed)
- ✅ Better for traditional Node.js apps
- ✅ Simpler environment variable management
- ✅ Free SSL certificate
- ✅ Automatic deployments on git push

## ⚠️ Free Tier Limitations

- App spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for one app)

## 🔄 Auto-Deploy on Push

Render automatically redeploys when you push to GitHub. No manual redeployment needed!

## 🆘 Troubleshooting

### App won't start?
- Check the logs in Render dashboard
- Verify all environment variables are set correctly
- Make sure DATABASE_URL is correct

### Can't connect to database?
- Verify Supabase allows connections from Render's IPs
- Check DATABASE_URL format is correct
- Ensure password is correct

### Session issues?
- Make sure DATABASE_URL is set
- Check logs for "Session store: PostgreSQL"

---

**That's it!** Your Record Room should now be live on Render. 🎵
