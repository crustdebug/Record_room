require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { initializeDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ─── Static Files ─────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Ensure upload directories exist ──────────
['uploads/covers', 'uploads/songs'].forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

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
});
