# VPS Deployment Guide for Cursor AI

This guide helps you deploy this React application on your own VPS, replacing Lovable Cloud/Supabase with your own PostgreSQL database and local file storage.

## ⚠️ IMPORTANT: What Needs to Change

This project currently uses **Supabase** for:
1. **Authentication** - User login/signup
2. **Database** - PostgreSQL with Row Level Security (RLS)
3. **File Storage** - For site assets and uploads
4. **Edge Functions** - Serverless functions

You'll need to replace ALL of these with self-hosted alternatives.

---

## 📋 Prerequisites

- **VPS** with at least 2GB RAM, 20GB storage
- **Node.js 18+** installed
- **PostgreSQL 14+** installed
- **Nginx** or similar reverse proxy
- **PM2** for process management
- **SSL Certificate** (Let's Encrypt recommended)

---

## 🗄️ Step 1: Database Setup

### 1.1 Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.2 Create Database and User

```bash
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE movietrailers;
CREATE USER movieapp WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE movietrailers TO movieapp;
\q
```

### 1.3 Create Database Schema

Create a file `database/schema.sql` with this content:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (replaces Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_suspended BOOLEAN DEFAULT false,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Movies table
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  poster_url TEXT,
  trailer_url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_latest BOOLEAN DEFAULT false,
  release_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movie categories
CREATE TABLE movie_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  movie_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter signups
CREATE TABLE newsletter_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upcoming trailers
CREATE TABLE upcoming_trailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  trailer_url TEXT,
  release_date TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'general',
  is_released BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection movies
CREATE TABLE collection_movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page views (analytics)
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login history
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN DEFAULT true,
  login_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  total_watchlist INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'award',
  category TEXT DEFAULT 'general',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER DEFAULT 1,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes for performance
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_year ON movies(year);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_movie ON ratings(movie_id);
CREATE INDEX idx_page_views_date ON page_views(viewed_at);
```

Run the schema:
```bash
psql -U movieapp -d movietrailers -f database/schema.sql
```

---

## 🔐 Step 2: Replace Authentication

You need to create a custom authentication system. Here's what to build:

### 2.1 Create Backend API (Express.js)

Create a new folder `server/` and install dependencies:

```bash
mkdir server
cd server
npm init -y
npm install express cors bcryptjs jsonwebtoken pg dotenv cookie-parser helmet
npm install -D typescript @types/express @types/node @types/cors @types/bcryptjs @types/jsonwebtoken ts-node nodemon
```

### 2.2 Create `server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

// Middleware to verify JWT
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    
    const user = result.rows[0];
    
    // Create profile
    await pool.query(
      'INSERT INTO profiles (id, display_name) VALUES ($1, $2)',
      [user.id, displayName || null]
    );
    
    // Create JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

// Add all your other API routes here for:
// - Movies CRUD
// - Watchlist CRUD
// - Ratings CRUD
// - Comments CRUD
// - User profiles
// - Admin operations
// etc.

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 2.3 Create `server/.env`:

```env
DATABASE_URL=postgresql://movieapp:your_password@localhost:5432/movietrailers
JWT_SECRET=generate_a_very_long_random_string_here_at_least_64_chars
FRONTEND_URL=https://yourdomain.com
PORT=3001
```

---

## 📁 Step 3: File Storage Setup

### 3.1 Create Upload Directory

```bash
mkdir -p /var/www/uploads
chown -R www-data:www-data /var/www/uploads
```

### 3.2 Add File Upload Routes to Server

```typescript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: '/var/www/uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    cb(null, allowed.includes(file.mimetype));
  }
});

app.post('/api/upload', authenticate, upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const url = `${process.env.FRONTEND_URL}/uploads/${req.file.filename}`;
  res.json({ url });
});
```

---

## 🔄 Step 4: Frontend Changes Required

### 4.1 Files to Modify

You need to replace ALL Supabase imports and calls. Here are the main files:

| File | Changes Needed |
|------|----------------|
| `src/integrations/supabase/client.ts` | DELETE - Replace with custom API client |
| `src/hooks/useAuth.tsx` | Rewrite to use your API |
| `src/hooks/useMovies.tsx` | Rewrite to use your API |
| `src/hooks/useAdmin.tsx` | Rewrite to use your API |
| `src/hooks/useMovieRatings.tsx` | Rewrite to use your API |
| `src/hooks/useGuestStorage.tsx` | Keep as-is (uses localStorage) |
| `src/pages/Auth.tsx` | Update to use new auth API |
| `src/pages/Watchlist.tsx` | Update database calls |
| `src/pages/Favorites.tsx` | Update database calls |
| `src/pages/MyReviews.tsx` | Update database calls |
| All admin pages in `src/pages/admin/` | Update all database calls |

### 4.2 Create New API Client

Create `src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API Error');
    }
    
    return response.json();
  }

  // Auth
  async signUp(email: string, password: string, displayName?: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signOut() {
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  async getUser() {
    return this.request('/api/auth/me');
  }

  // Movies
  async getMovies() {
    return this.request('/api/movies');
  }

  async getMovie(id: string) {
    return this.request(`/api/movies/${id}`);
  }

  // Watchlist
  async getWatchlist() {
    return this.request('/api/watchlist');
  }

  async addToWatchlist(movieId: string) {
    return this.request('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ movieId }),
    });
  }

  async removeFromWatchlist(movieId: string) {
    return this.request(`/api/watchlist/${movieId}`, { method: 'DELETE' });
  }

  // Add more methods as needed...
}

export const api = new ApiClient();
```

### 4.3 Update Environment Variables

Create/update `.env`:

```env
VITE_API_URL=https://api.yourdomain.com
```

---

## 🌐 Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/movietrailers`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/movietrailers/dist;
    index index.html;

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/movietrailers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 Step 6: Build and Deploy

### 6.1 Build Frontend

```bash
# In project root
npm install
npm run build
```

### 6.2 Copy to Server

```bash
# Copy built files
scp -r dist/* user@yourserver:/var/www/movietrailers/dist/

# Copy server files
scp -r server/* user@yourserver:/var/www/movietrailers/server/
```

### 6.3 Start Backend with PM2

```bash
# On server
cd /var/www/movietrailers/server
npm install
npm run build  # If using TypeScript

# Start with PM2
pm2 start dist/index.js --name "movietrailers-api"
pm2 save
pm2 startup
```

---

## 🔒 Step 7: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

---

## ⚡ Step 8: Edge Functions Replacement

The current project has an edge function for TMDB search. You need to move this to your Express server:

```typescript
// Add to server/src/index.ts

app.get('/api/tmdb/search', authenticate, async (req, res) => {
  const { query } = req.query;
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query as string)}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'TMDB API error' });
  }
});
```

Add `TMDB_API_KEY` to your server `.env` file.

---

## 📝 Summary Checklist

- [ ] PostgreSQL installed and configured
- [ ] Database schema created
- [ ] Express.js backend created
- [ ] JWT authentication implemented
- [ ] File upload system configured
- [ ] All Supabase imports removed from frontend
- [ ] New API client created
- [ ] All hooks rewritten to use new API
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] PM2 process manager set up
- [ ] Environment variables configured

---

## ⚠️ Potential Complications

1. **Authentication Rewrite**: The biggest task. Every component using `useAuth` needs updating.

2. **Realtime Features**: Supabase provides realtime subscriptions. You'd need WebSockets (Socket.io) to replicate this.

3. **Row Level Security**: Supabase RLS is handled at database level. You must implement authorization in your API routes instead.

4. **Admin Checks**: The `is_admin()` function needs to be reimplemented as middleware.

5. **Type Safety**: The auto-generated Supabase types won't exist. You'll need to create your own TypeScript interfaces.

6. **File References**: All `@/integrations/supabase/*` imports must be removed/replaced.

7. **Edge Functions**: Move TMDB and any future serverless functions to Express routes.

---

## 💡 Recommended Approach

1. **Start with the backend** - Get Express + PostgreSQL + Auth working first
2. **Create the API client** - Build `src/lib/api.ts` with all needed methods
3. **Replace hooks one by one** - Start with `useAuth`, then `useMovies`, etc.
4. **Test locally** - Use `npm run dev` for frontend, `npm run dev` for backend
5. **Deploy backend first** - Make sure API is accessible
6. **Deploy frontend** - Point to production API
7. **Test everything** - Authentication, CRUD operations, file uploads

Good luck! 🚀
