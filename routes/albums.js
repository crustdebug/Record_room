const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../utils/supabase');

const router = express.Router();

// Configure multer for cover images
const coverStorage = multer.memoryStorage();

const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  }
});

// GET /api/albums — list all albums
router.get('/', requireAuth, async (req, res) => {
  const { data: albumsData, error } = await supabase
    .from('albums')
    .select('*, songs(id)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch albums' });

  const albums = (albumsData || []).map(a => ({
    ...a,
    song_count: a.songs ? a.songs.length : 0
  }));

  return res.json({ albums });
});

// GET /api/albums/:id — get single album with songs
router.get('/:id', requireAuth, async (req, res) => {
  const { data: album, error: albumError } = await supabase.from('albums').select('*').eq('id', req.params.id).single();

  if (albumError || !album) {
    return res.status(404).json({ error: 'Album not found.' });
  }

  const { data: songs } = await supabase.from('songs').select('*').eq('album_id', req.params.id).order('track_number', { ascending: true });

  return res.json({ album, songs: songs || [] });
});

// POST /api/albums — create album (admin only)
router.post('/', requireAdmin, uploadCover.single('cover'), async (req, res) => {
  const { title, artist, description, year } = req.body;

  if (!title || !artist) {
    return res.status(400).json({ error: 'Title and artist are required.' });
  }

  let coverImage = null;
  if (req.file) {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not configured.' });
    const uniqueName = `cover_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    const { error } = await supabase.storage.from('covers').upload(uniqueName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload cover image: ' + error.message });
    }
    coverImage = supabase.storage.from('covers').getPublicUrl(uniqueName).data.publicUrl;
  }

  const yearInt = year ? parseInt(year) : null;
  const { data: album, error: insertError } = await supabase.from('albums').insert({
    title,
    artist,
    cover_image: coverImage,
    description: description || null,
    year: yearInt
  }).select().single();

  if (insertError) return res.status(500).json({ error: 'Failed to create album in Supabase.' });

  return res.status(201).json({ message: 'Album created successfully.', album });
});

// PUT /api/albums/:id — update album (admin only)
router.put('/:id', requireAdmin, uploadCover.single('cover'), async (req, res) => {
  const { title, artist, description, year } = req.body;
  const { data: existing } = await supabase.from('albums').select('*').eq('id', req.params.id).single();
  if (!existing) {
    return res.status(404).json({ error: 'Album not found.' });
  }

  let coverImage = existing.cover_image;
  if (req.file) {
    if (!supabase) return res.status(500).json({ error: 'Supabase client not configured.' });
    const uniqueName = `cover_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    const { error } = await supabase.storage.from('covers').upload(uniqueName, req.file.buffer, { contentType: req.file.mimetype });
    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload new cover image: ' + error.message });
    }
    coverImage = supabase.storage.from('covers').getPublicUrl(uniqueName).data.publicUrl;

    // If new cover uploaded, delete old one
    if (existing.cover_image) {
      if (existing.cover_image.startsWith('http') && supabase) {
        const oldName = existing.cover_image.split('/').pop();
        await supabase.storage.from('covers').remove([oldName]);
      } else {
        const oldPath = path.join(__dirname, '..', existing.cover_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
  }

  const yearInt = year ? parseInt(year) : existing.year;
  const { data: updated, error: updateError } = await supabase.from('albums').update({
    title: title || existing.title,
    artist: artist || existing.artist,
    cover_image: coverImage,
    description: description !== undefined ? description : existing.description,
    year: yearInt
  }).eq('id', req.params.id).select().single();

  if (updateError) return res.status(500).json({ error: 'Failed to update album.' });

  return res.json({ message: 'Album updated successfully.', album: updated });
});

// DELETE /api/albums/:id — delete album and its songs (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { data: album } = await supabase.from('albums').select('*').eq('id', req.params.id).single();
  if (!album) {
    return res.status(404).json({ error: 'Album not found.' });
  }

  // Delete song files from bucket
  const { data: songs } = await supabase.from('songs').select('file_path').eq('album_id', req.params.id);
  (songs || []).forEach(async song => {
    if (song.file_path && song.file_path.startsWith('http')) {
      const fileName = song.file_path.split('/').pop();
      await supabase.storage.from('songs').remove([fileName]);
    }
  });

  // Delete cover image
  if (album.cover_image) {
    if (album.cover_image.startsWith('http') && supabase) {
      const coverName = album.cover_image.split('/').pop();
      await supabase.storage.from('covers').remove([coverName]);
    } else {
      const coverPath = path.join(__dirname, '..', album.cover_image);
      if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
    }
  }

  // Delete from DB (Supabase handles cascade if configured, but we let Postgres do it)
  await supabase.from('albums').delete().eq('id', req.params.id);

  return res.json({ message: 'Album deleted successfully.' });
});

module.exports = router;
