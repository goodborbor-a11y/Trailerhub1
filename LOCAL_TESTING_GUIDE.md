# Local Testing Guide

This guide shows you how to test changes locally before deploying to production.

## Prerequisites

- Node.js 20+ installed
- PostgreSQL installed (or use Docker)
- npm or yarn

## Option 1: Full Local Setup (Recommended)

### Step 1: Set up the Database

**Option A: Use Docker (Easiest)**
```bash
# Start just the database
docker-compose up -d postgres

# Wait for it to be ready (about 10 seconds)
docker ps
```

**Option B: Use Local PostgreSQL**
```bash
# Create database
createdb movietrailers

# Run schema
psql -d movietrailers -f database/schema.sql
```

### Step 2: Set up Backend Environment

Create `server/.env` file:
```env
DATABASE_URL=postgresql://movieapp:changeme@localhost:5432/movietrailers
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_for_local_testing
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
TMDB_API_KEY=your_tmdb_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 3: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 4: Start Backend (Terminal 1)

```bash
cd server
npm run dev
```

The backend will run on `http://localhost:3001`

### Step 5: Start Frontend (Terminal 2)

```bash
# In the root directory
npm run dev
```

The frontend will run on `http://localhost:5173`

### Step 6: Test Your Changes

1. Open `http://localhost:5173` in your browser
2. Make your changes to the code
3. Frontend auto-reloads (Hot Module Replacement)
4. Backend auto-reloads (ts-node-dev)
5. Test everything works before deploying

## Option 2: Quick Frontend Testing (Backend on Server)

If you only want to test frontend changes:

### Step 1: Update API URL

The frontend already detects localhost automatically, but you can verify in `src/lib/api.ts`:
```typescript
const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001'  // Local dev
  : 'https://trailershub.org'; // Production
```

### Step 2: Start Frontend

```bash
npm run dev
```

### Step 3: Point to Production Backend (Optional)

If you want to test frontend against production backend, create `.env.local`:
```env
VITE_API_URL=https://trailershub.org
```

## Testing Workflow

### Before Making Changes:

1. **Start local environment**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Verify it works**
   - Open `http://localhost:5173`
   - Test login, watchlist, etc.
   - Make sure everything works

### Making Changes:

1. **Make your code changes**
2. **Watch for errors** in terminal and browser console
3. **Test the feature** in browser
4. **Fix any issues** locally

### Before Deploying:

1. **Build locally** to catch build errors:
   ```bash
   npm run build
   ```

2. **Check for errors** - if build fails, fix before deploying

3. **Test the built version** (optional):
   ```bash
   npm run preview
   ```

4. **Deploy only when everything works locally**

## Common Issues

### Backend can't connect to database
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Check DATABASE_URL in `server/.env`

### Frontend can't connect to backend
- Check backend is running on port 3001
- Check CORS settings in `server/src/index.ts`
- Check browser console for errors

### Port already in use
- Change port in `vite.config.ts` (frontend)
- Change PORT in `server/.env` (backend)

## Quick Commands Reference

```bash
# Start everything locally
docker-compose up -d postgres  # Database only
cd server && npm run dev      # Backend (Terminal 1)
npm run dev                    # Frontend (Terminal 2)

# Build for production (test before deploying)
npm run build

# Preview production build
npm run preview

# Stop everything
docker-compose down            # Stop database
# Ctrl+C in both terminals     # Stop frontend/backend
```

## Benefits of Local Testing

✅ Catch errors before they reach production  
✅ Faster development (no deployment needed)  
✅ Test without affecting live site  
✅ Debug easily with browser DevTools  
✅ Safe to experiment  

## Next Steps

Once you've tested locally and everything works:
1. Build: `npm run build`
2. Upload to server
3. Deploy

This way, you know it works before deploying! 🚀

