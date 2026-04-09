// ═══════════════════════════════════════════════════════════════
// Record Room — Admin Dashboard Logic
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ─── State ──────────────────────────────────
  let albums = [];
  let allSongs = [];
  let users = [];

  // ─── DOM Elements ───────────────────────────
  const loader = document.getElementById('page-loader');

  // ─── Init ──────────────────────────────────
  async function init() {
    try {
      const res = await fetch('/auth/me');
      const data = await res.json();

      if (!data.user || data.user.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      setupNavigation();
      setupModals();
      await refreshAll();
      hideLoader();
    } catch (err) {
      window.location.href = '/';
    }
  }

  function hideLoader() {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 500);
  }

  // ─── Navigation ────────────────────────────
  function setupNavigation() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle) {
      // Create overlay element
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.id = 'sidebar-overlay';
      document.body.appendChild(overlay);
      
      // Toggle menu
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });
      
      // Close menu when clicking overlay
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
      
      // Close menu when clicking a nav item
      document.querySelectorAll('.sidebar-nav-item[data-panel]').forEach(btn => {
        btn.addEventListener('click', () => {
          sidebar.classList.remove('open');
          overlay.classList.remove('active');
        });
      });
    }
    
    document.querySelectorAll('.sidebar-nav-item[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;

        // Update nav active state
        document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show panel
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${panel}`).classList.add('active');
      });
    });

    // Logout
    document.getElementById('admin-logout-btn').addEventListener('click', async () => {
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/';
    });
  }

  // ─── Data Loading ──────────────────────────
  async function refreshAll() {
    await Promise.all([loadAlbums(), loadUsers()]);
    updateStats();
    renderDashboard();
  }

  async function loadAlbums() {
    try {
      const res = await fetch('/api/albums');
      const data = await res.json();
      albums = data.albums || [];

      // Load all songs too
      allSongs = [];
      for (const album of albums) {
        const sRes = await fetch(`/api/songs/${album.id}`);
        const sData = await sRes.json();
        const songs = (sData.songs || []).map(s => ({ ...s, albumTitle: album.title }));
        allSongs.push(...songs);
      }

      renderAlbums();
      renderSongs();
      populateAlbumSelects();
    } catch (err) {
      console.error('Failed to load albums:', err);
    }
  }

  async function loadUsers() {
    try {
      const res = await fetch('/auth/users');
      const data = await res.json();
      users = data.users || [];
      renderUsers();
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  // ─── Stats ─────────────────────────────────
  function updateStats() {
    document.getElementById('stat-albums').textContent = albums.length;
    document.getElementById('stat-songs').textContent = allSongs.length;
    document.getElementById('stat-users').textContent = users.length;
  }

  // ─── Dashboard ─────────────────────────────
  function renderDashboard() {
    const grid = document.getElementById('dashboard-recent-albums');
    const recent = albums.slice(0, 4);

    if (recent.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <h3>No Albums Yet</h3>
          <p>Get started by creating your first album.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = recent.map(album => renderAlbumCard(album)).join('');
    attachAlbumCardActions(grid);
  }

  // ─── Albums Panel ──────────────────────────
  function renderAlbums() {
    const grid = document.getElementById('admin-albums-grid');

    if (albums.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <h3>No Albums</h3>
          <p>Click "New Album" to add your first album.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = albums.map(album => renderAlbumCard(album)).join('');
    attachAlbumCardActions(grid);
  }

  function renderAlbumCard(album) {
    const coverHtml = album.cover_image
      ? `<img src="${album.cover_image}" alt="${escapeHtml(album.title)}" loading="lazy">`
      : `<div class="album-cover-placeholder" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--bg-elevated),var(--bg-surface));font-family:var(--font-heading);font-size:2.5rem;color:var(--accent);">${getInitials(album.title)}</div>`;

    return `
      <div class="admin-album-card" data-album-id="${album.id}">
        <div class="card-cover">${coverHtml}</div>
        <div class="card-body">
          <h3>${escapeHtml(album.title)}</h3>
          <div class="card-artist">${escapeHtml(album.artist)} ${album.year ? `· ${album.year}` : ''}</div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm edit-album-btn" data-id="${album.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-album-btn" data-id="${album.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  function attachAlbumCardActions(container) {
    container.querySelectorAll('.edit-album-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditAlbumModal(parseInt(btn.dataset.id));
      });
    });

    container.querySelectorAll('.delete-album-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteAlbum(parseInt(btn.dataset.id));
      });
    });
  }

  // ─── Songs Panel ───────────────────────────
  function renderSongs(filterAlbumId) {
    const tbody = document.getElementById('songs-tbody');
    const cardsContainer = document.getElementById('songs-cards');
    let filtered = allSongs;

    if (filterAlbumId) {
      filtered = allSongs.filter(s => s.album_id === parseInt(filterAlbumId));
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);">No songs found.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-muted);">No songs found.</p>';
      return;
    }

    // Render table view
    tbody.innerHTML = filtered.map(song => `
      <tr>
        <td>${song.track_number || '—'}</td>
        <td>${escapeHtml(song.title)}</td>
        <td style="color:var(--text-muted)">${escapeHtml(song.albumTitle || '')}</td>
        <td>
          <button class="btn btn-danger btn-sm btn-icon delete-song-btn" data-id="${song.id}" title="Delete">✕</button>
        </td>
      </tr>
    `).join('');

    // Render mobile card view
    if (cardsContainer) {
      cardsContainer.innerHTML = filtered.map(song => `
        <div class="mobile-card">
          <div class="mobile-card-header">
            <div>
              <div class="mobile-card-title">${escapeHtml(song.title)}</div>
              <div class="mobile-card-subtitle">${escapeHtml(song.albumTitle || '')}</div>
            </div>
            <div class="mobile-card-id">Track ${song.track_number || '—'}</div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-danger btn-sm delete-song-btn" data-id="${song.id}">Delete</button>
          </div>
        </div>
      `).join('');
    }

    // Attach delete handlers for both views
    document.querySelectorAll('.delete-song-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteSong(parseInt(btn.dataset.id)));
    });
  }

  function populateAlbumSelects() {
    const selects = [
      document.getElementById('song-album-filter'),
      document.getElementById('song-album-select')
    ];

    selects.forEach(select => {
      const firstOption = select.options[0];
      select.innerHTML = '';
      select.appendChild(firstOption);

      albums.forEach(album => {
        const opt = document.createElement('option');
        opt.value = album.id;
        opt.textContent = `${album.title} — ${album.artist}`;
        select.appendChild(opt);
      });
    });

    // Filter listener
    document.getElementById('song-album-filter').addEventListener('change', (e) => {
      renderSongs(e.target.value);
    });
  }

  // ─── Users Panel ───────────────────────────
  function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    const cardsContainer = document.getElementById('users-cards');

    // Render table view
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>
          <span style="padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;
            ${user.role === 'admin' 
              ? 'background:var(--accent-glow);color:var(--accent);' 
              : 'background:rgba(78,232,122,0.1);color:var(--success);'}">
            ${user.role}
          </span>
        </td>
        <td style="color:var(--text-muted);font-size:0.85rem;">${new Date(user.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-danger btn-sm btn-icon delete-user-btn" data-id="${user.id}" title="Delete">✕</button>
        </td>
      </tr>
    `).join('');

    // Render mobile card view
    if (cardsContainer) {
      cardsContainer.innerHTML = users.map(user => `
        <div class="mobile-card">
          <div class="mobile-card-header">
            <div>
              <div class="mobile-card-title">${escapeHtml(user.username)}</div>
              <div class="mobile-card-subtitle">
                <span style="padding:3px 8px;border-radius:12px;font-size:0.7rem;font-weight:600;
                  ${user.role === 'admin' 
                    ? 'background:var(--accent-glow);color:var(--accent);' 
                    : 'background:rgba(78,232,122,0.1);color:var(--success);'}">
                  ${user.role}
                </span>
              </div>
            </div>
            <div class="mobile-card-id">#${user.id}</div>
          </div>
          <div class="mobile-card-body">
            <div class="mobile-card-row">
              <span class="mobile-card-label">Created:</span>
              <span class="mobile-card-value">${new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div class="mobile-card-actions">
            <button class="btn btn-danger btn-sm delete-user-btn" data-id="${user.id}">Delete User</button>
          </div>
        </div>
      `).join('');
    }

    // Attach delete handlers for both views
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(parseInt(btn.dataset.id)));
    });
  }

  // ─── Modals Setup ──────────────────────────
  function setupModals() {
    // Album modal
    const albumModal = document.getElementById('album-modal');
    const albumModalClose = document.getElementById('album-modal-close');
    const albumCancelBtn = document.getElementById('album-cancel-btn');
    const albumSaveBtn = document.getElementById('album-save-btn');
    const albumForm = document.getElementById('album-form');
    const coverUploadZone = document.getElementById('cover-upload-zone');
    const coverFileInput = document.getElementById('cover-file-input');

    document.getElementById('add-album-btn').addEventListener('click', () => {
      openNewAlbumModal();
    });

    albumModalClose.addEventListener('click', () => closeModalEl(albumModal));
    albumCancelBtn.addEventListener('click', () => closeModalEl(albumModal));
    albumModal.addEventListener('click', (e) => { if (e.target === albumModal) closeModalEl(albumModal); });

    // Cover upload zone
    coverUploadZone.addEventListener('click', () => coverFileInput.click());
    coverUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      coverUploadZone.classList.add('dragover');
    });
    coverUploadZone.addEventListener('dragleave', () => coverUploadZone.classList.remove('dragover'));
    function updateCoverPreview(file) {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('cover-preview-img').src = e.target.result;
          document.getElementById('cover-preview-img').style.display = 'block';
          coverUploadZone.querySelector('h4').textContent = file.name;
        };
        reader.readAsDataURL(file);
      }
    }

    coverUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      coverUploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        coverFileInput.files = e.dataTransfer.files;
        updateCoverPreview(e.dataTransfer.files[0]);
      }
    });
    coverFileInput.addEventListener('change', () => {
      if (coverFileInput.files.length) {
        updateCoverPreview(coverFileInput.files[0]);
      }
    });

    albumSaveBtn.addEventListener('click', saveAlbum);

    // Song modal
    const songModal = document.getElementById('song-modal');
    const songModalClose = document.getElementById('song-modal-close');
    const songCancelBtn = document.getElementById('song-cancel-btn');
    const songSaveBtn = document.getElementById('song-save-btn');
    const songUploadZone = document.getElementById('song-upload-zone');
    const songFileInput = document.getElementById('song-file-input');

    document.getElementById('add-song-btn').addEventListener('click', () => {
      songModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    songModalClose.addEventListener('click', () => closeModalEl(songModal));
    songCancelBtn.addEventListener('click', () => closeModalEl(songModal));
    songModal.addEventListener('click', (e) => { if (e.target === songModal) closeModalEl(songModal); });

    songUploadZone.addEventListener('click', () => songFileInput.click());
    songUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      songUploadZone.classList.add('dragover');
    });
    songUploadZone.addEventListener('dragleave', () => songUploadZone.classList.remove('dragover'));
    songUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      songUploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        songFileInput.files = e.dataTransfer.files;
        showSongPreview(e.dataTransfer.files[0]);
      }
    });
    songFileInput.addEventListener('change', () => {
      if (songFileInput.files.length) {
        showSongPreview(songFileInput.files[0]);
      }
    });

    function showSongPreview(file) {
      const preview = document.getElementById('song-preview');
      const content = document.getElementById('song-upload-content');
      const filename = document.getElementById('song-filename');
      const filesize = document.getElementById('song-filesize');
      
      if (preview && content && filename && filesize) {
        filename.textContent = file.name;
        filesize.textContent = formatFileSize(file.size);
        content.style.display = 'none';
        preview.style.display = 'flex';
      }
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    songSaveBtn.addEventListener('click', saveSong);

    // User modal
    const userModal = document.getElementById('user-modal');
    const userModalClose = document.getElementById('user-modal-close');
    const userCancelBtn = document.getElementById('user-cancel-btn');
    const userSaveBtn = document.getElementById('user-save-btn');

    document.getElementById('add-user-btn').addEventListener('click', () => {
      userModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    userModalClose.addEventListener('click', () => closeModalEl(userModal));
    userCancelBtn.addEventListener('click', () => closeModalEl(userModal));
    userModal.addEventListener('click', (e) => { if (e.target === userModal) closeModalEl(userModal); });

    userSaveBtn.addEventListener('click', saveUser);

    // Global escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        [albumModal, songModal, userModal].forEach(m => closeModalEl(m));
      }
    });
  }

  function closeModalEl(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ─── Album CRUD ────────────────────────────
  function openNewAlbumModal() {
    document.getElementById('album-modal-title').textContent = 'New Album';
    document.getElementById('album-edit-id').value = '';
    document.getElementById('album-title-input').value = '';
    document.getElementById('album-artist-input').value = '';
    document.getElementById('album-year-input').value = '';
    document.getElementById('album-desc-input').value = '';
    document.getElementById('cover-file-input').value = '';
    document.getElementById('cover-upload-zone').querySelector('h4').textContent = 'Drop cover image here or click to browse';
    document.getElementById('cover-preview-img').src = '';
    document.getElementById('cover-preview-img').style.display = 'none';

    document.getElementById('album-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function openEditAlbumModal(id) {
    const album = albums.find(a => a.id === id);
    if (!album) return;

    document.getElementById('album-modal-title').textContent = 'Edit Album';
    document.getElementById('album-edit-id').value = album.id;
    document.getElementById('album-title-input').value = album.title;
    document.getElementById('album-artist-input').value = album.artist;
    document.getElementById('album-year-input').value = album.year || '';
    document.getElementById('album-desc-input').value = album.description || '';
    document.getElementById('cover-file-input').value = '';
    document.getElementById('cover-upload-zone').querySelector('h4').textContent = album.cover_image ? 'Current cover set — drop new to replace' : 'Drop cover image here or click to browse';
    const previewImg = document.getElementById('cover-preview-img');
    if (album.cover_image) {
      previewImg.src = album.cover_image;
      previewImg.style.display = 'block';
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }

    document.getElementById('album-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  async function saveAlbum() {
    const editId = document.getElementById('album-edit-id').value;
    const title = document.getElementById('album-title-input').value.trim();
    const artist = document.getElementById('album-artist-input').value.trim();
    const year = document.getElementById('album-year-input').value;
    const description = document.getElementById('album-desc-input').value.trim();
    const coverFile = document.getElementById('cover-file-input').files[0];

    if (!title || !artist) {
      showToast('Title and artist are required.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    if (year) formData.append('year', year);
    if (description) formData.append('description', description);
    if (coverFile) formData.append('cover', coverFile);

    try {
      const url = editId ? `/api/albums/${editId}` : '/api/albums';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to save album.', 'error');
        return;
      }

      showToast(editId ? 'Album updated!' : 'Album created!', 'success');
      closeModalEl(document.getElementById('album-modal'));
      await refreshAll();
    } catch (err) {
      showToast('Connection error.', 'error');
    }
  }

  async function deleteAlbum(id) {
    const album = albums.find(a => a.id === id);
    if (!confirm(`Delete "${album?.title}"? This will also delete all songs in this album.`)) return;

    try {
      const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Album deleted.', 'success');
        await refreshAll();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete.', 'error');
      }
    } catch (err) {
      showToast('Connection error.', 'error');
    }
  }

  // ─── Song CRUD ─────────────────────────────
  async function saveSong() {
    const title = document.getElementById('song-title-input').value.trim();
    const albumId = document.getElementById('song-album-select').value;
    const trackNumber = document.getElementById('song-track-input').value;
    const audioFile = document.getElementById('song-file-input').files[0];

    if (!title || !albumId || !audioFile) {
      showToast('Title, album, and audio file are required.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('album_id', albumId);
    if (trackNumber) formData.append('track_number', trackNumber);
    formData.append('audio', audioFile);

    // Disable button and show progress
    const saveBtn = document.getElementById('song-save-btn');
    saveBtn.textContent = 'Uploading...';
    saveBtn.disabled = true;

    try {
      const res = await fetch('/api/songs', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to upload song.', 'error');
        return;
      }

      showToast('Song uploaded!', 'success');
      closeModalEl(document.getElementById('song-modal'));

      // Reset form
      document.getElementById('song-title-input').value = '';
      document.getElementById('song-track-input').value = '';
      document.getElementById('song-file-input').value = '';
      
      // Reset song preview
      const songPreview = document.getElementById('song-preview');
      const songContent = document.getElementById('song-upload-content');
      if (songPreview && songContent) {
        songPreview.style.display = 'none';
        songContent.style.display = 'flex';
      }

      await refreshAll();
    } catch (err) {
      showToast('Connection error.', 'error');
    } finally {
      saveBtn.textContent = 'Upload Song';
      saveBtn.disabled = false;
    }
  }

  async function deleteSong(id) {
    if (!confirm('Delete this song?')) return;

    try {
      const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Song deleted.', 'success');
        await refreshAll();
      }
    } catch (err) {
      showToast('Connection error.', 'error');
    }
  }

  // ─── User CRUD ─────────────────────────────
  async function saveUser() {
    const username = document.getElementById('user-username-input').value.trim();
    const password = document.getElementById('user-password-input').value;
    const role = document.getElementById('user-role-select').value;

    if (!username || !password) {
      showToast('Username and password are required.', 'error');
      return;
    }

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Failed to create user.', 'error');
        return;
      }

      showToast('User created!', 'success');
      closeModalEl(document.getElementById('user-modal'));

      document.getElementById('user-username-input').value = '';
      document.getElementById('user-password-input').value = '';

      await loadUsers();
      updateStats();
    } catch (err) {
      showToast('Connection error.', 'error');
    }
  }

  async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;

    try {
      const res = await fetch(`/auth/users/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        showToast('User deleted.', 'success');
        await loadUsers();
        updateStats();
      } else {
        showToast(data.error || 'Failed to delete user.', 'error');
      }
    } catch (err) {
      showToast('Connection error.', 'error');
    }
  }

  // ─── Toast Notifications ───────────────────
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '✕'}</span>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Utilities ─────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getInitials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // ─── Start ─────────────────────────────────
  init();
})();
