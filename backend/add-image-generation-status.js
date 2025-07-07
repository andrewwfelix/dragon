require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addImageGenerationStatusColumns() {
  console.log('🔧 Adding image_generation_status columns...\n');
  
  try {
    // Add column to monster_types table
    console.log('📝 Adding image_generation_status to monster_types table...');
    const { error: monsterTypesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE monster_types ADD COLUMN IF NOT EXISTS image_generation_status TEXT DEFAULT NULL;'
    });
    
    if (monsterTypesError) {
      console.log('⚠️  Could not add column via RPC, please run this SQL manually:');
      console.log('ALTER TABLE monster_types ADD COLUMN IF NOT EXISTS image_generation_status TEXT DEFAULT NULL;');
    } else {
      console.log('✅ Added image_generation_status to monster_types table');
    }
    
    // Add column to monsters table
    console.log('📝 Adding image_generation_status to monsters table...');
    const { error: monstersError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE monsters ADD COLUMN IF NOT EXISTS image_generation_status TEXT DEFAULT NULL;'
    });
    
    if (monstersError) {
      console.log('⚠️  Could not add column via RPC, please run this SQL manually:');
      console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS image_generation_status TEXT DEFAULT NULL;');
    } else {
      console.log('✅ Added image_generation_status to monsters table');
    }
    
    // Verify the columns were added
    console.log('\n🔍 Verifying table structures...');
    
    const { data: monsterTypesData, error: monsterTypesSelectError } = await supabase
      .from('monster_types')
      .select('*')
      .limit(1);
    
    if (!monsterTypesSelectError && monsterTypesData.length > 0) {
      const hasStatus = 'image_generation_status' in monsterTypesData[0];
      console.log(`monster_types has image_generation_status: ${hasStatus ? '✅ Yes' : '❌ No'}`);
    }
    
    const { data: monstersData, error: monstersSelectError } = await supabase
      .from('monsters')
      .select('*')
      .limit(1);
    
    if (!monstersSelectError && monstersData.length > 0) {
      const hasStatus = 'image_generation_status' in monstersData[0];
      console.log(`monsters has image_generation_status: ${hasStatus ? '✅ Yes' : '❌ No'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addImageGenerationStatusColumns()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 