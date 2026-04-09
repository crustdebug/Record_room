require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');
const { initializeDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── PostgreSQL Connection Pool for Sessions ──
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ─── Middleware ───────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new pgSession({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ─── Static Files ─────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Note: /uploads route removed - files are served from Supabase Storage

// ─── Routes ───────────────────────────────────
const authRoutes = require('./routes/auth');
const albumRoutes = require('./routes/albums');
const songRoutes = require('./routes/songs');

app.use('/auth', authRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/songs', songRoutes);

// ─── Page Routes ──────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ─── Initialize & Start ──────────────────────
initializeDatabase();

app.listen(PORT, () => {
  console.log(`\n✦ Record Room is spinning at http://localhost:${PORT}\n`);
  console.log(`✦ Session store: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory (not recommended)'}`);
});
