require('dotenv').config({ path: '../.env.local' });

const fs = require('fs').promises;
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

/**
 * Make a request to Supabase REST API
 */
async function makeSupabaseRequest(endpoint, method = 'GET', data = null) {
  const url = `${supabaseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return { error: error.message };
  }
}

/**
 * Clear the monsters table
 */
async function clearMonstersTable() {
  console.log('🗑️  Clearing monsters table...');
  
  try {
    const result = await makeSupabaseRequest('/rest/v1/monsters', 'DELETE');
    
    if (result.error) {
      console.log('RPC method failed, trying alternative approach...');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('==========================================');
      console.log('DELETE FROM monsters;');
      console.log('==========================================');
      return false;
    }

    console.log('✅ Monsters table cleared successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error clearing monsters table:', error);
    console.log('\n📝 If the automatic clearing failed, please run this SQL manually in your Supabase SQL Editor:');
    console.log('==========================================');
    console.log('DELETE FROM monsters;');
    console.log('==========================================');
    return false;
  }
}

/**
 * Transform monster data for database insertion
 */
function transformMonster(monster) {
  return {
    name: monster.name,
    slug: monster.slug || monster.name?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    size: monster.size,
    type: monster.type,
    subtype: monster.subtype,
    alignment: monster.alignment,
    challenge_rating: monster.challenge_rating,
    armor_class: monster.armor_class,
    armor_desc: monster.armor_desc,
    hit_points: monster.hit_points,
    hit_dice: monster.hit_dice,
    speed: monster.speed,
    strength: monster.strength,
    dexterity: monster.dexterity,
    constitution: monster.constitution,
    intelligence: monster.intelligence,
    wisdom: monster.wisdom,
    charisma: monster.charisma,
    data: monster,
    special_traits: []
  };
}

/**
 * Migrate monsters to database
 */
async function migrateMonsters() {
  console.log('🦖 Migrating monsters to database...');
  
  try {
    // Read the monsters file
    const filePath = path.join('C:/temp/dragon_data/monsters.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const monsters = data.results || data;
    
    console.log(`📊 Total monsters to migrate: ${monsters.length}`);
    
    // Transform monsters
    const transformedMonsters = monsters.map(transformMonster);
    
    // Insert in batches
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < transformedMonsters.length; i += batchSize) {
      const batch = transformedMonsters.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(transformedMonsters.length / batchSize);
      
      console.log(`\n📝 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
      console.log(`   Range: ${i + 1} to ${Math.min(i + batchSize, transformedMonsters.length)}`);
      console.log(`   Sample: ${batch[0].name} to ${batch[batch.length - 1].name}`);
      
      const result = await makeSupabaseRequest('/rest/v1/monsters', 'POST', batch);
      
      if (result.error) {
        console.error(`    ❌ Batch ${batchNumber} error:`, result.error);
        errorCount += batch.length;
      } else {
        console.log(`    ✅ Batch ${batchNumber} inserted successfully`);
        successCount += batch.length;
      }
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Error in migration process:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting monster migration via REST API...\n');
  
  try {
    // Clear the table first
    const cleared = await clearMonstersTable();
    if (!cleared) {
      console.log('⚠️  Proceeding with migration anyway...');
    }
    
    // Migrate monsters
    const success = await migrateMonsters();
    
    if (success) {
      console.log('\n🎉 Monster migration completed successfully!');
    } else {
      console.log('\n❌ Monster migration failed!');
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
} 