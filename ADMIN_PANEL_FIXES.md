# Admin Panel Fixes - Comprehensive Solution

## Root Causes Identified

1. **API Response Format Error**: Backend wasn't setting proper Content-Type headers, causing "Invalid response format" errors
2. **Missing API Client Usage**: Several admin pages still use Supabase directly instead of the custom API client
3. **Response Parsing Issues**: API client wasn't handling non-JSON responses gracefully
4. **Missing Backend Endpoints**: Some admin features (Analytics, Visitors, Upcoming Trailers) don't have backend endpoints yet

## Files Fixed

### 1. `src/lib/api.ts`
**Issue**: API client wasn't handling response parsing errors gracefully
**Fix**: Improved JSON parsing with try-catch and better error messages

### 2. `server/src/index.ts`
**Issue**: Backend wasn't setting Content-Type header, causing "Invalid response format" errors
**Fix**: Added middleware to set `Content-Type: application/json` for all responses

### 3. `src/pages/admin/AdminUsers.tsx`
**Issue**: Still using Supabase directly
**Fix**: Migrated to use API client (`api.getAdminUsers()`)

### 4. `server/src/index.ts` (Additional endpoints)
**Issue**: Missing endpoints for Analytics, Visitors, Upcoming Trailers
**Fix**: Added stub endpoints that return empty data (can be implemented later)

## Deployment Instructions

### Step 1: Upload Fixed Files (Windows PowerShell)

```powershell
cd C:\trailerhub

# Upload API client
scp src/lib/api.ts root@62.171.149.223:/root/trailerhub/src/lib/

# Upload backend
scp server/src/index.ts root@62.171.149.223:/root/trailerhub/server/src/

# Upload AdminUsers
scp src/pages/admin/AdminUsers.tsx root@62.171.149.223:/root/trailerhub/src/pages/admin/
```

Password: `B2e64X3kg9J`

### Step 2: Rebuild on VPS

```bash
cd /root/trailerhub
docker compose down
docker compose up -d --build

# Wait for build (2-3 minutes)
sleep 120

# Copy frontend files
rm -rf /var/www/movietrailers/*
docker cp movietrailers-api:/app/dist/. /var/www/movietrailers/
chown -R www-data:www-data /var/www/movietrailers/
```

### Step 3: Verify Backend

```bash
# Check backend logs
docker compose logs backend | tail -20
```

Should see: `🎬 Movie Trailers API running on port 3001`

### Step 4: Test Admin Panel

1. Hard refresh browser: `Ctrl + Shift + R`
2. Log out and log back in (to refresh token)
3. Go to: `https://trailershub.org/admin`
4. Check:
   - Dashboard shows correct stats
   - Movies list works
   - Users page works
   - No "Invalid response format" errors

## Remaining Issues (Non-Critical)

These features return empty data but won't crash:
- **Analytics**: Returns empty arrays (stub endpoint)
- **Visitors**: Returns empty data (stub endpoint)
- **Upcoming Trailers**: Returns empty array (stub endpoint)

These can be implemented later when needed.

## Environment Variables Check

Ensure your `.env` file on VPS has:

```env
DATABASE_URL=postgresql://movieapp:Qscvpknb2765ln078UIDE@postgres:5432/movietrailers
JWT_SECRET=Q70GYMEmoXyhRyy90Ysu47N6EtS+sSvZOByWNlDFCkQ=
FRONTEND_URL=https://trailershub.org
VITE_API_URL=https://trailershub.org
TMDB_API_KEY=your_tmdb_api_key_here
NODE_ENV=production
```

## Testing Checklist

- [ ] Dashboard loads with correct stats
- [ ] Movies list shows all movies
- [ ] Add Movie works
- [ ] Edit Movie works
- [ ] Delete Movie works
- [ ] Users page shows all users
- [ ] Categories page works
- [ ] Reviews page works
- [ ] Newsletter page works
- [ ] TMDB Import works (search and import)
- [ ] No console errors

## If Issues Persist

1. Check browser console (F12) for errors
2. Check backend logs: `docker compose logs backend | tail -50`
3. Verify database connection: `docker compose exec postgres psql -U movieapp -d movietrailers -c "SELECT COUNT(*) FROM movies;"`
4. Check authentication: Log out and log back in

