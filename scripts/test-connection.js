const { Pool } = require('pg');

// Load environment variables from .env.local
const path = require('path');
const envPath = path.join(__dirname, '..', 'env.local');
require('dotenv').config({ path: envPath });

// Debug environment variables
console.log('🔧 Testing Database Connection...\n');
console.log('Environment Variables:');
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST ? 'Set' : 'Not set');
console.log('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE ? 'Set' : 'Not set');
console.log('POSTGRES_USER:', process.env.POSTGRES_USER ? 'Set' : 'Not set');
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD ? 'Set' : 'Not set');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set' : 'Not set');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('');

// Check if we have Supabase or Vercel Postgres credentials
const hasSupabase = process.env.SUPABASE_URL && process.env.POSTGRES_HOST && process.env.POSTGRES_HOST.includes('supabase');
const hasVercelPostgres = process.env.POSTGRES_HOST && !process.env.POSTGRES_HOST.includes('supabase');

console.log('🔍 Detected configuration:');
console.log('Supabase:', hasSupabase ? 'Yes' : 'No');
console.log('Vercel Postgres:', hasVercelPostgres ? 'Yes' : 'No');
console.log('');

if (!hasSupabase && !hasVercelPostgres) {
  console.error('❌ No valid database configuration found');
  console.error('Please ensure you have either Supabase or Vercel Postgres credentials');
  process.exit(1);
}

// Initialize database connection
let postgresPool;

if (hasSupabase) {
  console.log('🗄️ Using Supabase PostgreSQL connection...');
  
  // Try using POSTGRES_URL first, then fall back to individual parameters
  if (process.env.POSTGRES_URL) {
    console.log('🔗 Using POSTGRES_URL connection string...');
    postgresPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    console.log('🔗 Using individual connection parameters...');
    postgresPool = new Pool({
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: 5432,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    });
  }
} else {
  console.log('🗄️ Using Vercel PostgreSQL connection...');
  postgresPool = new Pool({
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

async function testConnection() {
  console.log('🔌 Attempting to connect to database...');
  
  try {
    const client = await postgresPool.connect();
    console.log('✅ Successfully connected to database!');
    
    // Test a simple query
    console.log('🔍 Testing database query...');
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    
    console.log('✅ Database query successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);
    
    // Check if tables exist
    console.log('\n📋 Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📊 Existing tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('📊 No tables found (this is expected for a new database)');
    }
    
    client.release();
    console.log('\n🎉 Connection test completed successfully!');
    console.log('✅ Your database is ready for migration.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check your .env.local file has correct credentials');
    console.error('2. Verify your database is active');
    console.error('3. Check if your IP is allowed to connect');
    console.error('4. Verify SSL settings if needed');
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 DNS resolution failed - this usually means:');
      console.error('- Wrong host address');
      console.error('- Network connectivity issues');
      console.error('- DNS server problems');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused - this usually means:');
      console.error('- Database is not running');
      console.error('- Wrong port number');
      console.error('- Firewall blocking connection');
    }
    
    process.exit(1);
  } finally {
    await postgresPool.end();
  }
}

// Run the test
testConnection(); 