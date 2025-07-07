const fs = require('fs').promises;
const path = require('path');

// Read environment variables from .env.local
async function loadEnvVars() {
  try {
    const envContent = await fs.readFile('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        // Remove quotes from the value
        const cleanValue = value.trim().replace(/^["']|["']$/g, '');
        envVars[key.trim()] = cleanValue;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    process.exit(1);
  }
}

/**
 * Make a request to Supabase REST API
 */
async function makeSupabaseRequest(supabaseUrl, supabaseKey, endpoint, method = 'GET', data = null) {
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
    console.log(`   Making ${method} request to: ${url}`);
    const response = await fetch(url, options);
    
    console.log(`   Response status: ${response.status} ${response.statusText}`);
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   HTTP ${response.status}: ${errorText}`);
      return { error: `HTTP ${response.status}: ${errorText}` };
    }
    
    // Check if response has content
    const responseText = await response.text();
    console.log(`   Response length: ${responseText.length} characters`);
    if (!responseText) {
      return { error: 'Empty response from server' };
    }
    
    // Try to parse JSON
    try {
      const result = JSON.parse(responseText);
      return result;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText.substring(0, 200) + '...');
      return { error: `JSON parse error: ${parseError.message}` };
    }
  } catch (error) {
    console.error('API request failed:', error);
    return { error: error.message };
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
 * Main migration function
 */
async function migrateMonsters() {
  console.log('🚀 Starting simple monster migration...\n');
  
  try {
    // Load environment variables
    const envVars = await loadEnvVars();
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      process.exit(1);
    }
    
    console.log('✅ Environment variables loaded');
    
    // Read the monsters file
    const filePath = path.join('C:/temp/dragon_data/monsters.json');
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const monsters = data.results || data;
    
    console.log(`📊 Total monsters to migrate: ${monsters.length}`);
    
    // Transform monsters
    const transformedMonsters = monsters.map(transformMonster);
    
    // Insert in batches
    const batchSize = 50; // Smaller batches to avoid timeouts
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < transformedMonsters.length; i += batchSize) {
      const batch = transformedMonsters.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(transformedMonsters.length / batchSize);
      
      console.log(`\n📝 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
      console.log(`   Range: ${i + 1} to ${Math.min(i + batchSize, transformedMonsters.length)}`);
      console.log(`   Sample: ${batch[0].name} to ${batch[batch.length - 1].name}`);
      
      const result = await makeSupabaseRequest(supabaseUrl, supabaseKey, '/rest/v1/monsters', 'POST', batch);
      
      if (result.error) {
        console.error(`    ❌ Batch ${batchNumber} error:`, result.error);
        errorCount += batch.length;
      } else {
        console.log(`    ✅ Batch ${batchNumber} inserted successfully`);
        successCount += batch.length;
      }
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Monster migration completed successfully!');
      console.log(`📊 Total monsters in database: ${successCount}`);
    } else {
      console.log('\n❌ Monster migration failed!');
    }
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateMonsters()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 