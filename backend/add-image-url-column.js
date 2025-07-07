require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addImageUrlColumn() {
  console.log('🔧 Adding image_url column to monster_types table...\n');
  
  try {
    // Add the image_url column
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE monster_types ADD COLUMN IF NOT EXISTS image_url TEXT;'
    });
    
    if (error) {
      console.error('❌ Error adding column:', error);
      return;
    }
    
    console.log('✅ Successfully added image_url column to monster_types table');
    
    // Verify the column was added
    const { data, error: selectError } = await supabase
      .from('monster_types')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error verifying column:', selectError);
      return;
    }
    
    if (data.length > 0) {
      console.log('📋 Current table structure:');
      console.log('Columns:', Object.keys(data[0]));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addImageUrlColumn()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 