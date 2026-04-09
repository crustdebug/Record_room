# 🎵 Record Room - Complete Project Description

## Overview

Record Room is a vintage-inspired music streaming web application that transforms your digital music collection into an immersive, nostalgic experience. Albums are displayed as vinyl records mounted on themed walls, and playback happens through an interactive turntable interface with a draggable tonearm - bringing the tactile joy of vinyl collecting into the digital age.

## Core Concept

The application recreates the experience of a personal record room where:
- Albums are displayed as framed vinyl records on customizable themed walls
- Users browse their collection by navigating between different wall pages
- Playing music involves dragging records onto a virtual turntable
- The tonearm can be physically moved to control playback
- The entire experience emphasizes visual aesthetics and interactive engagement

## Key Features

### 🎨 Visual Experience

**Wall Gallery System**
- Albums displayed as mounted vinyl records on themed walls
- 11 premium themes including Classic Warm, Dark Night, White Gallery, Modern Glass, Midnight Neon, Royal Velvet, Golden Hour, Forest Mist, Brick Wall, Concrete, and "For You"
- Multi-wall pagination system with smooth navigation
- Wall indicators showing current position
- Responsive design that adapts to desktop and mobile devices

**Interactive Turntable Player**
- Realistic vinyl player with spinning record animation
- Draggable tonearm that controls playback
- Drag-and-drop interface to load songs onto the turntable
- Visual feedback with "now playing" indicators
- Album artwork displayed on spinning vinyl

### 🎵 Music Management

**For Administrators**
- Upload and manage albums with cover art
- Add songs to albums with automatic metadata extraction
- Organize tracks with track numbers and durations
- Edit album information (title, artist, year, description)
- Delete albums and songs
- User management system

**For Users**
- Browse complete music collection
- Search albums by title, artist, or year
- Play songs through interactive turntable
- Automatic progression to next track
- Playback position memory
- Volume control
- Theme customization

### ⌨️ Keyboard Controls

- **Space**: Play/pause current song
- **Arrow Left**: Previous song
- **Arrow Right**: Next song
- **Arrow Keys** (wall view): Navigate between walls

### 👥 User Roles

**Admin Role**
- Full access to upload and manage content
- Album and song CRUD operations
- User management capabilities
- Access to admin dashboard with statistics

**User Role**
- Browse and play music collection
- Customize wall themes
- Search functionality
- Personalized listening experience

## Technical Architecture

### Backend Stack

**Core Technologies**
- Node.js (v14+) runtime environment
- Express.js (v5.2.1) web framework
- PostgreSQL database via Supabase
- Supabase Storage for file hosting

**Key Dependencies**
- `bcryptjs` - Password hashing and authentication
- `express-session` - Session management
- `connect-pg-simple` - PostgreSQL session store
- `multer` - File upload handling
- `music-metadata` - Audio file metadata extraction
- `@supabase/supabase-js` - Supabase client integration

### Frontend Stack

**Pure Vanilla JavaScript**
- No frameworks - lightweight and fast
- Modular JavaScript architecture
- CSS3 with custom properties for theming
- Responsive design with mobile-first approach

**Key Frontend Files**
- `admin.js` - Admin panel functionality
- `album-player.js` - Turntable player logic
- `auth.js` - Authentication handling
- `user.js` - Wall gallery and user interface
- `style.css` - Complete styling system

### Database Schema

**Users Table**
- User authentication and role management
- Supports 'admin' and 'user' roles
- Password hashing for security

**Albums Table**
- Album metadata (title, artist, year, description)
- Cover image references
- Timestamp tracking

**Songs Table**
- Song metadata (title, track number, duration)
- Foreign key relationship to albums
- File path references to Supabase Storage
- Cascade deletion with parent albums

### Storage Architecture

**Supabase Storage Buckets**
- `covers` bucket - Album cover images (public)
- `songs` bucket - Audio files (public)
- Direct streaming from cloud storage
- No local file storage required

### Session Management

- PostgreSQL-backed sessions for production reliability
- Secure cookie configuration
- 24-hour session duration
- Proxy-aware for deployment platforms

## Application Flow

### Authentication Flow
1. User lands on login page (`index.html`)
2. Credentials validated against database
3. Session created and stored in PostgreSQL
4. User redirected based on role (admin → admin panel, user → wall gallery)

### User Experience Flow
1. User views wall gallery with paginated album display
2. Search or browse through collection
3. Click album to open turntable player
4. Drag song cards onto turntable platter
5. Move tonearm to start playback
6. Enjoy music with visual feedback
7. Automatic progression to next track

### Admin Workflow
1. Access admin dashboard with statistics
2. Navigate between Albums, Songs, and Users panels
3. Upload new albums with cover art
4. Add songs to albums (automatic metadata extraction)
5. Manage existing content
6. Create and manage user accounts

## File Structure

```
record-room/
├── database/
│   ├── db.js              # Database initialization and connection
│   └── schema.sql         # PostgreSQL schema definitions
├── middleware/
│   └── auth.js            # Authentication middleware
├── public/
│   ├── css/
│   │   └── style.css      # Complete styling (themes, components, responsive)
│   ├── js/
│   │   ├── admin.js       # Admin panel logic and API calls
│   │   ├── album-player.js # Turntable player functionality
│   │   ├── auth.js        # Login/logout handling
│   │   └── user.js        # Wall gallery and navigation
│   ├── admin.html         # Admin dashboard interface
│   ├── album-player.html  # Turntable player page
│   ├── index.html         # Login page
│   └── user.html          # Wall gallery page
├── routes/
│   ├── albums.js          # Album CRUD API endpoints
│   ├── auth.js            # Authentication routes
│   └── songs.js           # Song CRUD API endpoints
├── utils/
│   └── supabase.js        # Supabase client configuration
├── data/                  # Local SQLite (development only)
├── uploads/               # Local uploads (legacy, not used in production)
├── .env                   # Environment configuration
├── .env.example           # Environment template
├── server.js              # Express server entry point
└── package.json           # Dependencies and scripts
```

## Environment Configuration

Required environment variables:
- `SESSION_SECRET` - Cryptographically secure session secret
- `PORT` - Server port (default: 3000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string

## Deployment Support

The application is designed for easy deployment to multiple platforms:

**Supported Platforms**
- Render (recommended for full-stack apps)
- Railway
- Vercel (with configuration)
- Any Node.js hosting platform

**Deployment Requirements**
- Node.js v14 or higher
- PostgreSQL database (via Supabase)
- Environment variables configured
- Supabase Storage buckets created and configured as public

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Role-based access control (RBAC)
- Secure cookie configuration
- SQL injection protection via parameterized queries
- HTTPS enforcement in production
- Environment variable protection

## Mobile Responsiveness

**Adaptive Interface**
- Mobile-optimized navigation with hamburger menu
- Touch-friendly controls
- Responsive grid layouts
- Mobile-specific play buttons (alternative to drag-and-drop)
- Optimized typography and spacing
- Swipe-friendly wall navigation

## Theme System

11 carefully crafted themes with complete color schemes:

1. **Classic Warm** - Vintage beige with warm tones
2. **Dark Night** - Deep blues for evening listening
3. **White Gallery** - Clean, minimalist aesthetic
4. **Modern Glass** - Glass morphism with transparency
5. **Midnight Neon** - Dark with cyan neon accents
6. **Royal Velvet** - Rich burgundy and gold luxury
7. **Golden Hour** - Warm sunset gradient
8. **Forest Mist** - Natural green tones
9. **Brick Wall** - Rustic brick texture
10. **Concrete** - Industrial gray aesthetic
11. **For You** - Dark matte purple gradient

Each theme affects:
- Wall backgrounds
- Text colors
- UI component styling
- Border colors
- Accent colors
- Button states

## Unique Selling Points

1. **Nostalgic Experience** - Recreates the joy of physical vinyl collecting
2. **Interactive Playback** - Drag-and-drop and tonearm control
3. **Visual Focus** - Beautiful, immersive UI design
4. **Theme Variety** - 11 distinct visual experiences
5. **No Framework Overhead** - Fast, lightweight vanilla JavaScript
6. **Cloud-Native** - Leverages Supabase for scalability
7. **Role-Based Access** - Separate admin and user experiences
8. **Keyboard Shortcuts** - Power user features
9. **Responsive Design** - Works on all devices
10. **Easy Deployment** - Multiple platform support

## Use Cases

- Personal music library management
- Family music collection sharing
- Small business background music system
- Podcast or audiobook library
- Music education and curation
- Vintage aesthetic enthusiasts
- Digital vinyl collecting

## Future Enhancement Possibilities

- Playlist creation and management
- Social features (sharing, comments)
- Music recommendations
- Lyrics display
- Equalizer controls
- Multiple user libraries
- Import from streaming services
- Mobile native apps
- Collaborative playlists
- Statistics and listening history

## License

MIT License - Open source and free to use, modify, and distribute.

---

**Record Room** brings the warmth and tactile satisfaction of vinyl records into the digital age, creating a unique music listening experience that's both nostalgic and modern.
