require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get distinct monster types from the monsters table
 */
async function getDistinctMonsterTypes() {
  console.log('📡 Fetching distinct monster types from monsters table...');
  
  try {
    // Get all monsters and extract their types
    const { data: monsters, error } = await supabase
      .from('monsters')
      .select('data');
    
    if (error) throw error;
    
    // Extract unique types
    const types = new Set();
    monsters.forEach(monster => {
      if (monster.data && monster.data.type) {
        types.add(monster.data.type.toLowerCase());
      }
    });
    
    const uniqueTypes = Array.from(types).sort();
    console.log(`✅ Found ${uniqueTypes.length} unique monster types`);
    console.log('Types:', uniqueTypes);
    
    return uniqueTypes;
  } catch (error) {
    console.error('Error fetching monster types:', error);
    throw error;
  }
}

/**
 * Insert monster types into the monster_types table
 */
async function insertMonsterTypes(types) {
  console.log('\n📝 Inserting monster types into database...');
  
  try {
    const typeRecords = types.map(type => ({
      type_name: type
    }));
    
    const { data, error } = await supabase
      .from('monster_types')
      .insert(typeRecords)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ Successfully inserted ${data.length} monster types`);
    return data;
  } catch (error) {
    console.error('Error inserting monster types:', error);
    throw error;
  }
}

/**
 * Main function to populate monster types
 */
async function populateMonsterTypes() {
  console.log('🗂️  Starting monster types population...\n');
  
  try {
    // Get distinct types
    const types = await getDistinctMonsterTypes();
    
    if (types.length === 0) {
      console.log('⚠️  No monster types found!');
      return;
    }
    
    // Insert into database
    await insertMonsterTypes(types);
    
    console.log('\n🎉 Monster types population completed!');
    
  } catch (error) {
    console.error('❌ Error in population process:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  populateMonsterTypes()
    .then(() => {
      console.log('\n✨ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  populateMonsterTypes,
  getDistinctMonsterTypes
}; 