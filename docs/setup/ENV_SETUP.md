# Environment Variables Setup

This document explains how to configure environment variables for the PNG Green Fees System.

## 🔒 Security Notice

**NEVER commit real credentials to the repository!**

- `.env`, `.env.local`, `.env.production` are in `.gitignore`
- Only `.env.example` and `env.production.example` should be committed
- These example files contain placeholder values only

## Development Setup

### 1. Create Local Environment File

```bash
cp .env.example .env
```

### 2. Get Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project (or create a new one)
3. Navigate to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token)

### 3. Update .env File

Open `.env` and replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key
```

### 4. Restart Dev Server

If the dev server is running, restart it to load the new environment variables:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Production Setup

### For VPS Deployment

1. Copy the production example:
   ```bash
   cp env.production.example .env.production
   ```

2. Update `.env.production` with production Supabase credentials:
   ```env
   NODE_ENV=production
   PORT=3000
   VITE_SUPABASE_URL=https://your-production-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   ```

3. The deployment script will use these values during build

### For Cloud Platforms (Vercel, Netlify, etc.)

Add environment variables in the platform's dashboard:

**Vercel:**
1. Go to Project Settings > Environment Variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Netlify:**
1. Go to Site Settings > Environment Variables
2. Add the same variables

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NODE_ENV` | Environment mode | No (auto-set) | `development` or `production` |
| `PORT` | Server port for production | No (default: 3000) | `3000` |

## Troubleshooting

### Environment Variables Not Loading

1. **Restart the dev server** - Vite only loads env vars on startup
2. **Check file name** - Must be exactly `.env` (not `.env.txt`)
3. **Check prefix** - All client-side vars must start with `VITE_`
4. **Verify location** - `.env` must be in project root directory

### "Invalid API key" Error

1. Verify you copied the **anon/public** key (not service_role key)
2. Check for extra spaces or line breaks in the key
3. Ensure the key matches your Supabase project

### Connection Errors

1. Check if Supabase project URL is correct
2. Verify project is not paused (free tier projects auto-pause after inactivity)
3. Check browser console for detailed error messages
4. Run the connection test: Check console for testSupabase.js output

## Best Practices

✅ **DO:**
- Keep `.env` files local and never commit them
- Use different Supabase projects for dev/staging/prod
- Rotate keys if accidentally exposed
- Document required variables in `.env.example`
- Use strong, unique passwords for production

❌ **DON'T:**
- Commit `.env` files to version control
- Share credentials in chat/email/Slack
- Use production credentials in development
- Hardcode credentials in source files
- Use the service_role key in client-side code

## Getting Help

If you need to regenerate your Supabase keys:

1. Go to **Settings** > **API** in Supabase dashboard
2. Click "Regenerate" next to the key
3. Update all places where the old key was used
4. The service_role key should NEVER be used in client-side code

For more details, see:
- `SUPABASE_SETUP.md` - Complete Supabase setup guide
- `MIGRATION_SUMMARY.md` - Migration overview and next steps
