// ═══════════════════════════════════════════════════════════════
// Record Room — Wall Gallery & Audio Player
// Albums mounted on walls with pagination
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ─── Config ─────────────────────────────────
  const ALBUMS_PER_WALL = 6; // Restore to 6 albums per wall

  // ─── State ──────────────────────────────────
  let currentUser = null;
  let albums = [];
  let allAlbums = []; // Store all albums for search
  let currentWall = 0;
  let totalWalls = 0;
  let searchQuery = '';
  let nowPlayingAlbumId = null;

  // ─── DOM ────────────────────────────────────
  const loader = document.getElementById('page-loader');
  const displayName = document.getElementById('user-display-name');
  const logoutBtn = document.getElementById('logout-btn');
  const wallSlider = document.getElementById('wall-slider');
  const wallLabel = document.getElementById('wall-label');
  const wallIndicators = document.getElementById('wall-indicators');
  const prevBtn = document.getElementById('wall-prev');
  const nextBtn = document.getElementById('wall-next');
  const wallSurface = document.querySelector('.wall-surface');
  const themeBtn = document.getElementById('theme-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  // ─── Init ──────────────────────────────────
  async function init() {
    try {
      const res = await fetch('/auth/me');
      const data = await res.json();
      if (!data.user) { window.location.href = '/'; return; }

      currentUser = data.user;
      displayName.textContent = currentUser.username;

      await loadAlbums();
      setupWallNavigation();
      setupThemeSelector();
      setupSearch();
      loadThemePreference();
      loadNowPlaying();
      hideLoader();
    } catch (err) {
      window.location.href = '/';
    }
  }

  function hideLoader() {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 500);
  }

  // ─── Load Albums ───────────────────────────
  async function loadAlbums() {
    try {
      const res = await fetch('/api/albums');
      const data = await res.json();
      allAlbums = data.albums || [];
      filterAlbums();
    } catch (err) {
      wallSlider.innerHTML = `
        <div class="wall-page">
          <div class="empty-state">
            <h3>Something went wrong</h3>
            <p>Couldn't load your collection. Please try refreshing.</p>
          </div>
        </div>
      `;
    }
  }

  // ─── Search & Filter ───────────────────────
  function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      searchClear.style.display = searchQuery ? 'block' : 'none';
      filterAlbums();
    });

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        filterAlbums();
        searchInput.focus();
      });
    }
  }

  function filterAlbums() {
    if (!searchQuery) {
      albums = [...allAlbums];
    } else {
      albums = allAlbums.filter(album => 
        album.title.toLowerCase().includes(searchQuery) ||
        album.artist.toLowerCase().includes(searchQuery) ||
        (album.year && album.year.toString().includes(searchQuery))
      );
    }
    currentWall = 0;
    renderWalls();
  }

  // ─── Render Walls ──────────────────────────
  function renderWalls() {
    if (albums.length === 0) {
      totalWalls = 1;
      const emptyMessage = searchQuery 
        ? `<h3>No Results Found</h3><p>No albums match "${escapeHtml(searchQuery)}". Try a different search.</p>`
        : `<h3>The Wall is Empty</h3><p>No albums have been hung yet. Ask an admin to add some records!</p>`;
      
      wallSlider.innerHTML = `
        <div class="wall-page">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            ${emptyMessage}
          </div>
        </div>
      `;
      updateNavigation();
      return;
    }

    // Split albums into wall pages
    totalWalls = Math.ceil(albums.length / ALBUMS_PER_WALL);
    let html = '';

    for (let w = 0; w < totalWalls; w++) {
      const start = w * ALBUMS_PER_WALL;
      const end = Math.min(start + ALBUMS_PER_WALL, albums.length);
      const wallAlbums = albums.slice(start, end);

      html += '<div class="wall-page">';
      
      for (let i = 0; i < ALBUMS_PER_WALL; i++) {
        const album = wallAlbums[i];
        if (!album) {
          html += '<div class="album-card-placeholder-empty"></div>';
          continue;
        }

        const coverHtml = album.cover_image
          ? `<img src="${album.cover_image}" alt="${escapeHtml(album.title)}" loading="lazy">`
          : `<div class="album-cover-placeholder">${getInitials(album.title)}</div>`;

        const isNowPlaying = nowPlayingAlbumId && parseInt(nowPlayingAlbumId) === album.id;
        const nowPlayingClass = isNowPlaying ? ' now-playing' : '';
        const nowPlayingBadge = isNowPlaying ? '<div class="now-playing-badge">● NOW PLAYING</div>' : '';

        html += `
          <div class="album-card${nowPlayingClass}" data-album-id="${album.id}">
            ${nowPlayingBadge}
            <div class="album-frame">
              <div class="album-card-inner">
                <div class="vinyl-disc"></div>
                <div class="album-cover">
                  ${coverHtml}
                </div>
              </div>
            </div>
            <div class="album-label">
              <h3>${escapeHtml(album.title)}</h3>
              <div class="artist">${escapeHtml(album.artist)}</div>
            </div>
          </div>
        `;
      }
      html += '</div>';
    }

    wallSlider.innerHTML = html;

    // Attach click handlers
    document.querySelectorAll('.album-card').forEach(card => {
      card.addEventListener('click', () => {
        openAlbumModal(card.dataset.albumId);
      });
    });

    // Render indicators
    renderIndicators();
    updateNavigation();
  }

  // ─── Wall Navigation ──────────────────────
  function setupWallNavigation() {
    prevBtn.addEventListener('click', () => goToWall(currentWall - 1));
    nextBtn.addEventListener('click', () => goToWall(currentWall + 1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (modalOverlay.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') goToWall(currentWall - 1);
      if (e.key === 'ArrowRight') goToWall(currentWall + 1);
    });
  }

  function goToWall(index) {
    if (index < 0 || index >= totalWalls) return;
    currentWall = index;
    
    // Slide the wall
    wallSlider.style.transform = `translateX(-${currentWall * 100}%)`;
    
    updateNavigation();
  }

  function updateNavigation() {
    // Arrows
    prevBtn.disabled = currentWall === 0;
    nextBtn.disabled = currentWall >= totalWalls - 1;

    // Hide arrows if only one wall
    if (totalWalls <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      wallIndicators.style.display = 'none';
      wallLabel.style.display = 'none';
    } else {
      prevBtn.style.display = '';
      nextBtn.style.display = '';
      wallIndicators.style.display = '';
      wallLabel.style.display = '';
    }

    // Label
    wallLabel.textContent = `Wall ${currentWall + 1} of ${totalWalls}`;

    // Dots
    document.querySelectorAll('.wall-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentWall);
    });
  }

  function renderIndicators() {
    if (totalWalls <= 1) {
      wallIndicators.innerHTML = '';
      return;
    }

    wallIndicators.innerHTML = Array.from({ length: totalWalls }, (_, i) =>
      `<div class="wall-dot ${i === 0 ? 'active' : ''}" data-wall="${i}"></div>`
    ).join('');

    wallIndicators.querySelectorAll('.wall-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        goToWall(parseInt(dot.dataset.wall));
      });
    });
  }

  // ─── Album Detail Modal ────────────────────
  async function openAlbumModal(albumId) {
    // Save as now playing
    saveNowPlaying(albumId);
    // Redirect to album player page
    window.location.href = `/album-player.html?id=${albumId}`;
  }

  // ─── Now Playing Tracking ──────────────────
  function saveNowPlaying(albumId) {
    localStorage.setItem('recordroom-now-playing', albumId);
  }

  function loadNowPlaying() {
    nowPlayingAlbumId = localStorage.getItem('recordroom-now-playing');
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'recordroom-now-playing') {
      nowPlayingAlbumId = e.newValue;
      renderWalls();
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // ─── Utilities ─────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // ─── Theme Selector ────────────────────────
  function setupThemeSelector() {
    // Toggle dropdown
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!themeBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
        themeDropdown.classList.remove('active');
      }
    });

    // Theme selection
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        applyTheme(theme);
        saveThemePreference(theme);
        
        // Update active state
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        themeDropdown.classList.remove('active');
      });
    });
  }

  function applyTheme(theme) {
    // Remove all theme classes from body
    const classes = Array.from(document.body.classList).filter(c => c.startsWith('theme-'));
    document.body.classList.remove(...classes);
    // Add selected theme to body
    document.body.classList.add(`theme-${theme}`);
  }

  function saveThemePreference(theme) {
    localStorage.setItem('recordroom-wall-theme', theme);
  }

  function loadThemePreference() {
    const savedTheme = localStorage.getItem('recordroom-wall-theme') || 'classic';
    applyTheme(savedTheme);
    
    // Set active state on load
    const activeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
    if (activeOption) {
      activeOption.classList.add('active');
    }
  }

  // ─── Start ─────────────────────────────────
  init();
})();
