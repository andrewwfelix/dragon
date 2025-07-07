require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMonsterTypesTable() {
  console.log('🔍 Checking monster_types table...\n');
  
  try {
    // First, let's see if the table exists and get all data
    const { data, error } = await supabase
      .from('monster_types')
      .select('*');
    
    if (error) {
      console.error('❌ Error accessing monster_types table:', error);
      return;
    }
    
    console.log(`✅ Found ${data.length} records in monster_types table`);
    
    if (data.length > 0) {
      console.log('\n📋 Table structure (from first record):');
      console.log('Columns:', Object.keys(data[0]));
      
      console.log('\n📊 Sample data:');
      data.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`, record);
      });
    } else {
      console.log('\n⚠️  Table is empty!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMonsterTypesTable()
  .then(() => {
    console.log('\n✨ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  }); 