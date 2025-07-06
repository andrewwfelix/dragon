const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Executing database schema...');
    
    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      console.log('\n📝 Manual Setup Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of scripts/schema.sql');
      console.log('4. Execute the SQL');
      return false;
    }
    
    console.log('✅ Database schema created successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of scripts/schema.sql');
    console.log('4. Execute the SQL');
    return false;
  }
}

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('monsters')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('ℹ️  Connection test failed (expected if tables don\'t exist yet):', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

async function checkEnvironment() {
  console.log('🔧 Checking environment configuration...');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.log('\n📝 Please ensure these are set in your Vercel environment variables');
    return false;
  }
  
  console.log('✅ Environment variables configured correctly');
  return true;
}

async function main() {
  console.log('🐉 D&D 5e Application - Supabase Setup\n');
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    process.exit(1);
  }
  
  // Test connection
  const connectionOk = await testConnection();
  
  // Setup database schema
  const schemaOk = await setupDatabase();
  
  if (schemaOk) {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run data migration: npm run migrate');
    console.log('2. Start development: npm run dev');
    console.log('3. Deploy to Vercel: vercel --prod');
  } else {
    console.log('\n⚠️  Please complete manual database setup');
    console.log('Then run: npm run migrate');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupDatabase,
  testConnection,
  checkEnvironment
}; 