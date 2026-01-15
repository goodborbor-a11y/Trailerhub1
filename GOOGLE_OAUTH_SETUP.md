# Google OAuth Setup Guide

## ✅ Implementation Complete

Google OAuth authentication has been successfully integrated into your TrailerHub application. Users can now sign in with their Google accounts.

## 📋 What Was Implemented

### Backend Changes:
1. **Database Migration** (`database/migrations/add_google_oauth.sql`)
   - Added `google_id` column to `users` table
   - Made `password_hash` nullable (for OAuth users)
   - Added `auth_provider` column to track signup method
   - Created index for faster Google ID lookups

2. **Backend Routes** (`server/src/index.ts`)
   - `GET /auth/google` - Initiates Google OAuth flow
   - `GET /auth/google/callback` - Handles OAuth callback from Google

3. **Dependencies** (`server/package.json`)
   - Added `google-auth-library` package

### Frontend Changes:
1. **Auth Page** (`src/pages/Auth.tsx`)
   - Added "Continue with Google" button
   - Added OAuth callback handling
   - Added visual divider between email/password and Google login

2. **API Client** (`src/lib/api.ts`)
   - Added `setToken()` method` for OAuth token management

## 🔧 Setup Instructions

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External (unless you have Google Workspace)
   - App name: TrailerHub
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: TrailerHub Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3001` (for development)
     - `https://trailershub.org` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3001/auth/google/callback` (for development)
     - `https://trailershub.org/auth/google/callback` (for production)
7. Copy the **Client ID** and **Client Secret**

### Step 2: Run Database Migration

On your server, run the migration:

```bash
psql -U movieapp -d movietrailers -f database/migrations/add_google_oauth.sql
```

Or if you're using Docker:

```bash
docker exec -i movietrailers-db psql -U movieapp -d movietrailers < database/migrations/add_google_oauth.sql
```

### Step 3: Configure Environment Variables

Add these to your `.env` file on the server:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Backend URL (for OAuth callback)
BACKEND_URL=https://trailershub.org
# Or for development:
# BACKEND_URL=http://localhost:3001

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=https://trailershub.org
# Or for development:
# FRONTEND_URL=http://localhost:5173
```

### Step 4: Install Dependencies

On your server, rebuild the Docker container (it will install `google-auth-library` automatically):

```bash
cd /root/trailerhub
docker compose down
docker compose up -d --build
```

Or if installing locally:

```bash
cd server
npm install
```

### Step 5: Update Nginx Configuration (if needed)

Make sure your Nginx configuration allows the OAuth callback route:

```nginx
location /auth/google {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /auth/google/callback {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🧪 Testing

1. **Development Testing:**
   - Start your local server
   - Go to `http://localhost:5173/auth`
   - Click "Continue with Google"
   - Complete Google OAuth flow
   - You should be redirected back and logged in

2. **Production Testing:**
   - Deploy the updated code
   - Go to `https://trailershub.org/auth`
   - Click "Continue with Google"
   - Complete Google OAuth flow
   - You should be redirected back and logged in

## 🔍 How It Works

1. User clicks "Continue with Google" button
2. Frontend redirects to `/auth/google` on backend
3. Backend redirects to Google OAuth consent screen
4. User grants permission
5. Google redirects back to `/auth/google/callback` with authorization code
6. Backend exchanges code for user info
7. Backend creates/updates user in database
8. Backend generates JWT token
9. Backend redirects to frontend with token
10. Frontend stores token and fetches user data
11. User is logged in!

## 🎯 Features

- ✅ Automatic account creation for new Google users
- ✅ Account linking (if user exists with email, links Google account)
- ✅ Profile picture and display name from Google
- ✅ Seamless integration with existing auth system
- ✅ Works for both new and existing users
- ✅ Secure token-based authentication

## ⚠️ Important Notes

1. **Email Verification:** Google emails are already verified, so OAuth users don't need email verification
2. **Password:** OAuth users don't have passwords - they can only sign in via Google
3. **Account Linking:** If a user signs up with email first, then uses Google with the same email, the accounts will be linked
4. **Security:** Make sure to keep your `GOOGLE_CLIENT_SECRET` secure and never commit it to version control

## 🐛 Troubleshooting

**Issue: "Google OAuth not configured"**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the server after adding environment variables

**Issue: "Redirect URI mismatch"**
- Verify the redirect URI in Google Cloud Console matches exactly: `https://trailershub.org/auth/google/callback`
- Check for trailing slashes or protocol mismatches

**Issue: "Invalid code"**
- Make sure the OAuth consent screen is properly configured
- Check that the redirect URI is authorized in Google Cloud Console

**Issue: Database errors**
- Make sure you ran the migration: `add_google_oauth.sql`
- Check that the `users` table has `google_id` and `auth_provider` columns

## 📝 Next Steps

1. Set up Google OAuth credentials in Google Cloud Console
2. Run the database migration
3. Add environment variables
4. Rebuild and deploy
5. Test the Google login flow

Your Google OAuth integration is ready to use! 🎉

