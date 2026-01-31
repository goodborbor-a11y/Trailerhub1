import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import sharp from 'sharp';
import { createHash } from 'crypto';

// Load environment variables
// Try multiple paths for flexibility (local dev vs Docker)
dotenv.config({ path: '../.env' });
dotenv.config(); // Also try default .env in current directory

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Google OAuth Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const googleOAuthClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL || 'http://localhost:3001'}/auth/google/callback`
);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://static.cloudflareinsights.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "blob:", "https://i.ytimg.com", "https://image.tmdb.org", "https://*.tmdb.org", "https://trailershub.org"],
      "frame-src": ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://*.youtube.com"],
      "connect-src": ["'self'", "https://api.themoviedb.org", "https://*.themoviedb.org", "https://trailershub.org"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "object-src": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
// CORS: Allow both frontend URL and production domain
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://trailershub.org',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  if (!req.path.startsWith('/uploads')) {
    console.log(`[API] ${req.method} ${req.path}`, {
      hasBody: !!req.body,
      query: req.query,
      ip: req.ip
    });
  }
  next();
});

app.use(cookieParser());

// Page view tracking middleware (non-blocking)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Skip tracking for API endpoints, static assets, and admin routes
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/auth/') ||
    req.path.startsWith('/admin/') ||
    req.path.startsWith('/uploads/') ||
    req.path.startsWith('/tmdb/') ||
    req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i)
  ) {
    return next();
  }

  // Track page view asynchronously (don't block request)
  setImmediate(async () => {
    try {
      const visitorId = req.cookies.guest_id ||
        `visitor_${Buffer.from(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'}-${req.headers['user-agent'] || 'unknown'}`).toString('base64').substring(0, 32)}`;

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const referrer = req.headers.referer || null;
      const pagePath = req.path || '/';

      await pool.query(
        `INSERT INTO page_views (visitor_id, page_path, referrer, user_agent, viewed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [visitorId, pagePath, referrer, userAgent]
      );
    } catch (error) {
      // Silently fail - don't break the request
      console.error('Page view tracking error:', error);
    }
  });

  next();
});

// File upload configuration
const uploadDir = process.env.UPLOAD_DIR || '/var/www/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===========================================
// LOCAL STORAGE HELPERS
// ===========================================

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Users
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const getLocalUsers = (): any[] => {
  if (!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (e) { console.error('Error reading users file:', e); return []; }
};
const saveLocalUsers = (users: any[]) => {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch (e) { console.error('Error writing users file:', e); throw e; }
};

// Comments
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
interface LocalComment {
  id: string; movie_id: string; user_id: string | null; parent_comment_id: string | null;
  author_name: string; content: string; guest_identifier: string | null; status: string;
  created_at: string; display_name: string; avatar_url: string | null; likes: string[];
}
const getLocalComments = (): LocalComment[] => {
  if (!fs.existsSync(COMMENTS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8')); } catch (e) { console.error('Error reading comments file:', e); return []; }
};
const saveLocalComments = (comments: LocalComment[]) => {
  try { fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2)); } catch (e) { console.error('Error writing comments file:', e); throw e; }
};

// Movies
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const getLocalMovies = (): any[] => {
  if (!fs.existsSync(MOVIES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf-8')); } catch (e) { console.error('Error reading movies file:', e); return []; }
};
const saveLocalMovies = (movies: any[]) => {
  try { fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2)); } catch (e) { console.error('Error writing movies file:', e); }
};

// Ratings
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
interface LocalRating {
  id: string; user_id: string; movie_id: string; rating: number; review: string; created_at: string; display_name: string;
}
const getLocalRatings = (): LocalRating[] => {
  if (!fs.existsSync(RATINGS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf-8')); } catch (e) { console.error('Error reading ratings file:', e); return []; }
};
const saveLocalRatings = (ratings: LocalRating[]) => {
  try { fs.writeFileSync(RATINGS_FILE, JSON.stringify(ratings, null, 2)); } catch (e) { console.error('Error writing ratings file:', e); throw e; }
};

// Watchlist
const WATCHLIST_FILE = path.join(DATA_DIR, 'watchlist.json');
const getLocalWatchlist = (): any[] => {
  if (!fs.existsSync(WATCHLIST_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(WATCHLIST_FILE, 'utf-8')); } catch (e) { console.error('Error reading watchlist file:', e); return []; }
};
const saveLocalWatchlist = (watchlist: any[]) => {
  try { fs.writeFileSync(WATCHLIST_FILE, JSON.stringify(watchlist, null, 2)); } catch (e) { console.error('Error writing watchlist file:', e); throw e; }
};

// Categories
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
interface LocalCategory {
  id: string; name: string; slug: string; description?: string; created_at?: string; updated_at?: string;
}
const getLocalCategories = (): LocalCategory[] => {
  try {
    if (!fs.existsSync(CATEGORIES_FILE)) return [];
    return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
  } catch (error) { console.error('Error reading categories file:', error); return []; }
};
const saveLocalCategories = (categories: LocalCategory[]) => {
  try { fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2)); } catch (error) { console.error('Error writing categories file:', error); }
};

// Newsletter
const NEWSLETTER_FILE = path.join(DATA_DIR, 'newsletter.json');
const getLocalNewsletter = (): any[] => {
  if (!fs.existsSync(NEWSLETTER_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(NEWSLETTER_FILE, 'utf-8')); } catch (e) { console.error('Error reading newsletter file:', e); return []; }
};
const saveLocalNewsletter = (subscribers: any[]) => {
  try { fs.writeFileSync(NEWSLETTER_FILE, JSON.stringify(subscribers, null, 2)); } catch (e) { console.error('Error writing newsletter file:', e); }
};

// Visitors
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const getLocalVisitors = (): any => {
  if (!fs.existsSync(VISITORS_FILE)) return { stats: { todayVisitors: 0, weekVisitors: 0, monthVisitors: 0, yearVisitors: 0 }, dailyData: [], weeklyData: [], monthlyData: [], yearlyData: [] };
  try { return JSON.parse(fs.readFileSync(VISITORS_FILE, 'utf-8')); } catch (e) { console.error('Error reading visitors file:', e); return { stats: { todayVisitors: 0, weekVisitors: 0, monthVisitors: 0, yearVisitors: 0 }, dailyData: [], weeklyData: [], monthlyData: [], yearlyData: [] }; }
};

// Login History
const LOGIN_HISTORY_FILE = path.join(DATA_DIR, 'login_history.json');
const getLocalLoginHistory = (): any[] => {
  if (!fs.existsSync(LOGIN_HISTORY_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(LOGIN_HISTORY_FILE, 'utf-8')); } catch (e) { console.error('Error reading login history file:', e); return []; }
};

// Upcoming
const UPCOMING_FILE = path.join(DATA_DIR, 'upcoming.json');
const getLocalUpcoming = (): any[] => {
  if (!fs.existsSync(UPCOMING_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(UPCOMING_FILE, 'utf-8')); } catch (e) { console.error('Error reading upcoming file:', e); return []; }
};
const saveLocalUpcoming = (trailers: any[]) => {
  try { fs.writeFileSync(UPCOMING_FILE, JSON.stringify(trailers, null, 2)); } catch (e) { console.error('Error writing upcoming file:', e); }
};

// Settings
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const getLocalSettings = (): any => {
  if (!fs.existsSync(SETTINGS_FILE)) return { site_name: 'Trailers Hub', tagline: 'Your Ultimate Destination for Movie Trailers', site_logo_url: null, favicon_urls: null, about_text: 'TrailerHub is your ultimate destination for movie trailers from around the world.', copyright_text: '© 2025 TrailerHub. All rights reserved.' };
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')); } catch (e) { console.error('Error reading settings file:', e); return {}; }
};
const saveLocalSettings = (settings: any) => {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2)); } catch (e) { console.error('Error writing settings file:', e); }
};

/**
 * Helper to get settings merged from DB (priority) and local defaults
 */
async function getMergedSettings() {
  const localSettings = getLocalSettings();
  try {
    const dbResult = await pool.query("SELECT setting_key, setting_value FROM site_settings");
    if (dbResult.rows.length > 0) {
      const dbSettings: any = {};
      dbResult.rows.forEach(row => {
        try { dbSettings[row.setting_key] = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value; } catch (e) { dbSettings[row.setting_key] = row.setting_value; }
      });
      return { ...localSettings, ...dbSettings };
    }
  } catch (err) { console.error('getMergedSettings DB error:', err); }
  return localSettings;
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') }
});

// Auth Middleware
interface AuthRequest extends Request {
  user?: { id: string; email: string; role?: string };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first (Bearer token)
  let token = req.headers.authorization?.split(' ')[1];

  // Fallback to cookie if no Authorization header
  if (!token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log('Authentication failed: No token provided', {
      hasAuthHeader: !!req.headers.authorization,
      hasCookie: !!req.cookies.token,
      path: req.path,
    });
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('Token verification failed:', {
      error: error.message,
      path: req.path,
      tokenLength: token.length,
    });
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware for guest support
const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      req.user = decoded;
    } catch (error) {
      // Invalid token, continue as guest
      req.user = undefined;
    }
  }
  next();
};

// Generate or get guest identifier from request
const getGuestIdentifier = (req: Request): string => {
  // Try to get from cookie first (persistent across sessions)
  let guestId = req.cookies.guest_id;

  if (!guestId) {
    // Generate new guest ID based on IP + User-Agent + timestamp
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = Date.now();
    guestId = `guest_${Buffer.from(`${ip}-${userAgent}-${timestamp}`).toString('base64').substring(0, 32)}`;
  }

  return guestId;
};

const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    // 1. Check Database (user_roles table)
    // Wrap in try/catch specifically for the query to prevent 500 crash if table missing
    try {
      const dbResult = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [req.user.id]);
      if (dbResult.rows.length > 0) {
        const userRole = dbResult.rows[0].role;
        if (userRole === 'admin') {
          return next();
        }
      }
    } catch (dbErr) {
      // Log but don't crash - proceed to fallback
      console.log('DB Admin Check skipped (user_roles):', (dbErr as any).message);
    }

    // 2. Fallback: Check Local JSON (Legacy/Backup)
    const users = getLocalUsers();

    // Check by ID first
    let localUser = users.find(u => u.id === req.user!.id);

    // If not found by ID, check by EMAIL (Crucial for migrated accounts)
    if (!localUser && req.user.email) {
      localUser = users.find(u => u.email.toLowerCase() === req.user!.email.toLowerCase());
    }

    if (localUser && localUser.role === 'admin') {
      return next();
    }

    // If neither DB nor Local confirms admin:
    return res.status(403).json({ error: 'Admin access required' });

  } catch (error) {
    console.error('isAdmin Middleware Error:', error);
    // Even in a catastrophic error, try to fail gracefully
    return res.status(500).json({ error: 'Server error checking admin status' });
  }
};

// ===========================================
// AUTH ROUTES
// ===========================================

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const users = getLocalUsers();

    // Check if user exists
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      email,
      password_hash: passwordHash,
      display_name: displayName || email.split('@')[0],
      role: 'user', // Default role
      created_at: new Date().toISOString(),
      is_suspended: false,
      avatar_url: null
    };

    users.push(newUser);
    saveLocalUsers(users);

    // Generate token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: { id: newUser.id, email: newUser.email }, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const users = getLocalUsers();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Ensure response is always JSON
    res.setHeader('Content-Type', 'application/json');
    res.json({ user: { id: user.id, email: user.email }, token });

    // Log successful login to database (Async side-effect)
    setImmediate(async () => {
      try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await pool.query(
          `INSERT INTO login_history (user_id, ip_address, user_agent, success, login_at)
           VALUES ($1, $2, $3, true, NOW())`,
          [user.id, ip, userAgent]
        );
      } catch (logErr) {
        console.error('Failed to log login history:', logErr);
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// ===========================================
// GOOGLE OAUTH ROUTES
// ===========================================

// Initiate Google OAuth login
app.get('/auth/google', async (req: Request, res: Response) => {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const redirectUrl = googleOAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent',
    });

    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate Google login' });
  }
});

// Google OAuth callback
app.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect(`${FRONTEND_URL}/auth?error=invalid_code`);
    }

    // Exchange code for tokens
    const { tokens } = await googleOAuthClient.getToken(code);
    googleOAuthClient.setCredentials(tokens);

    // Get user info from Google
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.redirect(`${FRONTEND_URL}/auth?error=invalid_token`);
    }

    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name || payload.given_name || email?.split('@')[0] || 'User';
    const avatarUrl = payload.picture || null;

    if (!email) {
      return res.redirect(`${FRONTEND_URL}/auth?error=no_email`);
    }

    // Check if user exists by google_id or email
    let userResult = await pool.query(
      'SELECT id, email, google_id, auth_provider FROM users WHERE google_id = $1 OR email = $2',
      [googleId, email]
    );

    let user;
    if (userResult.rows.length > 0) {
      // User exists - update if needed
      user = userResult.rows[0];

      // If user exists with email but no google_id, link the Google account
      if (!user.google_id && user.email === email) {
        await pool.query(
          'UPDATE users SET google_id = $1, auth_provider = $2 WHERE id = $3',
          [googleId, 'google', user.id]
        );
      }

      // Update profile with latest Google info
      await pool.query(
        'UPDATE profiles SET display_name = COALESCE($1, display_name), avatar_url = COALESCE($2, avatar_url) WHERE id = $3',
        [displayName, avatarUrl, user.id]
      );
    } else {
      // Create new user
      const newUserResult = await pool.query(
        'INSERT INTO users (email, google_id, auth_provider, password_hash) VALUES ($1, $2, $3, NULL) RETURNING id, email, created_at',
        [email, googleId, 'google']
      );
      user = newUserResult.rows[0];

      // Create profile
      await pool.query(
        'INSERT INTO profiles (id, display_name, avatar_url) VALUES ($1, $2, $3)',
        [user.id, displayName, avatarUrl]
      );

      // Create user stats
      await pool.query(
        'INSERT INTO user_stats (user_id) VALUES ($1)',
        [user.id]
      );

      // Assign default user role
      await pool.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
        [user.id, 'user']
      );
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie (for browser-based auth)
    const isProduction = FRONTEND_URL.startsWith('https://');
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Use HTTPS in production
      sameSite: isProduction ? 'lax' : 'lax', // 'lax' works for same-site, 'none' only needed for cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Log successful login
    try {
      await pool.query(
        'INSERT INTO login_history (user_id, ip_address, user_agent, success) VALUES ($1, $2, $3, $4)',
        [user.id, req.ip || 'unknown', req.headers['user-agent'] || 'unknown', true]
      );
    } catch (logError) {
      // Ignore login history errors
    }

    // Redirect to frontend with token in URL (for client-side storage)
    console.log('Google OAuth success:', { userId: user.id, email: user.email });
    res.redirect(`${FRONTEND_URL}/auth?token=${token}&provider=google`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.redirect(`${FRONTEND_URL}/auth?error=oauth_failed&details=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = getLocalUsers();
    const user = users.find(u => u.id === req.user!.id);

    if (!user) {
      console.error('GET /auth/me - User not found:', req.user!.id);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'User not found' });
    }

    // Convert flat user object to nested structure expected by frontend
    const userResponse = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_suspended: user.is_suspended,
      roles: [user.role || 'user'] // Support single role for now
    };

    console.log('GET /auth/me - Success:', { userId: user.id, email: user.email });
    res.setHeader('Content-Type', 'application/json');
    res.json({ user: userResponse });
  } catch (error: any) {
    console.error('Get user error:', error);
    console.error('Error details:', { message: error.message, stack: error.stack });
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// MOVIES ROUTES
// ===========================================

app.get('/api/movies', async (req: Request, res: Response) => {
  const { category, genre, featured, trending, latest, limit = 50, offset = 0 } = req.query;

  try {
    res.setHeader('Content-Type', 'application/json');

    // Read from local JSON
    let movies = getLocalMovies();

    // Read from Database and merge
    try {
      const dbResult = await pool.query('SELECT * FROM movies');
      const dbMovies = dbResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        year: row.year,
        category: row.category,
        poster_url: row.poster_url,
        trailer_url: row.trailer_url,
        is_featured: row.is_featured,
        is_trending: row.is_trending,
        is_latest: row.is_latest,
        created_at: row.created_at,
        genres: [] // DB schema doesn't have genres col yet
      }));

      // Merge (avoid duplicates by ID)
      const jsonIds = new Set(movies.map(m => m.id));
      const newDbMovies = dbMovies.filter(m => !jsonIds.has(m.id));
      movies = [...movies, ...newDbMovies];
    } catch (dbErr) {
      console.error('Failed to fetch movies from DB:', dbErr);
      // Continue with just JSON movies if DB fails
    }

    // Filter
    if (category) {
      movies = movies.filter(m => (m.category || '').toLowerCase() === (category as string).toLowerCase());
    }
    if (genre) {
      movies = movies.filter(m => m.genres && m.genres.some((g: string) => g.toLowerCase() === (genre as string).toLowerCase()));
    }
    if (featured === 'true') {
      movies = movies.filter(m => m.is_featured);
    }
    if (trending === 'true') {
      movies = movies.filter(m => m.is_trending);
    }
    if (latest === 'true') {
      movies = movies.filter(m => m.is_latest);
    }

    // Sort by Date (newest first)
    movies.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    // Pagination
    const limitNum = parseInt(limit as string) || 50;
    const offsetNum = parseInt(offset as string) || 0;
    const paginatedMovies = movies.slice(offsetNum, offsetNum + limitNum);

    res.json({ movies: paginatedMovies });
  } catch (error: any) {
    console.error('Get movies error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Helper for robust movie lookup
const findMovieIndex = (movies: any[], id: string) => {
  if (!id) return -1;
  const searchId = id.toString();
  const searchIdNoPrefix = searchId.replace('db-', '');

  return movies.findIndex(m => {
    if (!m.id) return false;
    const mid = m.id.toString();
    const midNoPrefix = mid.replace('db-', '');
    return mid === searchId ||
      midNoPrefix === searchIdNoPrefix ||
      mid === searchIdNoPrefix ||
      midNoPrefix === searchId;
  });
};

app.get('/api/movies/:id', async (req: Request, res: Response) => {
  try {
    const movies = getLocalMovies();
    const movieIndex = findMovieIndex(movies, req.params.id);

    let movie;
    if (movieIndex !== -1) {
      movie = movies[movieIndex];
    } else {
      // Not in JSON, check DB
      try {
        const dbResult = await pool.query('SELECT * FROM movies WHERE id = $1', [req.params.id]);
        if (dbResult.rows.length > 0) {
          const row = dbResult.rows[0];
          movie = {
            id: row.id,
            title: row.title,
            year: row.year,
            category: row.category,
            poster_url: row.poster_url,
            trailer_url: row.trailer_url,
            is_featured: row.is_featured,
            is_trending: row.is_trending,
            is_latest: row.is_latest,
            created_at: row.created_at,
            genres: []
          };
        }
      } catch (dbErr) {
        console.error('DB fetch error for movie:', dbErr);
      }
    }

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Mock rating stats
    movie.rating_stats = {
      average_rating: 4.5,
      total_votes: 120,
      distribution: { 5: 80, 4: 30, 3: 5, 2: 2, 1: 3 }
    };

    res.json({ movie });
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin movie routes
// Admin movie routes
// Admin movie routes
app.post('/api/movies', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  const { title, year, category, trailer_url, poster_url, is_featured, is_trending, is_latest, genres } = req.body;

  try {
    // Write to Database (Persistent)
    const result = await pool.query(
      `INSERT INTO movies 
       (title, year, category, poster_url, trailer_url, is_featured, is_trending, is_latest, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
       RETURNING *`,
      [title, year, category, poster_url, trailer_url, is_featured || false, is_trending || false, is_latest || false]
    );

    const newMovie = result.rows[0];
    newMovie.genres = genres || []; // Pass through genres for frontend consistency (though not saved)

    res.status(201).json({ movie: newMovie });
  } catch (error: any) {
    console.error('Create movie error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.put('/api/movies/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  const { title, year, category, trailer_url, poster_url, is_featured, is_trending, is_latest, genres } = req.body;
  const { id } = req.params;

  try {
    // 1. Try Update Database
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let updatedMovie = null;

    if (isUuid) {
      const result = await pool.query(
        `UPDATE movies 
         SET title=$1, year=$2, category=$3, poster_url=$4, trailer_url=$5, 
             is_featured=$6, is_trending=$7, is_latest=$8, updated_at=NOW()
         WHERE id = $9
         RETURNING *`,
        [title, year, category, poster_url, trailer_url, is_featured, is_trending, is_latest, id]
      );
      if (result.rows.length > 0) {
        updatedMovie = result.rows[0];
        updatedMovie.genres = genres || [];
      }
    }

    // 2. If not in DB (or not UUID), Try Update JSON
    if (!updatedMovie) {
      const movies = getLocalMovies();
      const movieIndex = findMovieIndex(movies, id);

      if (movieIndex !== -1) {
        updatedMovie = {
          ...movies[movieIndex],
          title,
          year,
          category,
          trailer_url,
          poster_url,
          is_featured,
          is_trending,
          is_latest,
          genres: genres || movies[movieIndex].genres || [],
          updated_at: new Date().toISOString()
        };
        movies[movieIndex] = updatedMovie;
        saveLocalMovies(movies);
      }
    }

    if (!updatedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({ movie: updatedMovie });
  } catch (error: any) {
    console.error('Update movie error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/movies/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    let deleted = false;

    // 1. Try Delete DB
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      const result = await pool.query('DELETE FROM movies WHERE id = $1', [id]);
      if (result.rowCount && result.rowCount > 0) deleted = true;
    }

    // 2. Also Try Delete JSON (Cleanup)
    const movies = getLocalMovies();
    const movieIndex = findMovieIndex(movies, id);
    if (movieIndex !== -1) {
      movies.splice(movieIndex, 1);
      saveLocalMovies(movies);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({ message: 'Movie deleted' });
  } catch (error: any) {
    console.error('Delete movie error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// WATCHLIST ROUTES
// ===========================================

app.get('/api/watchlist', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = req.user?.id;
    const guestId = userId ? null : getGuestIdentifier(req);
    const finalUserId = userId || (guestId ? `00000000-0000-0000-0000-${guestId.substring(0, 12).padEnd(12, '0')}` : null);

    if (!finalUserId) {
      return res.json({ watchlist: [] });
    }

    // Get from JSON instead of pool
    const watchlist = getLocalWatchlist();
    const userWatchlist = watchlist.filter(item => item.user_id === finalUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ watchlist: userWatchlist });
  } catch (error: any) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/watchlist', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { movie_id, is_favorite, guest_identifier } = req.body;

  if (!movie_id) {
    return res.status(400).json({ error: 'movie_id is required' });
  }

  try {
    const userId = req.user?.id || null;
    const guestId = userId ? null : (guest_identifier || getGuestIdentifier(req));

    // Set guest_id cookie if guest
    if (!userId && guestId) {
      res.cookie('guest_id', guestId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Use guest user ID pattern for guests
    const finalUserId = userId || `00000000-0000-0000-0000-${guestId?.substring(0, 12).padEnd(12, '0') || '000000000000'}`;

    // Get from JSON instead of pool
    const watchlist = getLocalWatchlist();
    const existingIndex = watchlist.findIndex(item => item.user_id === finalUserId && item.movie_id === movie_id);

    let updatedItem;
    if (existingIndex > -1) {
      watchlist[existingIndex].is_favorite = is_favorite || false;
      watchlist[existingIndex].updated_at = new Date().toISOString();
      updatedItem = watchlist[existingIndex];
    } else {
      updatedItem = {
        id: Date.now().toString(),
        user_id: finalUserId,
        movie_id,
        is_favorite: is_favorite || false,
        created_at: new Date().toISOString()
      };
      watchlist.push(updatedItem);
    }

    saveLocalWatchlist(watchlist);
    res.status(201).json({ item: updatedItem });
  } catch (error: any) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/watchlist/:movie_id', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = req.user?.id;
    const guestId = userId ? null : getGuestIdentifier(req);
    const finalUserId = userId || (guestId ? `00000000-0000-0000-0000-${guestId.substring(0, 12).padEnd(12, '0')}` : null);

    if (!finalUserId) {
      return res.status(400).json({ error: 'User or guest identifier required' });
    }

    // Delete from JSON instead of pool
    const watchlist = getLocalWatchlist();
    const updatedWatchlist = watchlist.filter(item => !(item.user_id === finalUserId && item.movie_id === req.params.movie_id));

    saveLocalWatchlist(updatedWatchlist);
    res.json({ message: 'Removed from watchlist' });
  } catch (error: any) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// RATINGS ROUTES
// ===========================================

// Get user's own reviews (authenticated)
app.get('/api/ratings', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.json({ ratings: [] });
    }

    const result = await pool.query(
      `SELECT r.*
       FROM ratings r
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json({ ratings: result.rows });
  } catch (error: any) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/ratings/:movie_id', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const result = await pool.query(
      `SELECT r.*, p.display_name, p.avatar_url
       FROM ratings r
       LEFT JOIN profiles p ON r.user_id = p.id
       WHERE r.movie_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.movie_id]
    );
    res.json({ ratings: result.rows });
  } catch (error: any) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/ratings', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { movie_id, rating, review, guest_identifier } = req.body;

  if (!movie_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid movie_id and rating (1-5) required' });
  }

  try {
    const rawUserId = req.user?.id || null;
    let finalUserId = rawUserId;

    // UUID Normalization: Prevent "invalid input syntax" crash
    // If ID is simple (e.g. "1"), hash it to a valid UUID for the database
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId || '');

    if (rawUserId && !isUuid) {
      // Deterministic UUID from legacy ID
      const hash = createHash('md5').update(rawUserId).digest('hex');
      finalUserId = `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
      console.log(`Normalized Legacy ID "${rawUserId}" to UUID "${finalUserId}"`);
    }

    // Check if user exists in DB to prevent Foreign Key Violation
    // We check using the Normalized UUID
    if (finalUserId) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [finalUserId]);

      if (userCheck.rows.length === 0) {
        console.log(`User ${finalUserId} (Raw: ${rawUserId}) not found in DB. Attempting migration...`);

        // User likely from legacy JSON. Find and migrate.
        const localUsers = getLocalUsers();
        const legacyUser = localUsers.find(u => u.id === rawUserId); // Lookup by Original ID (e.g. "1")

        if (legacyUser) {
          // Migrate to DB using the Normalized UUID
          await pool.query(
            `INSERT INTO users (id, email, password_hash, created_at, auth_provider)
               VALUES ($1, $2, $3, $4, 'local')
               ON CONFLICT (id) DO NOTHING`,
            [finalUserId, legacyUser.email, legacyUser.password_hash, legacyUser.created_at || new Date().toISOString()]
          );

          // Migrate Profile 
          await pool.query(
            `INSERT INTO profiles (id, display_name, avatar_url, is_suspended)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO NOTHING`,
            [finalUserId, legacyUser.display_name, legacyUser.avatar_url, legacyUser.is_suspended || false]
          );

          // Migrate Role
          if (legacyUser.role) {
            await pool.query(
              `INSERT INTO user_roles (user_id, role)
                   VALUES ($1, $2)
                   ON CONFLICT (user_id, role) DO NOTHING`,
              [finalUserId, legacyUser.role]
            );
          }

          console.log(`User ${finalUserId} migrated successfully.`);
        } else {
          // Ghost User Case (Token exists, JSON does not)
          console.warn(`User ${finalUserId} is a Ghost. Creating recovery record.`);
          await pool.query(
            `INSERT INTO users (id, email, password_hash, created_at)
               VALUES ($1, $2, $3, NOW())
               ON CONFLICT (id) DO NOTHING`,
            [finalUserId, req.user?.email || `ghost_${finalUserId.substring(0, 8)}@restored.com`, 'placeholder_hash']
          );
        }
      }
    }

    // Check availability (Use finalUserId)
    let result = await pool.query(
      'SELECT id, rating, review FROM ratings WHERE user_id = $1 AND movie_id = $2',
      [finalUserId, movie_id]
    );

    if (result.rows.length > 0) {
      // Update existing
      result = await pool.query(
        `UPDATE ratings 
         SET rating = $1, review = $2, updated_at = NOW() 
         WHERE user_id = $3 AND movie_id = $4 
         RETURNING *`,
        [rating, review || null, finalUserId, movie_id]
      );
    } else {
      // Insert new
      result = await pool.query(
        `INSERT INTO ratings (user_id, movie_id, rating, review)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [finalUserId, movie_id, rating, review || null]
      );
    }

    res.status(201).json({ rating: result.rows[0] });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// COMMENTS ROUTES
// ===========================================

// Get comments for a movie (with replies and likes)
app.get('/api/comments/:movie_id', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { movie_id } = req.params;

    // Get from JSON instead of pool
    const comments = getLocalComments();
    const movieComments = comments.filter(c => c.movie_id === movie_id && c.status === 'approved')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Map to frontend format
    const formattedComments = movieComments.map(c => ({
      ...c,
      like_count: c.likes ? c.likes.length : 0,
      replies: comments.filter(r => r.parent_comment_id === c.id && r.status === 'approved')
    }));

    res.json({ comments: formattedComments });
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Create a comment
app.post('/api/comments', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { movie_id, content, parent_comment_id, author_name, guest_identifier } = req.body;

    if (!movie_id || !content || !content.trim()) {
      return res.status(400).json({ error: 'Movie ID and content are required' });
    }

    const userId = req.user?.id || null;
    const authorName = author_name || (userId ? 'User' : 'Guest');

    // Save to JSON instead of pool
    const comments = getLocalComments();
    const newComment: LocalComment = {
      id: Date.now().toString(),
      user_id: userId,
      movie_id,
      author_name: authorName,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
      status: 'approved',
      created_at: new Date().toISOString(),
      display_name: authorName,
      avatar_url: null,
      guest_identifier: guest_identifier || null,
      likes: []
    };

    comments.push(newComment);
    saveLocalComments(comments);

    res.status(201).json({ comment: newComment });
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Like/Unlike a comment
app.post('/api/comments/:id/like', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const guestId = userId ? null : (req.body.guest_identifier || getGuestIdentifier(req));
    const likerId = userId || guestId || 'anonymous';

    const comments = getLocalComments();
    const commentIndex = comments.findIndex(c => c.id === id);

    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = comments[commentIndex];
    if (!comment.likes) comment.likes = [];

    const existingLikeIndex = comment.likes.indexOf(likerId);
    let liked = false;

    if (existingLikeIndex > -1) {
      // Unlike
      comment.likes.splice(existingLikeIndex, 1);
      liked = false;
    } else {
      // Like
      comment.likes.push(likerId);
      liked = true;
    }

    saveLocalComments(comments);

    res.json({ liked, like_count: comment.likes.length });
  } catch (error: any) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin: Get all comments
app.get('/api/admin/comments', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const comments = getLocalComments();

    // Sort by newest first
    comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Map to frontend format
    const formattedComments = comments.map(c => ({
      ...c,
      like_count: c.likes ? c.likes.length : 0,
      reply_count: comments.filter(r => r.parent_comment_id === c.id).length
    }));

    res.json({ comments: formattedComments });
  } catch (error: any) {
    console.error('Get admin comments error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin: Delete comment
app.delete('/api/admin/comments/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { id } = req.params;
    const comments = getLocalComments();

    // Filter out the comment AND its replies
    const newComments = comments.filter(c => c.id !== id && c.parent_comment_id !== id);

    if (comments.length === newComments.length) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    saveLocalComments(newComments);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Delete admin comment error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// CATEGORIES ROUTES
// ===========================================

// ===========================================
// CATEGORIES ROUTES
// ===========================================

app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const categories = getLocalCategories();

    // Sort appropriately
    categories.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin category routes
app.post('/api/categories', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    const { name, slug, description } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Auto-generate slug if not provided
    const categorySlug = slug && slug.trim().length > 0
      ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const categories = getLocalCategories();

    // Check if slug already exists
    if (categories.some(c => c.slug === categorySlug)) {
      return res.status(400).json({ error: 'A category with this slug already exists' });
    }

    const newCategory: LocalCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      slug: categorySlug,
      description: description?.trim() || null,
      created_at: new Date().toISOString()
    };

    categories.push(newCategory);
    saveLocalCategories(categories);

    res.status(201).json({ category: newCategory });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.put('/api/categories/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    const { id } = req.params;
    const { name, slug, description } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const categories = getLocalCategories();
    const categoryIndex = categories.findIndex(c => c.id === id);

    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Auto-generate slug if not provided
    const categorySlug = slug && slug.trim().length > 0
      ? slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists for a different category
    const slugCheck = categories.find(c => c.slug === categorySlug && c.id !== id);
    if (slugCheck) {
      return res.status(400).json({ error: 'A category with this slug already exists' });
    }

    // Update category
    const updatedCategory = {
      ...categories[categoryIndex],
      name: name.trim(),
      slug: categorySlug,
      description: description?.trim() || null,
      updated_at: new Date().toISOString()
    };

    categories[categoryIndex] = updatedCategory;
    saveLocalCategories(categories);

    res.json({ category: updatedCategory });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { id } = req.params;

    const categories = getLocalCategories();
    const newCategories = categories.filter(c => c.id !== id);

    if (categories.length === newCategories.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    saveLocalCategories(newCategories);
    res.json({ message: 'Category deleted' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// TMDB ROUTES
// ===========================================

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// TMDB search
app.post('/api/tmdb/search', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { query } = req.body;

    if (!TMDB_API_KEY) {
      return res.status(500).json({ error: 'TMDB API key not configured' });
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use /search/multi to get both movies and TV series
    const searchUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
    const response = await fetch(searchUrl);
    const data: any = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'TMDB search failed');
    }

    // Filter and map results (movies and TV series)
    const results = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv') // Only movies and TV
      .slice(0, 10)
      .map((item: any) => ({
        id: item.id,
        title: item.title || item.name, // TV shows use 'name' instead of 'title'
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : (item.first_air_date ? new Date(item.first_air_date).getFullYear() : null),
        poster_url: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
        overview: item.overview,
        rating: item.vote_average,
        media_type: item.media_type, // 'movie' or 'tv'
      }));

    res.json({ movies: results });
  } catch (error: any) {
    console.error('TMDB search error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'TMDB search failed' });
  }
});

// TMDB movie/TV details
app.post('/api/tmdb/details', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  const { movieId, mediaType } = req.body;

  if (!TMDB_API_KEY) {
    return res.status(500).json({ error: 'TMDB API key not configured' });
  }

  if (!movieId || typeof movieId !== 'number') {
    return res.status(400).json({ error: 'Valid movieId is required' });
  }

  try {
    // Determine if it's a movie or TV show
    const isTV = mediaType === 'tv';
    const endpoint = isTV ? 'tv' : 'movie';

    // Get details (movie or TV)
    const detailsUrl = `${TMDB_BASE_URL}/${endpoint}/${movieId}?api_key=${TMDB_API_KEY}`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData: any = await detailsResponse.json();

    if (!detailsResponse.ok) {
      throw new Error(detailsData.status_message || 'TMDB details failed');
    }

    // Get videos (trailers)
    const videosUrl = `${TMDB_BASE_URL}/${endpoint}/${movieId}/videos?api_key=${TMDB_API_KEY}`;
    const videosResponse = await fetch(videosUrl);
    const videosData: any = await videosResponse.json();

    let trailerUrl = null;
    if (videosData.results && videosData.results.length > 0) {
      const trailer = videosData.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      }
    }

    // Determine category using TMDB data fields
    const genres: any[] = detailsData.genres || [];
    const genreIds = genres.map((g: any) => g.id);
    const originalLanguage = (detailsData.original_language || '').toLowerCase();

    // For TV shows, use origin_country; for movies, use production_countries
    const productionCountries = isTV
      ? (detailsData.origin_country || []).map((c: string) => c.toUpperCase())
      : (detailsData.production_countries || []).map((c: any) => c.iso_3166_1.toUpperCase());
    const countryCodes = Array.isArray(productionCountries) ? productionCountries : [];

    let category = 'hollywood'; // Default

    // Priority-based categorization (first match wins)
    // 0. TV Series (highest priority - if it's a TV show)
    if (isTV) {
      category = 'tv-series';
    }
    // 1. Animation (genre ID 16)
    else if (genreIds.includes(16)) {
      category = 'animation';
    }
    // 2. Bollywood (Hindi language OR India)
    else if (originalLanguage === 'hi' || countryCodes.includes('IN')) {
      category = 'bollywood';
    }
    // 3. Nollywood (Nigeria)
    else if (countryCodes.includes('NG')) {
      category = 'nollywood';
    }
    // 4. Korean Cinema (Korean language OR South Korea)
    else if (originalLanguage === 'ko' || countryCodes.includes('KR')) {
      category = 'korean';
    }
    // 5. Chinese Cinema (Chinese language OR China/Hong Kong/Taiwan)
    else if (originalLanguage === 'zh' || countryCodes.some((c: string) => ['CN', 'HK', 'TW'].includes(c))) {
      category = 'chinese';
    }
    // 6. European Cinema (European countries non-US OR European languages)
    else if (
      (countryCodes.some((c: string) => ['FR', 'IT', 'DE', 'ES', 'GB'].includes(c)) && !countryCodes.includes('US')) ||
      ['fr', 'it', 'de', 'es'].includes(originalLanguage)
    ) {
      category = 'european';
    }
    // 7. Hollywood (English language AND US production)
    else if (originalLanguage === 'en' && countryCodes.includes('US')) {
      category = 'hollywood';
    }
    // Default remains 'hollywood'

    // Debug logging
    const title = detailsData.title || detailsData.name;
    const media_type = isTV ? 'tv' : 'movie';
    console.log(`Imported ${title} - Type: ${media_type} → Category: ${category} (lang: ${originalLanguage}, countries: ${countryCodes.join(',')})`);

    const movie = {
      id: detailsData.id,
      title: title,
      year: detailsData.release_date
        ? new Date(detailsData.release_date).getFullYear()
        : (detailsData.first_air_date ? new Date(detailsData.first_air_date).getFullYear() : null),
      poster_url: detailsData.poster_path ? `${TMDB_IMAGE_BASE}${detailsData.poster_path}` : null,
      overview: detailsData.overview,
      rating: detailsData.vote_average,
      trailer_url: trailerUrl,
      category,
      genres: genres.map((g: any) => g.name),
      media_type: media_type,
    };

    res.json({ movie });
  } catch (error: any) {
    console.error('TMDB details error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'TMDB details failed' });
  }
});

// ===========================================
// ADMIN ROUTES
// ===========================================

// Admin stats
// Admin stats (Restored for Dashboard compatibility)
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Get real counts from database
    const movieCountResult = await pool.query('SELECT COUNT(*) FROM movies');
    const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const subscriberCountResult = await pool.query('SELECT COUNT(*) FROM newsletter_signups');

    // Get count from local JSON (TMDB imports)
    const localMovies = getLocalMovies();
    const totalMovies = parseInt(movieCountResult.rows[0].count) + localMovies.length;

    // Get comments count
    const comments = getLocalComments();

    res.json({
      movies: totalMovies,
      comments: comments.length,
      subscribers: parseInt(subscriberCountResult.rows[0].count),
      users: parseInt(userCountResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/analytics', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Get real counts from database
    const movieCountResult = await pool.query('SELECT COUNT(*) FROM movies');
    const reviewCountResult = await pool.query('SELECT COUNT(*) FROM ratings');
    const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const subscriberCountResult = await pool.query('SELECT COUNT(*) FROM newsletter_signups');

    res.json({
      movies: parseInt(movieCountResult.rows[0].count),
      reviews: parseInt(reviewCountResult.rows[0].count),
      subscribers: parseInt(subscriberCountResult.rows[0].count),
      users: parseInt(userCountResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Admin ratings - get all
// Admin ratings - get all (REAL DB)
app.get('/api/admin/ratings', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    const result = await pool.query(
      `SELECT r.*, p.display_name, p.avatar_url
       FROM ratings r
       LEFT JOIN profiles p ON r.user_id = p.id
       ORDER BY r.created_at DESC`
    );

    const formattedRatings = result.rows.map(r => ({
      ...r,
      display_name: r.display_name || 'Anonymous',
      profiles: { display_name: r.display_name || 'Anonymous' }
    }));

    res.json({ ratings: formattedRatings });
  } catch (error: any) {
    console.error('Get all ratings error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin ratings delete
// Delete user's own rating (authenticated user can delete their own)
// User delete rating
app.delete('/api/ratings/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ratings = getLocalRatings();
    const ratingIndex = ratings.findIndex(r => r.id === id);

    if (ratingIndex === -1) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    const rating = ratings[ratingIndex];

    // Check if user is admin
    const users = getLocalUsers();
    const userRole = users.find(u => u.id === userId)?.role;
    const isAdmin = userRole === 'admin';

    // Allow deletion if user owns the rating OR user is admin
    if (!isAdmin && rating.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own ratings' });
    }

    ratings.splice(ratingIndex, 1);
    saveLocalRatings(ratings);

    res.json({ message: 'Rating deleted' });
  } catch (error: any) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin delete rating (kept for backward compatibility)
// Admin delete rating (kept for backward compatibility)
app.delete('/api/admin/ratings/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { id } = req.params;
    const ratings = getLocalRatings();

    const newRatings = ratings.filter(r => r.id !== id);

    if (ratings.length === newRatings.length) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    saveLocalRatings(newRatings);
    res.json({ message: 'Rating deleted' });
  } catch (error: any) {
    console.error('Delete rating error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin users
app.get('/api/admin/users', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const users = getLocalUsers();

    // Transform local users to match the expected format
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      is_suspended: u.is_suspended,
      is_admin: u.role === 'admin'
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ users: formattedUsers });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin newsletter
// Newsletter subscribe endpoint (public, no auth required)
app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  try {
    // Use Database for Newsletter
    await pool.query(
      `INSERT INTO newsletter_signups (email, is_active, subscribed_at)
       VALUES ($1, true, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [email.trim().toLowerCase()]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscriber: { email: email.trim().toLowerCase(), is_active: true }
    });
  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/admin/newsletter', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const result = await pool.query('SELECT * FROM newsletter_signups ORDER BY subscribed_at DESC');
    res.json({ subscribers: result.rows });
  } catch (error: any) {
    console.error('Get newsletter error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/admin/newsletter/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    await pool.query('DELETE FROM newsletter_signups WHERE id = $1', [req.params.id]);
    res.json({ message: 'Subscriber deleted' });
  } catch (error: any) {
    console.error('Delete subscriber error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin analytics (stub - returns empty data for now)
app.get('/api/admin/analytics', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    // TODO: Implement full analytics endpoint
    res.json({
      popularMovies: [],
      alerts: []
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin visitors - real implementation
// Admin visitors - real implementation (Page Views Aggregation)
app.get('/api/admin/visitors', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Aggregate unique visitors by period
    const statsQuery = `
      SELECT
        COUNT(DISTINCT visitor_id) FILTER (WHERE viewed_at >= NOW() - INTERVAL '24 hours') as "todayVisitors",
        COUNT(DISTINCT visitor_id) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') as "weekVisitors",
        COUNT(DISTINCT visitor_id) FILTER (WHERE viewed_at >= NOW() - INTERVAL '30 days') as "monthVisitors",
        COUNT(DISTINCT visitor_id) FILTER (WHERE viewed_at >= NOW() - INTERVAL '1 year') as "yearVisitors"
      FROM page_views
    `;

    // Daily graph data (last 30 days)
    const graphQuery = `
      SELECT
        to_char(viewed_at, 'YYYY-MM-DD') as date,
        COUNT(DISTINCT visitor_id) as count
      FROM page_views
      WHERE viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const statsResult = await pool.query(statsQuery);
    const graphResult = await pool.query(graphQuery);

    const stats = {
      todayVisitors: parseInt(statsResult.rows[0].todayVisitors || '0'),
      weekVisitors: parseInt(statsResult.rows[0].weekVisitors || '0'),
      monthVisitors: parseInt(statsResult.rows[0].monthVisitors || '0'),
      yearVisitors: parseInt(statsResult.rows[0].yearVisitors || '0')
    };

    res.json({
      stats,
      dailyData: graphResult.rows.map(r => ({ date: r.date, count: parseInt(r.count) })),
      weeklyData: [], // Placeholder to match strict interface
      monthlyData: [],
      yearlyData: []
    });
  } catch (error: any) {
    console.error('Get visitors error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});


// Public upcoming trailers endpoint (for homepage)
app.get('/api/upcoming', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const trailers = getLocalUpcoming();
    // Get only unreleased trailers, ordered by release date ascending, limit 6
    const sortedTrailers = trailers
      .filter(t => !t.is_released)
      .sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
      .slice(0, 6);

    res.json({ trailers: sortedTrailers });
  } catch (error: any) {
    console.error('Get upcoming trailers error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin upcoming trailers
app.get('/api/admin/upcoming', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const trailers = getLocalUpcoming();
    res.json({ trailers });
  } catch (error: any) {
    console.error('Get upcoming trailers error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/admin/upcoming', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { title, release_date, trailer_url, poster_url, description, category, is_released } = req.body;

    const trailers = getLocalUpcoming();
    const newTrailer = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      release_date,
      trailer_url,
      poster_url,
      description,
      category: category || 'Hollywood',
      is_released: is_released || false,
      created_at: new Date().toISOString()
    };

    trailers.push(newTrailer);
    saveLocalUpcoming(trailers);

    res.json({ trailer: newTrailer });
  } catch (error: any) {
    console.error('Create upcoming trailer error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.put('/api/admin/upcoming/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { title, release_date, trailer_url, poster_url, description, category, is_released } = req.body;
    const { id } = req.params;

    const trailers = getLocalUpcoming();
    const index = trailers.findIndex(t => t.id.toString() === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Upcoming trailer not found' });
    }

    const updatedTrailer = {
      ...trailers[index],
      title,
      release_date,
      trailer_url,
      poster_url,
      description,
      category,
      is_released,
      updated_at: new Date().toISOString()
    };

    trailers[index] = updatedTrailer;
    saveLocalUpcoming(trailers);

    res.json({ trailer: updatedTrailer });
  } catch (error: any) {
    console.error('Update upcoming trailer error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.delete('/api/admin/upcoming/:id', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const trailers = getLocalUpcoming();
    const newTrailers = trailers.filter(t => t.id.toString() !== req.params.id);
    saveLocalUpcoming(newTrailers);

    res.json({ message: 'Upcoming trailer deleted' });
  } catch (error: any) {
    console.error('Delete upcoming trailer error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin login history
// Admin login history (REAL DB)
app.get('/api/admin/login-history', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    const result = await pool.query(
      `SELECT lh.*, u.email, p.display_name, p.avatar_url
       FROM login_history lh
       LEFT JOIN users u ON lh.user_id = u.id
       LEFT JOIN profiles p ON lh.user_id = p.id
       ORDER BY lh.login_at DESC
       LIMIT 100`
    );

    res.json({ history: result.rows });
  } catch (error: any) {
    console.error('Get login history error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin security - get users
app.get('/api/admin/security/users', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const users = getLocalUsers();

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      is_suspended: !!u.is_suspended,
      two_factor_enabled: !!u.two_factor_enabled
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({ users: formattedUsers });
  } catch (error: any) {
    console.error('Get security users error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin security - suspend user
app.post('/api/admin/security/users/:id/suspend', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { id } = req.params;
    const { reason } = req.body;

    const users = getLocalUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].is_suspended = true;
    users[userIndex].suspended_at = new Date().toISOString();
    users[userIndex].suspension_reason = reason || 'No reason provided';

    saveLocalUsers(users);

    res.json({ message: 'User suspended' });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin security - unsuspend user
app.post('/api/admin/security/users/:id/unsuspend', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { id } = req.params;

    const users = getLocalUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].is_suspended = false;
    users[userIndex].suspended_at = null;
    users[userIndex].suspension_reason = null;

    saveLocalUsers(users);

    res.json({ message: 'User unsuspended' });
  } catch (error: any) {
    console.error('Unsuspend user error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Public favicon settings endpoint (no auth required)
app.get('/api/settings/favicon', async (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    // Use unified helper for consistent results
    const settings = await getMergedSettings();
    res.json({ favicon_urls: settings.favicon_urls || null });
  } catch (error: any) {
    console.error('Get favicon settings error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Admin settings
app.get('/api/admin/settings', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const settings = await getMergedSettings();
    res.json({ settings });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/admin/settings', authenticateToken, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'site_settings'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return res.status(501).json({ error: 'Site settings table not implemented yet' });
    }

    const updates = req.body;

    // CRITICAL: Fetch LATEST merged settings (DB + File) before merging updates
    // This prevents overwriting DB values with nulls from stale settings.json
    const currentSettings = await getMergedSettings();

    // Merge updates
    const newSettings = {
      ...currentSettings,
      ...updates,
      // Protect favicon_urls explicitly if not provided in update
      favicon_urls: (updates.favicon_urls === undefined || updates.favicon_urls === null)
        ? currentSettings.favicon_urls
        : updates.favicon_urls
    };

    // Save to local file (backup/cache)
    saveLocalSettings(newSettings);

    // Save ALL settings to database for persistence
    for (const [key, value] of Object.entries(newSettings)) {
      try {
        const saveValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
        await pool.query(
          'INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES ($1, $2, $3) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2',
          [key, saveValue, typeof value === 'object' && value !== null ? 'json' : 'text']
        );
      } catch (dbErr) {
        console.error(`Error saving ${key} to database:`, dbErr);
      }
    }

    res.json({ message: 'Settings updated successfully', settings: newSettings });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// ===========================================
// FILE UPLOAD ROUTES
// ===========================================

app.post('/api/upload', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');

  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('Upload middleware error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  });
});

// Favicon upload endpoint - generates all sizes
app.post('/api/upload/favicon', authenticateToken, isAdmin, (req: AuthRequest, res: Response, next: NextFunction) => {
  res.setHeader('Content-Type', 'application/json');

  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      console.error('Favicon upload middleware error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(500).json({ error: err.message || 'Upload failed' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // Get existing favicon URLs from database to delete old files (Optional)
      let oldFaviconUrls: Record<string, string> = {};
      try {
        const existingSettings = await pool.query(
          `SELECT setting_value FROM site_settings WHERE setting_key = 'favicon_urls'`
        );
        if (existingSettings.rows.length > 0 && existingSettings.rows[0].setting_value) {
          oldFaviconUrls = JSON.parse(existingSettings.rows[0].setting_value);
        }
      } catch (e: any) {
        console.warn('Could not fetch old favicons from DB, skipping deletion:', e.message);
      }

      // 1. Delete old favicon files FIRST to clear space for new ones
      console.log('Cleaning up old favicon files...');
      for (const [size, url] of Object.entries(oldFaviconUrls)) {
        if (url && url.startsWith('/uploads/')) {
          const oldFilePath = path.join(uploadDir, path.basename(url));
          try {
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
              console.log(`Deleted old favicon: ${oldFilePath}`);
            }
          } catch (deleteError) {
            console.error(`Error deleting old favicon ${oldFilePath}:`, deleteError);
          }
        }
      }

      const sizes = [16, 32, 48, 64, 128, 256];
      const faviconUrls: Record<string, string> = {};

      // 2. Generate new sizes with FIXED filenames
      console.log(`Starting favicon generation for file: ${req.file.path}`);
      for (const size of sizes) {
        const outputFilename = `favicon-${size}x${size}.png`;
        const outputPath = path.join(uploadDir, outputFilename);

        await sharp(req.file.path)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(outputPath);

        console.log(`Generated favicon: ${outputPath}`);
        faviconUrls[`${size}x${size}`] = `/uploads/${outputFilename}`;
      }

      // Clean up original file
      fs.unlinkSync(req.file.path);

      // Update Local settings.json as a primary storage/backup
      const currentSettings = await getMergedSettings();
      const updatedSettings = { ...currentSettings, favicon_urls: faviconUrls };
      saveLocalSettings(updatedSettings);

      // Auto-save to database (if available)
      try {
        await pool.query(
          'INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES ($1, $2, $3, $4) ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2',
          ['favicon_urls', JSON.stringify(faviconUrls), 'json', 'Favicon URLs for all sizes']
        );
      } catch (dbError) {
        console.warn('Database save for favicon failed, but settings.json was updated:', dbError);
      }

      res.json({
        favicons: faviconUrls,
        message: 'Favicon generated and saved successfully'
      });
    } catch (error: any) {
      console.error('Favicon generation error:', error);
      // Clean up original file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message || 'Failed to generate favicon' });
    }
  });
});

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Explicitly serve favicon.ico by looking up the custom upload path (DATABASE FIRST)
// Explicitly serve favicon.ico by looking up the custom upload path (DATABASE FIRST)
app.get('/favicon.ico', async (req: Request, res: Response) => {
  try {
    console.log('Request for /favicon.ico received');
    let faviconUrls = null;

    // Try Database first
    try {
      const dbResult = await pool.query(
        "SELECT setting_value FROM site_settings WHERE setting_key = 'favicon_urls'"
      );
      if (dbResult.rows.length > 0 && dbResult.rows[0].setting_value) {
        faviconUrls = typeof dbResult.rows[0].setting_value === 'string'
          ? JSON.parse(dbResult.rows[0].setting_value)
          : dbResult.rows[0].setting_value;
      }
    } catch (e: any) {
      console.error('DB fetch error for favicon.ico:', e.message);
    }

    // Fallback to local settings if DB fails
    if (!faviconUrls) {
      faviconUrls = getLocalSettings().favicon_urls;
    }

    if (faviconUrls && typeof faviconUrls === 'object') {
      console.log('Available favicon sizes:', Object.keys(faviconUrls));
      // Try sizes in order of preference for a standard favicon
      const preferredSizes = ['32x32', '16x16', '48x48', '64x64', '128x128', '256x256'];
      const availableUrls = Object.entries(faviconUrls);

      // Try preferred sizes first
      for (const size of preferredSizes) {
        const iconPath = faviconUrls[size];
        if (iconPath) {
          const faviconFile = path.join(uploadDir, path.basename(iconPath));
          if (fs.existsSync(faviconFile)) {
            console.log(`Serving matched favicon (${size}): ${faviconFile}`);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.sendFile(faviconFile);
          }
        }
      }

      // Final fallback: any available icon
      for (const [size, iconPath] of availableUrls) {
        if (iconPath) {
          const faviconFile = path.join(uploadDir, path.basename(iconPath as string));
          if (fs.existsSync(faviconFile)) {
            console.log(`Serving fallback favicon (${size}): ${faviconFile}`);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.sendFile(faviconFile);
          }
        }
      }
      console.log('No favicon files actually found on disk for URLs:', faviconUrls);
    } else {
      console.log('No favicon settings found in database or local file');
    }
  } catch (err: any) {
    console.error('Error serving dynamic /favicon.ico:', err.message);
  }
  res.status(404).end();
});

// ===========================================
// START SERVER
// ===========================================

// Explicitly serve index.html for admin routes to support SPA matching
app.get(['/admin', '/admin/*'], (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '../../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found. Ensure build was successful.');
  }
});

// Serve static files from the 'dist' directory (Frontend)
app.use(express.static(path.join(__dirname, '../../dist')));

// Serve uploaded user content
app.use('/uploads', express.static(uploadDir));

// Handle SPA routing: return index.html for any unknown GET route
app.get('*', (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '../../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If frontend backend build doesn't have dist yet (dev mode)
    res.status(404).send('Frontend not found. Ensure build was successful.');
  }
});

// Final catch-all for any other routes (including POST/PUT/DELETE)
app.use((req: Request, res: Response) => {
  console.log(`[404] Unmatched ${req.method} request to ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `The requested ${req.method} route was not found on this server.`,
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🎬 Movie Trailers API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Serving frontend from: ${path.join(__dirname, '../../dist')}`);
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    path: req.path
  });
});

export default app;

