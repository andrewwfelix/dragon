require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMonsterTypesStructure() {
  console.log('🔍 Checking monster_types table structure...\n');
  
  try {
    // Get a sample record to see the structure
    const { data, error } = await supabase
      .from('monster_types')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing monster_types table:', error);
      return;
    }
    
    if (data.length > 0) {
      console.log('📋 Current table structure:');
      console.log('Columns:', Object.keys(data[0]));
      
      console.log('\n📊 Sample data:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check if image_url column exists
      const hasImageUrl = 'image_url' in data[0];
      console.log(`\n🖼️  Has image_url column: ${hasImageUrl ? '✅ Yes' : '❌ No'}`);
      
      if (!hasImageUrl) {
        console.log('\n💡 To add the image_url column, run this SQL in your database:');
        console.log('ALTER TABLE monster_types ADD COLUMN IF NOT EXISTS image_url TEXT;');
      }
    } else {
      console.log('⚠️  Table is empty!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMonsterTypesStructure()
  .then(() => {
    console.log('\n✨ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  }); 