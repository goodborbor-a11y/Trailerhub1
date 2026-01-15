# 🔄 Migration Guide: Supabase → Self-Hosted API

Your project currently uses **Supabase** for the frontend, but you have a **self-hosted backend** ready. This guide helps you migrate.

## 📋 What Needs to Change

The frontend uses Supabase in these files:
- `src/hooks/useAuth.tsx`
- `src/hooks/useMovies.tsx`
- `src/hooks/useMovieRatings.tsx`
- `src/hooks/useAdmin.tsx`
- All admin pages (`src/pages/admin/*`)
- `src/pages/Index.tsx`
- `src/pages/Watchlist.tsx`
- `src/pages/Favorites.tsx`
- `src/pages/MyReviews.tsx`
- Various components

## ✅ What's Already Ready

- ✅ Backend API (`server/src/index.ts`) - Fully implemented
- ✅ Custom API client (`src/lib/api.ts`) - Ready to use
- ✅ Database schema - PostgreSQL ready
- ✅ Authentication - JWT-based auth working

## 🎯 Migration Strategy

### Step 1: Update useAuth Hook

**File**: `src/hooks/useAuth.tsx`

Replace Supabase auth with API client:

```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  display_name?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const result = await api.getCurrentUser();
      if (result.data?.user) {
        setUser(result.data.user);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await api.signIn(email, password);
    if (result.data?.user) {
      setUser(result.data.user);
    } else {
      throw new Error(result.error || 'Login failed');
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const result = await api.signUp(email, password, displayName);
    if (result.data?.user) {
      setUser(result.data.user);
    } else {
      throw new Error(result.error || 'Signup failed');
    }
  };

  const signOut = async () => {
    await api.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Step 2: Update useMovies Hook

**File**: `src/hooks/useMovies.tsx`

```typescript
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useMovies(filters?: {
  category?: string;
  featured?: boolean;
  trending?: boolean;
  latest?: boolean;
}) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMovies();
  }, [filters]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const result = await api.getMovies(filters);
      if (result.data?.movies) {
        setMovies(result.data.movies);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  return { movies, loading, error, refetch: loadMovies };
}
```

### Step 3: Update useMovieRatings Hook

**File**: `src/hooks/useMovieRatings.tsx`

```typescript
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function useMovieRatings(movieId: string) {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (movieId) {
      loadRatings();
    }
  }, [movieId]);

  const loadRatings = async () => {
    try {
      const result = await api.getMovieRatings(movieId);
      if (result.data?.ratings) {
        setRatings(result.data.ratings);
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async (rating: number, review?: string) => {
    try {
      await api.submitRating(movieId, rating, review);
      await loadRatings(); // Reload after submission
    } catch (error) {
      throw error;
    }
  };

  return { ratings, loading, submitRating, refetch: loadRatings };
}
```

### Step 4: Update Pages

**Example: Watchlist.tsx**

Replace:
```typescript
const { data: watchlist } = await supabase
  .from('watchlist')
  .select('*')
  .eq('user_id', user.id);
```

With:
```typescript
const result = await api.getWatchlist();
const watchlist = result.data?.watchlist || [];
```

**Example: Favorites.tsx**

Replace Supabase queries with:
```typescript
const result = await api.getWatchlist();
const favorites = result.data?.watchlist?.filter(item => item.is_favorite) || [];
```

### Step 5: Update Admin Pages

All admin pages need similar updates. The pattern is:

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('movies')
  .select('*');
```

**After (API):**
```typescript
const result = await api.getMovies();
const movies = result.data?.movies || [];
```

## 🔧 Helper: Create Admin API Methods

Add these to `src/lib/api.ts`:

```typescript
// Admin methods
async getAdminStats() {
  return this.request<{ stats: any }>('/admin/stats');
}

async getAllUsers() {
  return this.request<{ users: any[] }>('/admin/users');
}

async updateUser(userId: string, updates: any) {
  return this.request<{ user: any }>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Add more admin methods as needed
```

## ⚠️ Important Notes

1. **Authentication**: The API uses JWT tokens stored in cookies/localStorage
2. **Error Handling**: API client returns `{ data, error }` format
3. **Loading States**: You'll need to handle loading states manually
4. **Real-time**: Supabase realtime won't work - you'll need polling or WebSockets if needed

## 🧪 Testing Migration

1. **Test locally first**:
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev

   # Terminal 2: Start frontend
   npm run dev
   ```

2. **Test each feature**:
   - ✅ Sign up / Sign in
   - ✅ Browse movies
   - ✅ Add to watchlist
   - ✅ Submit ratings
   - ✅ Admin functions

3. **Fix any errors** as you go

## 🚀 After Migration

Once migration is complete:

1. Remove Supabase dependency (optional):
   ```bash
   npm uninstall @supabase/supabase-js
   ```

2. Delete Supabase client file (optional):
   ```bash
   rm src/integrations/supabase/client.ts
   ```

3. Update environment variables:
   - Remove: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Add: `VITE_API_URL`

4. Deploy to VPS following the main deployment guide!

## 📝 Migration Checklist

- [ ] Update `useAuth.tsx`
- [ ] Update `useMovies.tsx`
- [ ] Update `useMovieRatings.tsx`
- [ ] Update `useAdmin.tsx`
- [ ] Update all admin pages
- [ ] Update `Index.tsx`
- [ ] Update `Watchlist.tsx`
- [ ] Update `Favorites.tsx`
- [ ] Update `MyReviews.tsx`
- [ ] Update components (Header, Footer, etc.)
- [ ] Test all features locally
- [ ] Remove Supabase dependencies (optional)

## 🆘 Need Help?

If you get stuck:
1. Check the API client methods in `src/lib/api.ts`
2. Check backend routes in `server/src/index.ts`
3. Check browser console for errors
4. Check backend logs: `docker compose logs backend`

---

**Note**: This is a significant migration. Consider doing it incrementally - migrate one feature at a time and test thoroughly!

