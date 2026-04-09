# 🚀 How to Take Record Room (and its SQLite DB) Online

Since this project uses **SQLite** (`better-sqlite3`) as its database, taking it online requires a specific approach. Unlike MySQL or PostgreSQL which run as separate servers, SQLite is a **single file** stored directly on your server's hard drive.

Many modern hosting providers (like Heroku or Vercel) have "ephemeral" or "serverless" file systems. This means that every time your app restarts, the storage is wiped clean, and your database will be deleted! 

Here are the best ways to deploy this app and its SQLite database so it remains permanent and secure.

---

## Option 1: VPS (Virtual Private Server) - *Most Recommended & Flexible*
The easiest way to host a Node.js + SQLite app without losing your database or uploaded files is on a traditional VPS. 

**Providers:** DigitalOcean (Droplet), AWS (EC2), Linode, or Hetzner.

**How it works:**
1. You rent a "virtual computer" running Linux (Ubuntu is standard).
2. You SSH into it, install Node.js and PM2 (a process manager).
3. You clone your Record Room GitHub repository to the server.
4. You run `npm install` and start the app with `pm2 start server.js`.
5. Your SQLite database and uploaded audio files stay safe on the server's hard drive forever.

*Pros: Total control, very cheap (~$4-5/mo), file uploads and SQLite work perfectly out of the box.*

---

## Option 2: Render (PaaS) with a "Persistent Disk"
If you don't want to manage a Linux server yourself, Render is a great option, but you MUST attach a persistent disk.

**How it works:**
1. Push your code to GitHub.
2. Create a new **Web Service** on Render and link your GitHub repo.
3. In the Render settings, add a **Background/Persistent Disk**.
4. Set the disk's mount path to where the DB and uploads live (e.g., `/app/database` and `/app/uploads`).
5. Update your `.env` or code to point SQLite to that persistent disk path.

*Pros: Automated deployments on `git push`, no server management.*
*Cons: Persistent disks are not part of Render's free tier (starts around $7/mo).*

---

## Option 3: Upgrade to Turso (Cloud SQLite)
If you want to use "Serverless" providers (like Vercel, Railway, or Heroku without volumes) but still want to keep the SQLite API, you can use **Turso**.

**How it works:**
1. Turso is a distributed SQLite service created by the developers of `libSQL`.
2. You upload your local SQLite database to Turso.
3. You replace your local `better-sqlite3` connection in `database/db.js` with the Turso `libsql` client.
4. You can now host the Node.js website literally anywhere (even for free on Railway or Render's free tier) because the database is hosted securely on the cloud.

*Pros: Incredible performance, free tier available, separates DB from your application hosting.*
*Cons: Requires changing a few lines of code in your backend.*

---

## 🛠️ Important Steps Before Any Deployment

1. **Environment Variables**: Never commit your `.env` file to GitHub! You will need to configure these variables manually in your hosting provider's dashboard.
2. **File Uploads**: Record Room relies on local file uploads (the `/uploads` folder for songs and album art). If you use a host with an ephemeral file system (without a Persistent Disk), uploads will be deleted upon restart. A VPS or a Persistent Disk solves this entirely.
3. **Change Default Credentials**: Make sure to give your Girlfriend a secure password and change your Admin password to something strong.
