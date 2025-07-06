# Supabase Setup Guide for D&D 5e Application

This guide will help you set up Supabase for your D&D 5e application and migrate your Open5e data.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Your Open5e data files in `C:\temp\dragon_data`
- Node.js and npm installed

## Step 1: Set Up Environment Variables

1. Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

2. Get these values from your Supabase project:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the Project URL and API keys

## Step 2: Create Database Schema

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `scripts/setup-supabase-schema.sql`
4. Run the SQL script

This will create all the necessary tables for your D&D 5e data:
- `monsters` - Monster data from Open5e
- `spells` - Spell data from Open5e
- `magic_items` - Magic item data from Open5e
- `classes` - Class data from Open5e
- `races` - Race data from Open5e
- `backgrounds` - Background data from Open5e
- `feats` - Feat data from Open5e
- `weapons` - Weapon data from Open5e
- `armor` - Armor data from Open5e
- `characters` - User-created characters
- `encounters` - User-created encounters

## Step 3: Test Connection

Run the connection test to verify everything is set up correctly:

```bash
npm run test-supabase
```

This will:
- Verify your environment variables are set
- Test the database connection
- Check if all tables are accessible

## Step 4: Migrate Open5e Data

Once the connection test passes, migrate your Open5e data:

```bash
npm run migrate-supabase
```

This script will:
- Read all JSON files from `C:\temp\dragon_data`
- Transform the data to match your database schema
- Insert the data into Supabase tables
- Handle duplicates gracefully using upsert operations

## Step 5: Verify Migration

After migration, you can verify the data was imported correctly:

1. Go to your Supabase Table Editor
2. Check each table to see the imported data
3. You should see thousands of records in tables like `monsters`, `spells`, etc.

## Troubleshooting

### Connection Issues

If you get connection errors:

1. Verify your environment variables are correct
2. Check that your Supabase project is active
3. Ensure your IP is not blocked by Supabase

### Migration Issues

If migration fails:

1. Check that your data files exist in `C:\temp\dragon_data`
2. Verify the JSON files are valid
3. Check the console output for specific error messages

### Table Not Found Errors

If tables don't exist:

1. Make sure you ran the schema setup script
2. Check that the SQL script executed successfully
3. Verify table names match exactly

## Next Steps

Once your data is migrated, you can:

1. Start building your frontend components
2. Create API endpoints in your backend
3. Set up authentication with Supabase Auth
4. Build character creation and management features

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for client-side | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server-side | Yes |

## Security Notes

- The service role key has full access to your database
- Keep it secure and never expose it in client-side code
- Use Row Level Security (RLS) policies for user data protection
- The schema includes RLS policies for user-specific data

## Data Structure

Each table includes:
- Structured fields for common queries
- A `data` JSONB field containing the full Open5e data
- Timestamps for tracking changes
- Proper indexing for performance

This allows you to:
- Query structured fields efficiently
- Access full data when needed
- Maintain data integrity
- Scale your application as needed 