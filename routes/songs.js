const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { supabase } = require('../utils/supabase');

const router = express.Router();

// Configure multer for song files
const songStorage = multer.memoryStorage();

const uploadSong = multer({
  storage: songStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /mp3|wav|ogg|flac|m4a|aac|mpeg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) return cb(null, true);
    cb(new Error('Only audio files are allowed (mp3, wav, ogg, flac).'));
  }
});

// GET /api/songs/:albumId — get songs for an album
router.get('/:albumId', requireAuth, async (req, res) => {
  const { data: songs, error } = await supabase.from('songs').select('*').eq('album_id', req.params.albumId).order('track_number', { ascending: true });
  if (error) return res.status(500).json({ error: 'Failed to fetch songs.' });
  return res.json({ songs });
});

// POST /api/songs — upload a song (admin only)
router.post('/', requireAdmin, uploadSong.single('audio'), async (req, res) => {
  const { title, album_id, track_number } = req.body;

  if (!title || !album_id || !req.file) {
    return res.status(400).json({ error: 'Title, album_id, and audio file are required.' });
  }

  // Verify album exists
  const { data: album } = await supabase.from('albums').select('id').eq('id', album_id).single();
  if (!album) {
    return res.status(404).json({ error: 'Album not found.' });
  }

  if (!supabase) return res.status(500).json({ error: 'Supabase client not configured.' });
  const fileExt = path.extname(req.file.originalname);
  const uniqueName = `song_${Date.now()}_${Math.round(Math.random() * 1e9)}${fileExt}`;

  const { error } = await supabase.storage.from('songs').upload(uniqueName, req.file.buffer, {
    contentType: req.file.mimetype,
  });

  if (error) {
    console.error('Supabase upload error:', error);
    return res.status(500).json({ error: 'Failed to upload song to Supabase: ' + error.message });
  }

  const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(uniqueName);
  const filePath = publicUrlData.publicUrl;

  // Auto track number if not provided
  let trackNum = track_number ? parseInt(track_number) : null;
  if (!trackNum) {
    const { data: maxRows } = await supabase.from('songs').select('track_number').eq('album_id', album_id).order('track_number', { ascending: false }).limit(1);
    trackNum = (maxRows && maxRows[0] ? maxRows[0].track_number : 0) + 1;
  }

  const { data: song, error: insertError } = await supabase.from('songs').insert({
    title,
    album_id: parseInt(album_id),
    track_number: trackNum,
    file_path: filePath
  }).select().single();

  if (insertError) return res.status(500).json({ error: 'Failed to insert song into database.' });

  return res.status(201).json({ message: 'Song uploaded successfully.', song });
});

// DELETE /api/songs/:id — delete a song (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { data: song } = await supabase.from('songs').select('*').eq('id', req.params.id).single();
  if (!song) {
    return res.status(404).json({ error: 'Song not found.' });
  }

  // Delete file from Supabase
  if (song.file_path && song.file_path.startsWith('http') && supabase) {
    const fileName = song.file_path.split('/').pop();
    await supabase.storage.from('songs').remove([fileName]);
  }

  await supabase.from('songs').delete().eq('id', req.params.id);

  return res.json({ message: 'Song deleted successfully.' });
});

// GET /api/songs/stream/:id — stream audio file
router.get('/stream/:id', requireAuth, async (req, res) => {
  const { data: song } = await supabase.from('songs').select('*').eq('id', req.params.id).single();

  if (!song) {
    return res.status(404).json({ error: 'Song not found.' });
  }

  // All files are in Supabase Storage, redirect to the public URL
  if (song.file_path && song.file_path.startsWith('http')) {
    return res.redirect(song.file_path);
  }

  return res.status(404).json({ error: 'Audio file not found.' });
});

module.exports = router;
