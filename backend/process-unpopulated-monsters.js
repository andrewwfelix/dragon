const path = require('path');

// Simple environment variable loading
const fs = require('fs');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Simple HTTP client for Supabase
const https = require('https');

function makeSupabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ data: body, error: null });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Parse description to extract special traits
 */
function parseSpecialTraits(desc) {
  if (!desc) return [];
  
  const traits = [];
  
  // Split the description by ** markers
  const parts = desc.split(/\*\*/);
  
  // Look for trait patterns: part[i] = trait name, part[i+1] = description
  for (let i = 1; i < parts.length - 1; i += 2) {
    const traitName = parts[i].trim();
    const traitDesc = parts[i + 1].trim();
    
    // Extract trait name (remove the trailing period)
    const nameMatch = traitName.match(/^([^.]+)\./);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const description = traitDesc;
      
      traits.push({
        name: name,
        description: description
      });
    }
  }
  
  return traits;
}

/**
 * Process unpopulated monsters
 */
async function processUnpopulatedMonsters() {
  console.log('📝 Processing unpopulated monsters for special traits...\n');
  
  try {
    // Get monsters that haven't been processed yet
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data,special_traits,attributes_populated&attributes_populated=eq.false&order=name.asc');
    
    if (result.error) {
      console.error('Error fetching monsters:', result.error);
      return;
    }
    
    const monsters = Array.isArray(result) ? result : [];
    console.log(`✅ Found ${monsters.length} unpopulated monsters to process`);
    
    if (monsters.length === 0) {
      console.log('🎉 All monsters have been processed!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    let traitsFoundCount = 0;
    
    for (const monster of monsters) {
      try {
        processedCount++;
        
        // Extract description from JSONB data
        const desc = monster.data?.desc || '';
        const traits = parseSpecialTraits(desc);
        
        // Prepare update data
        const updateData = {
          attributes_populated: true
        };
        
        if (traits.length > 0) {
          updateData.special_traits = traits;
          traitsFoundCount++;
          console.log(`  📝 ${monster.name}: Found ${traits.length} traits`);
        } else {
          console.log(`  ⚪ ${monster.name}: No traits found`);
        }
        
        // Update the monster
        const updateResult = await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, 'PATCH', updateData);
        
        if (updateResult.error) {
          console.error(`    ❌ Error updating ${monster.name}:`, updateResult.error);
          errorCount++;
        } else {
          console.log(`    ✅ Updated ${monster.name}`);
          successCount++;
        }
        
        // Progress indicator every 50 monsters
        if (processedCount % 50 === 0) {
          console.log(`\n📊 Progress: ${processedCount}/${monsters.length} monsters processed`);
          console.log(`✅ Success: ${successCount}, ❌ Errors: ${errorCount}, 📝 Traits found: ${traitsFoundCount}\n`);
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Processing completed!`);
    console.log(`📊 Total processed: ${processedCount}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Monsters with traits: ${traitsFoundCount}`);
    
  } catch (error) {
    console.error('❌ Error in processing:', error);
    throw error;
  }
}

/**
 * Show current status
 */
async function showStatus() {
  console.log('📊 Current processing status...\n');
  
  try {
    // Get total count
    const totalResult = await makeSupabaseRequest('/rest/v1/monsters?select=count');
    const total = totalResult[0]?.count || 0;
    
    // Get count of populated monsters
    const populatedResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.true');
    const populated = populatedResult[0]?.count || 0;
    
    // Get count of unpopulated monsters
    const unpopulatedResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.false');
    const unpopulated = unpopulatedResult[0]?.count || 0;
    
    // Get count of monsters with special traits
    const withTraitsResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&special_traits=neq.[]');
    const withTraits = withTraitsResult[0]?.count || 0;
    
    console.log(`📊 Total monsters: ${total}`);
    console.log(`✅ Populated: ${populated}`);
    console.log(`⏳ Unpopulated: ${unpopulated}`);
    console.log(`📝 With special traits: ${withTraits}`);
    
    if (unpopulated > 0) {
      // Show sample of unpopulated monsters
      const sampleUnpopulated = await makeSupabaseRequest('/rest/v1/monsters?select=name&attributes_populated=eq.false&order=name.asc&limit=10');
      console.log('\n⏳ Sample unpopulated monsters:');
      if (Array.isArray(sampleUnpopulated)) {
        sampleUnpopulated.forEach(monster => {
          console.log(`  ⚪ ${monster.name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'process':
      await processUnpopulatedMonsters();
      break;
      
    case 'status':
      await showStatus();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node process-unpopulated-monsters.js process');
      console.log('  node process-unpopulated-monsters.js status');
      console.log('');
      console.log('Examples:');
      console.log('  node process-unpopulated-monsters.js status');
      console.log('  node process-unpopulated-monsters.js process');
      break;
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