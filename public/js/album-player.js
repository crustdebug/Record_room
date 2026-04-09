// ═══════════════════════════════════════════════════════════════
// Record Room — Album Player
// Enhanced turntable interface with drag-and-drop songs
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ─── State ──────────────────────────────────
  let albumData = null;
  let songs = [];
  let currentSong = null;
  let lastPlayedSongId = null; // Track the last song that was actually playing
  let isPlaying = false;
  let dragSongId = null;
  let audioElement = null;
  let volume = 0.75;

  // ─── DOM ────────────────────────────────────
  const loader = document.getElementById('page-loader');
  const albumTitle = document.getElementById('album-title');
  const albumArtist = document.getElementById('album-artist');
  const albumDescription = document.getElementById('album-description');
  const shelf = document.getElementById('shelf');
  const dropZone = document.getElementById('dropZone');
  const emptyState = document.getElementById('emptyState');
  const tonearmHint = document.getElementById('tonearmHint');
  const vinylOnPlatter = document.getElementById('vinylOnPlatter');
  const tonearm = document.getElementById('tonearm');
  const npTitle = document.getElementById('npTitle');
  const npArtist = document.getElementById('npArtist');
  const npBadge = document.getElementById('npBadge');
  const progressFill = document.getElementById('progressFill');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const currentTime = document.getElementById('currentTime');
  const totalTime = document.getElementById('totalTime');
  const themeBtn = document.getElementById('theme-btn');
  const themeDropdown = document.getElementById('theme-dropdown');

  // ─── Init ──────────────────────────────────
  async function init() {
    try {
      // Check authentication
      const authRes = await fetch('/auth/me');
      const authData = await authRes.json();
      if (!authData.user) {
        window.location.href = '/';
        return;
      }

      // Get album ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const albumId = urlParams.get('id');
      
      if (!albumId) {
        window.location.href = '/user.html';
        return;
      }

      // Load theme FIRST before loading album
      loadThemePreference();
      
      // Load album data
      await loadAlbum(albumId);
      setupThemeSelector();
      setupDragAndDrop();
      setupTonearmDrag();
      hideLoader();
    } catch (err) {
      console.error('Init error:', err);
      window.location.href = '/user.html';
    }
  }

  function hideLoader() {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 500);
  }

  // ─── Load Album ────────────────────────────
  async function loadAlbum(albumId) {
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      const data = await res.json();
      
      albumData = data.album;
      songs = data.songs || [];

      // Update album info
      if (albumTitle) albumTitle.textContent = albumData.title;
      if (albumArtist) albumArtist.textContent = `by ${albumData.artist}`;
      if (albumDescription) {
        albumDescription.textContent = albumData.description || 'No description available';
        if (!albumData.description) {
          albumDescription.style.display = 'none';
        }
      }

      // Build shelf with songs
      buildShelf();
    } catch (err) {
      console.error('Failed to load album:', err);
      if (albumTitle) albumTitle.textContent = 'Error Loading Album';
      if (albumArtist) albumArtist.textContent = '';
      if (albumDescription) albumDescription.textContent = '';
    }
  }

  // ─── Build Shelf ───────────────────────────
  function buildShelf() {
    shelf.innerHTML = '';
    
    if (songs.length === 0) {
      shelf.innerHTML = '<p style="color:rgba(212,168,67,0.4);text-align:center;padding:20px;">No tracks in this album</p>';
      return;
    }

    songs.forEach((song, index) => {
      const card = document.createElement('div');
      card.className = 'record-card';
      card.draggable = true;
      card.dataset.id = song.id;
      card.dataset.index = index;
      
      const duration = song.duration || '—:——';
      const trackNum = song.track_number || (index + 1);
      
      card.innerHTML = `
        <div class="mini-vinyl">${makeVinylSVG(song, 42)}</div>
        <div class="card-info">
          <div class="card-title">${escapeHtml(song.title)}</div>
          <div class="card-artist">Track ${trackNum}</div>
        </div>
        <div class="card-duration">${duration}</div>
        <button class="mobile-play-btn" aria-label="Play ${escapeHtml(song.title)}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      `;
      
      // Desktop: Drag and drop
      card.addEventListener('dragstart', (e) => {
        dragSongId = song.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
      });
      
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
      
      // Mobile: Tap to play
      const playBtn = card.querySelector('.mobile-play-btn');
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSong(song);
        
        // Auto-play on mobile after loading
        setTimeout(() => {
          tonearm.style.transform = '';
          tonearm.classList.remove('arm-idle');
          tonearm.classList.add('arm-playing');
          startPlayback();
        }, 300);
      });
      
      // Also allow tapping the card itself on mobile
      card.addEventListener('click', (e) => {
        // Only trigger on mobile (when dragging is not practical)
        if (window.innerWidth <= 768) {
          e.preventDefault();
          loadSong(song);
          
          // Auto-play on mobile after loading
          setTimeout(() => {
            tonearm.style.transform = '';
            tonearm.classList.remove('arm-idle');
            tonearm.classList.add('arm-playing');
            startPlayback();
          }, 300);
        }
      });
      
      shelf.appendChild(card);
    });
  }

  // ─── Drag and Drop ─────────────────────────
  function setupDragAndDrop() {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('drag-over');
      }
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      if (dragSongId !== null) {
        const song = songs.find(s => s.id === dragSongId);
        if (song) {
          loadSong(song);
        }
        dragSongId = null;
      }
    });
  }

  // ─── Load Song ─────────────────────────────
  function loadSong(song) {
    stopPlayback();
    
    // If switching to a different song, clear the saved position of the previous song
    if (lastPlayedSongId !== null && lastPlayedSongId !== song.id) {
      clearPlaybackPosition(lastPlayedSongId);
    }
    
    currentSong = song;
    
    dropZone.classList.add('has-record');
    emptyState.style.display = 'none';
    tonearmHint.style.display = 'block';
    vinylOnPlatter.innerHTML = makeVinylSVG(song, 300);
    
    npTitle.textContent = song.title;
    npArtist.textContent = albumData.artist;
    totalTime.textContent = song.duration || '—:——';
    progressFill.style.width = '0%';
    currentTime.textContent = '0:00';
    
    // Reset tonearm to idle position
    tonearm.classList.remove('arm-playing');
    tonearm.classList.add('arm-idle');
    
    // Highlight playing card
    document.querySelectorAll('.record-card').forEach(c => {
      c.classList.toggle('playing-card', parseInt(c.dataset.id) === song.id);
    });
    
    // Don't auto-play - wait for user to drag tonearm
    npBadge.textContent = 'READY';
    
    // Hide hint after 5 seconds
    setTimeout(() => {
      if (tonearmHint) tonearmHint.style.display = 'none';
    }, 5000);
  }

  // ─── Playback ──────────────────────────────
  function startPlayback() {
    if (!currentSong) return;
    
    isPlaying = true;
    npBadge.textContent = '● PLAYING';
    npBadge.classList.add('playing');
    vinylOnPlatter.classList.add('spinning');

    // Initialize audio element if needed
    if (!audioElement) {
      audioElement = new Audio();
      audioElement.volume = volume;
      
      audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
          const progress = (audioElement.currentTime / audioElement.duration) * 100;
          progressFill.style.width = progress + '%';
          currentTime.textContent = formatTime(audioElement.currentTime);
          totalTime.textContent = formatTime(audioElement.duration);
          
          // Save playback position every 2 seconds (only for current song)
          if (Math.floor(audioElement.currentTime) % 2 === 0) {
            savePlaybackPosition(currentSong.id, audioElement.currentTime);
          }
        }
      });
      
      audioElement.addEventListener('ended', () => {
        // Clear position when song ends naturally
        clearPlaybackPosition(currentSong.id);
        stopPlayback();
        // Auto-return tonearm to idle position
        tonearm.style.transform = ''; // Clear inline transform
        tonearm.classList.remove('arm-playing');
        tonearm.classList.add('arm-idle');
        
        // Autoplay next song
        playNextSong();
      });
      
      audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        stopPlayback();
      });
    }

    // Check if we're switching to a different song
    const isDifferentSong = lastPlayedSongId !== currentSong.id;
    
    // Only set src if it's a different song or first time playing
    if (!audioElement.src || !audioElement.src.includes(`/api/songs/stream/${currentSong.id}`)) {
      audioElement.src = `/api/songs/stream/${currentSong.id}`;
      
      // Only restore position if resuming the SAME song (not switching songs)
      if (!isDifferentSong) {
        const savedPosition = getPlaybackPosition(currentSong.id);
        if (savedPosition > 0) {
          audioElement.currentTime = savedPosition;
        }
      }
      // If it's a different song, start from beginning (currentTime defaults to 0)
    }
    
    // Update last played song ID
    lastPlayedSongId = currentSong.id;
    
    // Resume or start playback
    audioElement.play().catch(err => {
      console.error('Play error:', err);
      stopPlayback();
    });
  }

  function stopPlayback() {
    isPlaying = false;
    npBadge.textContent = 'PAUSED';
    npBadge.classList.remove('playing');
    vinylOnPlatter.classList.remove('spinning');
    
    if (audioElement) {
      audioElement.pause();
      // Save current position when pausing (for resume)
      if (currentSong) {
        savePlaybackPosition(currentSong.id, audioElement.currentTime);
      }
    }
  }

  window.setVolume = function(val) {
    volume = val / 100;
    document.getElementById('volVal').textContent = val;
    if (audioElement) {
      audioElement.volume = volume;
    }
  };

  // ─── Tonearm Drag Control ──────────────────
  function setupTonearmDrag() {
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    const playingRotation = -5;  // Tonearm ON record (rotated down)
    const idleRotation = -25;    // Tonearm AWAY from record (rotated up)

    // Get the tonearm rotation based on cursor position
    function getTonearmAngle(clientX, clientY) {
      const rect = dropZone.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      
      // Calculate horizontal position relative to turntable center
      const deltaX = clientX - centerX;
      
      // Map cursor position to tonearm rotation
      // When cursor is LEFT of center (over record): +22 degrees (playing)
      // When cursor is RIGHT of center (away): -45 degrees (idle)
      let rotation = idleRotation;
      
      if (deltaX < -rect.width * 0.15) {
        // Cursor is well LEFT of center - playing position
        rotation = playingRotation;
      } else if (deltaX > rect.width * 0.15) {
        // Cursor is well RIGHT of center - idle position
        rotation = idleRotation;
      } else {
        // Interpolate between playing and idle based on horizontal position
        const t = (deltaX + rect.width * 0.15) / (rect.width * 0.3);
        rotation = playingRotation + (idleRotation - playingRotation) * t;
      }
      
      return rotation;
    }

    tonearm.addEventListener('mousedown', (e) => {
      if (!currentSong) return;
      
      console.log('Tonearm mousedown'); // Debug
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      
      // Hide hint when user starts dragging
      if (tonearmHint) tonearmHint.style.display = 'none';
      
      tonearm.style.cursor = 'grabbing';
      
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || !currentSong) return;
      
      // Check if user has moved enough to count as a drag (not just a click)
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      
      if (!hasMoved && (deltaX > 5 || deltaY > 5)) {
        hasMoved = true;
        // First time moving - remove classes and add dragging class
        tonearm.classList.remove('arm-idle', 'arm-playing');
        tonearm.classList.add('dragging');
      }
      
      if (hasMoved) {
        const rotation = getTonearmAngle(e.clientX, e.clientY);
        tonearm.style.transform = `rotate(${rotation}deg)`;
        
        // Start playing when tonearm is moved to playing position (over record)
        // Playing is -5, idle is -25, so when rotation is greater than -15 (closer to -5)
        if (rotation > -15 && !isPlaying) {
          console.log('Starting playback - tonearm on record'); // Debug
          startPlayback();
        } else if (rotation < -20 && isPlaying) {
          console.log('Stopping playback - tonearm lifted'); // Debug
          stopPlayback();
        }
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        console.log('Tonearm mouseup, hasMoved:', hasMoved, 'isPlaying:', isPlaying); // Debug
        
        isDragging = false;
        tonearm.classList.remove('dragging');
        tonearm.style.cursor = 'grab';
        
        // Only update position if user actually dragged (not just clicked)
        if (hasMoved) {
          // Get final rotation based on current mouse position
          const finalRotation = getTonearmAngle(e.clientX, e.clientY);
          
          // Keep the tonearm at its current position without snapping
          tonearm.style.transform = `rotate(${finalRotation}deg)`;
          
          // Update classes based on playing state but keep inline transform
          if (isPlaying) {
            tonearm.classList.remove('arm-idle');
            tonearm.classList.add('arm-playing');
          } else {
            tonearm.classList.remove('arm-playing');
            tonearm.classList.add('arm-idle');
          }
        } else {
          // Just a click, not a drag - restore to current state without changing position
          if (isPlaying) {
            tonearm.classList.remove('arm-idle');
            tonearm.classList.add('arm-playing');
          } else {
            tonearm.classList.remove('arm-playing');
            tonearm.classList.add('arm-idle');
          }
        }
        
        hasMoved = false;
      }
    });

    // Touch support for mobile
    tonearm.addEventListener('touchstart', (e) => {
      if (!currentSong) return;
      
      isDragging = true;
      hasMoved = false;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      // Hide hint when user starts dragging
      if (tonearmHint) tonearmHint.style.display = 'none';
      
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging || !currentSong) return;
      
      const touch = e.touches[0];
      
      // Check if user has moved enough to count as a drag (not just a tap)
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);
      
      if (!hasMoved && (deltaX > 5 || deltaY > 5)) {
        hasMoved = true;
        // First time moving - remove classes and add dragging class
        tonearm.classList.remove('arm-idle', 'arm-playing');
        tonearm.classList.add('dragging');
      }
      
      if (hasMoved) {
        const rotation = getTonearmAngle(touch.clientX, touch.clientY);
        tonearm.style.transform = `rotate(${rotation}deg)`;
        
        if (rotation > -15 && !isPlaying) {
          startPlayback();
        } else if (rotation < -20 && isPlaying) {
          stopPlayback();
        }
      }
    });

    document.addEventListener('touchend', (e) => {
      if (isDragging) {
        isDragging = false;
        tonearm.classList.remove('dragging');
        
        // Only update position if user actually dragged (not just tapped)
        if (hasMoved) {
          // Get final rotation based on last touch position
          const touch = e.changedTouches[0];
          const finalRotation = getTonearmAngle(touch.clientX, touch.clientY);
          
          // Keep the tonearm at its current position without snapping
          tonearm.style.transform = `rotate(${finalRotation}deg)`;
          
          if (isPlaying) {
            tonearm.classList.remove('arm-idle');
            tonearm.classList.add('arm-playing');
          } else {
            tonearm.classList.remove('arm-playing');
            tonearm.classList.add('arm-idle');
          }
        } else {
          // Just a tap, not a drag - restore to current state without changing position
          if (isPlaying) {
            tonearm.classList.remove('arm-idle');
            tonearm.classList.add('arm-playing');
          } else {
            tonearm.classList.remove('arm-playing');
            tonearm.classList.add('arm-idle');
          }
        }
        
        hasMoved = false;
      }
    });

    // Make tonearm visually grabbable
    tonearm.style.cursor = 'grab';
    console.log('Tonearm drag setup complete'); // Debug
  }

  // ─── Autoplay Next Song ────────────────────
  function playNextSong() {
    if (!currentSong || songs.length === 0) return;
    
    // Find current song index
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    
    // Get next song (loop back to first if at end)
    const nextIndex = (currentIndex + 1) % songs.length;
    const nextSong = songs[nextIndex];
    
    if (nextSong) {
      // Load and auto-play next song
      loadSong(nextSong);
      
      // Animate tonearm to playing position after a short delay
      setTimeout(() => {
        tonearm.style.transform = ''; // Clear inline transform
        tonearm.classList.remove('arm-idle');
        tonearm.classList.add('arm-playing');
        startPlayback();
      }, 800);
    }
  }

  function playPreviousSong() {
    if (!currentSong || songs.length === 0) return;
    
    // Find current song index
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    
    // Get previous song (loop to last if at beginning)
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    const prevSong = songs[prevIndex];
    
    if (prevSong) {
      // Load and auto-play previous song
      loadSong(prevSong);
      
      // Animate tonearm to playing position after a short delay
      setTimeout(() => {
        tonearm.style.transform = ''; // Clear inline transform
        tonearm.classList.remove('arm-idle');
        tonearm.classList.add('arm-playing');
        startPlayback();
      }, 800);
    }
  }

  // Progress bar click to seek
  progressBarContainer.addEventListener('click', (e) => {
    if (!audioElement || !audioElement.duration) return;
    const rect = progressBarContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioElement.currentTime = percent * audioElement.duration;
  });

  // ─── Vinyl SVG Generator ───────────────────
  function makeVinylSVG(song, size = 200) {
    const s = size;
    const cx = s / 2;
    const cy = s / 2;
    const r = s / 2 - 2;
    
    // Generate grooves
    const rings = Array.from({ length: 18 }, (_, i) => 
      `<circle cx="${cx}" cy="${cy}" r="${r * (0.48 + i * 0.025)}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.8"/>`
    ).join('');
    
    const labelR = r * 0.28;
    const labelColor = getColorForSong(song);
    const grooveColor = '#0d0802';
    
    // Truncate text for label
    const titleWords = song.title.split(' ');
    const titleText = titleWords[0] || 'Track';
    const artistText = albumData ? albumData.artist.split(' ').slice(-1)[0] : 'Artist';
    
    return `<svg viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg${song.id}" cx="40%" cy="35%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.07)"/>
          <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${grooveColor}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rg${song.id})"/>
      ${rings}
      <circle cx="${cx}" cy="${cy}" r="${labelR}" fill="${labelColor}"/>
      <circle cx="${cx}" cy="${cy}" r="${labelR * 0.85}" fill="${labelColor}" opacity="0.7"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="${s * 0.045}" font-family="Playfair Display,serif" font-weight="700">${titleText}</text>
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="${s * 0.032}" font-family="DM Mono,monospace">${artistText}</text>
      <circle cx="${cx}" cy="${cy}" r="${s * 0.025}" fill="#111"/>
      <circle cx="${cx}" cy="${cy}" r="${s * 0.012}" fill="#333"/>
    </svg>`;
  }

  function getColorForSong(song) {
    const colors = ['#c0392b', '#d4a843', '#2c7873', '#7d3c98', '#784212', '#2980b9'];
    return colors[song.id % colors.length];
  }

  // ─── Theme Selector ────────────────────────
  function setupThemeSelector() {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!themeBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
        themeDropdown.classList.remove('active');
      }
    });

    document.querySelectorAll('.theme-option-album').forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        applyTheme(theme);
        saveThemePreference(theme);
        
        document.querySelectorAll('.theme-option-album').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        themeDropdown.classList.remove('active');
      });
    });
  }

  function applyTheme(theme) {
    const classes = Array.from(document.body.classList).filter(c => c.startsWith('theme-'));
    document.body.classList.remove(...classes);
    document.body.classList.add(`theme-${theme}`);
  }

  function saveThemePreference(theme) {
    localStorage.setItem('recordroom-wall-theme', theme);
  }

  function loadThemePreference() {
    const savedTheme = localStorage.getItem('recordroom-wall-theme') || 'classic';
    applyTheme(savedTheme);
    
    const activeOption = document.querySelector(`.theme-option-album[data-theme="${savedTheme}"]`);
    if (activeOption) {
      activeOption.classList.add('active');
    }
  }

  // ─── Back Button ───────────────────────────
  window.goBack = function() {
    window.location.href = '/user.html';
  };

  // ─── Spacebar Shortcut ─────────────────────
  document.addEventListener('keydown', (e) => {
    // Space for play/pause
    if (e.code === 'Space' && currentSong) {
      e.preventDefault();
      
      if (isPlaying) {
        // Stop playing - animate tonearm to idle
        tonearm.style.transform = ''; // Clear inline transform to allow CSS animation
        tonearm.classList.remove('arm-playing');
        tonearm.classList.add('arm-idle');
        stopPlayback();
      } else {
        // Start playing - animate tonearm to playing
        tonearm.style.transform = ''; // Clear inline transform to allow CSS animation
        tonearm.classList.remove('arm-idle');
        tonearm.classList.add('arm-playing');
        startPlayback();
      }
    }
    
    // Arrow keys for next/prev song
    if (currentSong && songs.length > 0) {
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        playNextSong();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        playPreviousSong();
      }
    }
  });

  // ─── Utilities ─────────────────────────────
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ─── Playback Position Memory ──────────────
  function savePlaybackPosition(songId, position) {
    const key = `recordroom-position-${songId}`;
    localStorage.setItem(key, position.toString());
  }

  function getPlaybackPosition(songId) {
    const key = `recordroom-position-${songId}`;
    const saved = localStorage.getItem(key);
    return saved ? parseFloat(saved) : 0;
  }

  function clearPlaybackPosition(songId) {
    const key = `recordroom-position-${songId}`;
    localStorage.removeItem(key);
  }

  // ─── Start ─────────────────────────────────
  init();
})();
