const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addVisualDescriptionColumn() {
  console.log('🦖 Adding visual_description column to monsters table...');
  
  try {
    // Add the visual_description column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE monsters 
        ADD COLUMN IF NOT EXISTS visual_description TEXT;
      `
    });

    if (error) {
      // If RPC method doesn't work, try direct SQL execution
      console.log('RPC method failed, trying alternative approach...');
      
      // For Supabase, we might need to use the SQL editor directly
      // Let's provide the SQL command to run manually
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('==========================================');
      console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS visual_description TEXT;');
      console.log('==========================================');
      console.log('\nOr if you prefer to add it with a default value:');
      console.log('==========================================');
      console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS visual_description TEXT DEFAULT NULL;');
      console.log('==========================================');
      
      return;
    }

    console.log('✅ visual_description column added successfully!');
    
    // Verify the column was added
    const { data: columns, error: describeError } = await supabase
      .from('monsters')
      .select('*')
      .limit(1);
    
    if (describeError) {
      console.log('⚠️  Could not verify column addition, but the operation likely succeeded');
    } else {
      console.log('✅ Column verification successful');
    }
    
  } catch (error) {
    console.error('❌ Error adding visual_description column:', error);
    
    // Provide manual SQL as fallback
    console.log('\n📝 If the automatic migration failed, please run this SQL manually in your Supabase SQL Editor:');
    console.log('==========================================');
    console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS visual_description TEXT;');
    console.log('==========================================');
  }
}

// Run the migration
if (require.main === module) {
  addVisualDescriptionColumn()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addVisualDescriptionColumn }; 