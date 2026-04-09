const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../utils/supabase');

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  return res.json({
    message: 'Login successful',
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
});

// POST /auth/register (admin only)
router.post('/register', async (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const validRole = role === 'admin' ? 'admin' : 'user';

  // Check if username exists
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const { data: newUser, error } = await supabase.from('users').insert({
    username,
    password: hashedPassword,
    role: validRole
  }).select().single();
  
  if (error || !newUser) {
    return res.status(500).json({ error: 'Failed to create user.' });
  }

  return res.status(201).json({
    message: 'User created successfully.',
    user: { id: newUser.id, username, role: validRole }
  });
});

// GET /auth/me — check current session
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ user: req.session.user });
  }
  return res.status(401).json({ error: 'Not logged in.' });
});

// GET /auth/users — list all users (admin only)
router.get('/users', async (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const { data: users, error } = await supabase.from('users').select('id, username, role, created_at');
  if (error) return res.status(500).json({ error: 'Failed to fetch users' });

  return res.json({ users });
});

// DELETE /auth/users/:id — delete a user (admin only)
router.delete('/users/:id', async (req, res) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const userId = parseInt(req.params.id);

  // Prevent self-deletion
  if (userId === req.session.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account.' });
  }

  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) {
    return res.status(404).json({ error: 'User not found or deletion failed.' });
  }

  return res.json({ message: 'User deleted successfully.' });
});

module.exports = router;
