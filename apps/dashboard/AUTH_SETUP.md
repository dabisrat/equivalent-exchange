# Authentication Setup Guide

## Environment Variables

Create a `.env.local` file in the dashboard app directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site Configuration (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Supabase Configuration

1. **Create a Supabase Project** (if you haven't already)
2. **Enable Authentication** in your Supabase dashboard
3. **Configure OAuth Providers** (Google, GitHub, etc.) in Authentication > Providers
4. **Set Redirect URLs** in Authentication > URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/callback`

## Features Implemented

- ✅ **Middleware Protection**: Routes are protected at the middleware level
- ✅ **Combined Login/Signup**: Single page handles both authentication flows
- ✅ **Password Reset**: Forgot password functionality
- ✅ **OAuth Callback**: Handles OAuth provider redirects
- ✅ **Protected Dashboard**: Only authenticated users can access
- ✅ **User Profile**: Display user info in sidebar
- ✅ **Logout Functionality**: Sign out from sidebar user menu

## Routes

- `/login` - Combined login/signup page
- `/reset-password` - Password reset page
- `/callback` - OAuth callback handler
- `/dashboard` - Protected dashboard (main app)
- `/` - Redirects to `/dashboard`

## Usage

1. Start the development server: `pnpm dev`
2. Navigate to `http://localhost:3000`
3. You'll be redirected to the login page
4. Sign up or log in to access the dashboard
5. Use the user menu in the sidebar to log out

## Key Changes Made

- **Combined Authentication**: Login and signup are now handled by the same Auth component
- **Clean URLs**: Removed `/auth` prefix from all authentication routes
- **Sidebar Integration**: User profile and logout moved to the sidebar avatar
- **Direct Redirects**: OAuth flow now redirects directly to `/dashboard` after successful authentication 