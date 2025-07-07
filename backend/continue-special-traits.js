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
 * Continue populating special traits from where we left off
 */
async function continueSpecialTraits() {
  console.log('📝 Continuing special traits extraction from "Dwarf, Firecracker"...\n');
  
  try {
    // Get monsters that don't have special traits yet, ordered by name
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data,special_traits&special_traits=eq.[]&order=name.asc');
    
    if (result.error) {
      console.error('Error fetching monsters:', result.error);
      return;
    }
    
    const monsters = Array.isArray(result) ? result : [];
    console.log(`✅ Found ${monsters.length} monsters remaining to process`);
    
    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;
    
    for (const monster of monsters) {
      try {
        processedCount++;
        
        // Extract description from JSONB data
        const desc = monster.data?.desc || '';
        const traits = parseSpecialTraits(desc);
        
        if (traits.length > 0) {
          console.log(`  📝 ${monster.name}: Found ${traits.length} traits`);
          
          // Update the monster with extracted traits
          const updateResult = await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, 'PATCH', {
            special_traits: traits
          });
          
          if (updateResult.error) {
            console.error(`    ❌ Error updating ${monster.name}:`, updateResult.error);
            errorCount++;
          } else {
            console.log(`    ✅ Updated ${monster.name}`);
            successCount++;
          }
        } else {
          console.log(`  ⚪ ${monster.name}: No traits found`);
        }
        
        // Progress indicator every 50 monsters
        if (processedCount % 50 === 0) {
          console.log(`\n📊 Progress: ${processedCount}/${monsters.length} monsters processed`);
          console.log(`✅ Success: ${successCount}, ❌ Errors: ${errorCount}\n`);
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Special traits extraction completed!`);
    console.log(`📊 Total processed: ${processedCount}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in extraction process:', error);
    throw error;
  }
}

// Run the continuation
continueSpecialTraits()
  .then(() => {
    console.log('\n✨ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 