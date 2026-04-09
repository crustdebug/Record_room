# 🔧 Vercel Session Fix - Albums Not Loading

## 🐛 The Problem

Albums weren't loading on Vercel because of **session persistence issues**. The logs showed:
```
GET /api/albums → 401 Unauthorized
```

Even though users were logged in, the `/api/albums` endpoint returned 401 (Unauthorized).

## 🔍 Root Cause

Vercel's serverless functions are **stateless**. The default `express-session` uses **MemoryStore**, which stores sessions in RAM. Each serverless function invocation gets a fresh instance with no memory of previous sessions.

**What was happening:**
1. User logs in → Session created in Function Instance A
2. User requests albums → Function Instance B (different instance, no session data)
3. Auth middleware checks session → No session found → 401 Unauthorized

## ✅ The Solution

Use **PostgreSQL-backed session storage** with `connect-pg-simple`. Sessions are now stored in your Supabase database, making them persistent across all serverless function invocations.

## 📝 Changes Made

### 1. Installed Dependencies
```bash
npm install connect-pg-simple pg
```

### 2. Updated `server.js`
- Added PostgreSQL connection pool
- Configured `connect-pg-simple` session store
- Sessions now stored in `session` table in Supabase
- Auto-creates session table if missing

### 3. Added `DATABASE_URL` to Environment Variables
You need to add this to both:
- Local `.env` file
- Vercel environment variables

## 🚀 How to Get Your DATABASE_URL

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `syyeblmscnrygttfimjr`
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Select **URI** tab
6. Copy the connection string (it looks like):
   ```
   postgresql://postgres.syyeblmscnrygttfimjr:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with your actual database password

## 🔐 Setting Up Environment Variables

### Local Development
Update your `.env` file:
```env
DATABASE_URL=postgresql://postgres.syyeblmscnrygttfimjr:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### Vercel Deployment
1. Go to: https://vercel.com/crustdebugs-projects/record-room/settings/environment-variables
2. Add new environment variable:
   - **Name:** `DATABASE_URL`
   - **Value:** Your full PostgreSQL connection string
   - **Environment:** Production, Preview, Development (select all)
3. Click **Save**

## 📦 Deploy the Fix

### Option 1: Git Push (Recommended)
```bash
git add .
git commit -m "Fix Vercel session persistence - use PostgreSQL session store"
git push origin main
```

Vercel will auto-deploy.

### Option 2: Manual Redeploy
1. Go to Vercel dashboard
2. Click **Redeploy** on the latest deployment

## ✅ Verify It Works

After deployment:

1. Visit: https://record-room.vercel.app
2. Login with your credentials
3. Albums should now load properly!

The session table will be automatically created in your Supabase database on first use.

## 🎯 What This Fixes

- ✅ Albums now load after login
- ✅ Sessions persist across serverless function invocations
- ✅ No more random 401 errors
- ✅ Production-ready session management
- ✅ Works on Vercel's serverless infrastructure

## 📊 Session Table

The `connect-pg-simple` library automatically creates a `session` table in your database with this structure:

```sql
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

You can view this table in your Supabase dashboard under **Table Editor**.

## 🔧 Troubleshooting

### Still getting 401 errors?
1. Check Vercel logs for database connection errors
2. Verify `DATABASE_URL` is set correctly in Vercel
3. Make sure your Supabase database password is correct
4. Check that your Supabase project allows connections from Vercel

### Database connection errors?
- Ensure you're using the **pooler connection string** (port 6543), not the direct connection
- Verify SSL is enabled for production (already configured in code)

---

**You're all set!** 🎵 Your Record Room should now work perfectly on Vercel.
