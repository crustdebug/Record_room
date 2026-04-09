# 🎵 Record Room

A beautiful, vintage-inspired music streaming application where albums are displayed as records mounted on walls. Built with Node.js, Express, and Supabase.

![Record Room](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 Beautiful UI
- **Wall Gallery View**: Albums displayed as framed records on themed walls
- **11 Premium Themes**: Classic Warm, Dark Night, White Gallery, Modern Glass, Midnight Neon, Royal Velvet, Golden Hour, Forest Mist, Brick Wall, Concrete, and "For You"
- **Turntable Player**: Interactive vinyl player with draggable tonearm
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🎵 Music Features
- **Album Management**: Upload and organize your music collection
- **Real-time Streaming**: Stream audio directly from Supabase Storage
- **Autoplay**: Automatically plays next song when current ends
- **Progress Tracking**: Remember playback position for each song
- **Now Playing Indicator**: See which album is currently playing on the wall
- **Search**: Quickly find albums by title, artist, or year

### ⌨️ Keyboard Shortcuts
- **Space**: Play/pause current song
- **Arrow Left**: Previous song
- **Arrow Right**: Next song
- **Arrow Keys** (wall view): Navigate between walls

### 👥 User Roles
- **Admin**: Upload albums, manage songs, full control
- **User**: Browse collection, play music, customize themes

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Supabase account (free tier works great!)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/record-room.git
cd record-room
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

Create a new project at [supabase.com](https://supabase.com)

Run the SQL schema in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of database/schema.sql
```

Create two storage buckets in Supabase Storage:
- `covers` (public)
- `songs` (public)

4. **Configure environment variables**

Create a `.env` file in the root directory:
```env
SESSION_SECRET=your-super-secret-random-string-here
PORT=3000
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

5. **Start the application**
```bash
npm start
```

6. **Access the app**
Open your browser and navigate to `http://localhost:3000`

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ Important**: Change the admin password immediately after first login!

## 📁 Project Structure

```
record-room/
├── database/
│   ├── db.js              # Database initialization
│   └── schema.sql         # Database schema
├── middleware/
│   └── auth.js            # Authentication middleware
├── public/
│   ├── css/
│   │   └── style.css      # All styles
│   ├── js/
│   │   ├── admin.js       # Admin panel logic
│   │   ├── album-player.js # Turntable player
│   │   ├── auth.js        # Login/register
│   │   └── user.js        # Wall gallery
│   ├── admin.html         # Admin dashboard
│   ├── album-player.html  # Album player page
│   ├── index.html         # Login page
│   └── user.html          # Wall gallery page
├── routes/
│   ├── albums.js          # Album API routes
│   ├── auth.js            # Authentication routes
│   └── songs.js           # Song API routes
├── utils/
│   └── supabase.js        # Supabase client
├── .env.example           # Environment variables template
├── .gitignore
├── package.json
├── server.js              # Express server
└── README.md
```

## 🎨 Themes

Record Room includes 11 beautiful themes:

1. **Classic Warm** - Warm beige tones with vintage feel
2. **Dark Night** - Deep dark blues for night listening
3. **White Gallery** - Clean, bright gallery aesthetic
4. **Modern Glass** - Sleek glass morphism design
5. **Midnight Neon** - Dark with neon cyan accents
6. **Royal Velvet** - Rich burgundy and gold
7. **Golden Hour** - Warm sunset gradient
8. **Forest Mist** - Natural green tones
9. **Brick Wall** - Rustic brick texture
10. **Concrete** - Industrial gray aesthetic
11. **For You** - Dark matte purple gradient

## 🔧 Configuration

### Supabase Storage Buckets

Make sure your storage buckets are configured as public:

1. Go to Storage in Supabase Dashboard
2. Create `covers` bucket → Make it public
3. Create `songs` bucket → Make it public

### Session Security

Generate a strong session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it to your `.env` file as `SESSION_SECRET`

## 📦 Deployment

### Deploy to Render

1. Push your code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repository
4. Add environment variables in Render dashboard
5. Deploy!

### Deploy to Railway

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repository
4. Add environment variables
5. Deploy!

### Deploy to Vercel

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: bcryptjs, express-session
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, CSS3

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by vintage record players and vinyl collections
- Built with love for music enthusiasts
- Special thanks to the Supabase team for their amazing platform

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ and 🎵
