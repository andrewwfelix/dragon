const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Check if we're using Vercel Postgres or Supabase
// If POSTGRES_HOST contains 'supabase', treat it as Supabase
const hasSupabaseHost = process.env.POSTGRES_HOST && process.env.POSTGRES_HOST.includes('supabase');
const useVercelPostgres = process.env.POSTGRES_HOST && process.env.POSTGRES_DATABASE && !hasSupabaseHost;

let supabase = null;
let postgresPool = null;

if (useVercelPostgres) {
  // Use Vercel Postgres
  console.log('🗄️ Using Vercel Postgres database');
  
  postgresPool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
} else if ((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  // Use Supabase with direct Supabase credentials
  console.log('🗄️ Using Supabase database (direct credentials)');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  supabase = createClient(supabaseUrl, supabaseKey);
  
} else if (hasSupabaseHost && process.env.POSTGRES_PASSWORD) {
  // Use Supabase with POSTGRES_* variables (Vercel deployment style)
  console.log('🗄️ Using Supabase database (POSTGRES_* variables)');
  
  // Extract Supabase URL from POSTGRES_HOST
  const supabaseUrl = `https://${process.env.POSTGRES_HOST.replace('db.', '').replace('.supabase.co', '')}.supabase.co`;
  const supabaseKey = process.env.POSTGRES_PASSWORD; // Service role key is stored in POSTGRES_PASSWORD
  
  supabase = createClient(supabaseUrl, supabaseKey);
  
} else {
  console.error('❌ No database configuration found');
  console.error('Please set either Vercel Postgres or Supabase environment variables');
  console.error('Required Supabase variables: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  console.error('Or for Vercel-style deployment: POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD');
  console.error('Check your .env.local file in the project root');
  console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('POSTGRES')));
  process.exit(1);
}

// Database helper functions
const db = {
  // Query function that works with both databases
  async query(text, params = []) {
    if (postgresPool) {
      // Vercel Postgres
      const client = await postgresPool.connect();
      try {
        const result = await client.query(text, params);
        return { data: result.rows, error: null };
      } catch (error) {
        return { data: null, error };
      } finally {
        client.release();
      }
    } else if (supabase) {
      // Supabase - use the client directly
      // Note: This is a simplified approach. For complex queries, you might need to use
      // supabase.from('table').select() syntax instead of raw SQL
      try {
        // For now, return an error indicating that raw SQL is not supported
        // The route handlers should use Supabase's query builder instead
        return { 
          data: null, 
          error: new Error('Raw SQL queries not supported with Supabase. Use Supabase query builder methods instead.') 
        };
      } catch (error) {
        return { data: null, error };
      }
    }
  },

  // Get the appropriate client
  getClient() {
    return postgresPool || supabase;
  },

  // Check if using Vercel Postgres
  isVercelPostgres() {
    return !!postgresPool;
  },

  // Check if using Supabase
  isSupabase() {
    return !!supabase;
  }
};

module.exports = db; 