# 🚀 Vercel Deployment Guide

## Prerequisites

- ✅ Vercel account
- ✅ Supabase project with environment variables configured
- ✅ Open5e data files in `C:\temp\dragon_data`

## 🏗️ Environment Variables Setup

You've already configured these in Vercel:

### Required Variables
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Optional Variables (Direct PostgreSQL)
- `POSTGRES_HOST` - PostgreSQL host
- `POSTGRES_DATABASE` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password

## 📋 Deployment Steps

### 1. Database Setup

First, set up your Supabase database schema:

```bash
# Option A: Automated setup (recommended)
npm run setup-supabase

# Option B: Manual setup
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of scripts/schema.sql
# 3. Execute the SQL
```

### 2. Data Migration

Import your Open5e data:

```bash
# Run the migration script
npm run migrate
```

This will import all 6,767 items from your `C:\temp\dragon_data` directory.

### 3. Local Development

Test locally before deploying:

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

This starts:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000

### 4. Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## 🔧 Vercel Configuration

The `vercel.json` file is configured to:

- **Backend**: Deploy `backend/server.js` as serverless functions
- **Frontend**: Build and serve the React app
- **Routing**: Route `/api/*` to backend, everything else to frontend

## 📊 Database Schema

The application creates these tables:

### Core Data Tables
- `monsters` - 3,300 monsters with complete stats
- `spells` - 1,500 spells with casting details
- `magic_items` - 1,618 magic items
- `classes` - 12 character classes
- `races` - 52 races and subraces
- `backgrounds` - 52 backgrounds
- `feats` - 89 feats
- `weapons` - 37 weapons
- `armor` - 12 armor types

### User Data Tables
- `characters` - User-created characters
- `encounters` - Encounter management

## 🔍 API Endpoints

Once deployed, your API will be available at:

- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/monsters` - Monster database
- `https://your-app.vercel.app/api/spells` - Spell reference
- `https://your-app.vercel.app/api/characters` - Character management
- `https://your-app.vercel.app/api/encounters` - Encounter builder

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-07T...",
  "service": "D&D 5e Backend API"
}
```

### 2. Test Monster API
```bash
curl https://your-app.vercel.app/api/monsters?limit=5
```

### 3. Test Spell API
```bash
curl https://your-app.vercel.app/api/spells?level=1&limit=5
```

## 🔒 Security Considerations

### Row Level Security (RLS)
- User data (characters, encounters) is protected by RLS
- Public data (monsters, spells) is read-only
- Service role key used only for admin operations

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel's environment variable system
- Rotate keys regularly

## 📈 Performance Optimization

### Database Indexes
- Full-text search on names
- Type-based filtering
- JSONB GIN indexes for complex queries

### Caching
- React Query for frontend caching
- Supabase caching for database queries
- Vercel edge caching for static assets

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   ```bash
   # Check if variables are set
   vercel env ls
   ```

2. **Database Connection Failed**
   ```bash
   # Test connection
   npm run setup-supabase
   ```

3. **Migration Failed**
   ```bash
   # Check data directory path
   # Ensure C:\temp\dragon_data exists
   ```

4. **Build Errors**
   ```bash
   # Check Vercel build logs
   vercel logs
   ```

### Debug Commands

```bash
# Test environment setup
npm run setup-supabase

# Test data migration
npm run migrate

# Check local development
npm run dev

# View Vercel logs
vercel logs
```

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connection
4. Review Supabase dashboard for errors

## 🎉 Success!

Once deployed, your D&D 5e application will be available at:
`https://your-app.vercel.app`

Features available:
- ✅ Complete monster database (3,300+ monsters)
- ✅ Spell reference (1,500+ spells)
- ✅ Character builder
- ✅ Encounter management
- ✅ Responsive design
- ✅ Real-time data

Your application is now ready for the D&D community! 🐉 