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
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please check your .env.local file');
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
  
  console.log('Parsing description:', desc.substring(0, 200) + '...');
  
  const traits = [];
  
  // Split the description by ** markers
  const parts = desc.split(/\*\*/);
  console.log('Split into', parts.length, 'parts');
  
  // Look for trait patterns: part[i] = trait name, part[i+1] = description
  for (let i = 1; i < parts.length - 1; i += 2) {
    const traitName = parts[i].trim();
    const traitDesc = parts[i + 1].trim();
    
    // Extract trait name (remove the trailing period)
    const nameMatch = traitName.match(/^([^.]+)\./);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const description = traitDesc;
      
      console.log('Found trait:', name, '->', description.substring(0, 50) + '...');
      
      traits.push({
        name: name,
        description: description
      });
    }
  }
  
  console.log('Total traits found:', traits.length);
  return traits;
}

/**
 * Add special_traits column to monsters table
 */
async function addSpecialTraitsColumn() {
  console.log('🦖 Adding special_traits column to monsters table...');
  
  try {
    // Use RPC to add column
    const result = await makeSupabaseRequest('/rest/v1/rpc/exec_sql', 'POST', {
      sql: `ALTER TABLE monsters ADD COLUMN IF NOT EXISTS special_traits JSONB DEFAULT '[]'::jsonb;`
    });

    if (result.error) {
      console.log('RPC method failed, trying alternative approach...');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('==========================================');
      console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS special_traits JSONB DEFAULT \'[]\'::jsonb;');
      console.log('==========================================');
      return false;
    }

    console.log('✅ special_traits column added successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error adding special_traits column:', error);
    console.log('\n📝 If the automatic migration failed, please run this SQL manually in your Supabase SQL Editor:');
    console.log('==========================================');
    console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS special_traits JSONB DEFAULT \'[]\'::jsonb;');
    console.log('==========================================');
    return false;
  }
}

/**
 * Extract and populate special traits for all monsters
 */
async function populateSpecialTraits() {
  console.log('📝 Extracting special traits from monster descriptions...');
  
  try {
    // Fetch all monsters with descriptions
    console.log('Fetching monsters from:', `${supabaseUrl}/rest/v1/monsters?select=id,name,data,special_traits`);
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data,special_traits');
    
    console.log('Raw API response:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error('Error fetching monsters:', result.error);
      return;
    }
    
    // The API returns the monsters directly as an array, not nested under 'data'
    const monsters = Array.isArray(result) ? result : [];
    console.log(`✅ Found ${monsters.length} monsters to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const monster of monsters) {
      try {
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
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Special traits extraction completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in extraction process:', error);
    throw error;
  }
}

/**
 * Test function to show example trait extraction
 */
function testTraitExtraction() {
  console.log('🧪 Testing special trait extraction...\n');
  
  const testDescriptions = [
    'A cloud of unconnected, flat gray triangles in the vague shape of a mantis flickers unpredictably from one position to another, clicking softly as its arm blades swing outward. Akaasits are constructed beings from a plane destroyed by a catastrophic misuse of time magic. **Mindless.** The akaasit has no mind, at least as understood by denizens of the Material Plane, and its motives are inscrutable. **Unknown Origin.** The home of the akaasit is unknown, but they are often encountered in areas touched or altered by time magic.',
    'A massive dragon with scales that shimmer like polished bronze. **Amphibious.** The dragon can breathe air and water.',
    'A simple creature with no special traits.'
  ];
  
  testDescriptions.forEach((desc, index) => {
    console.log(`Test ${index + 1}:`);
    console.log(`Description: ${desc.substring(0, 100)}...`);
    console.log(`Full description length: ${desc.length}`);
    console.log(`Contains ** markers: ${desc.includes('**')}`);
    const traits = parseSpecialTraits(desc);
    console.log(`Extracted traits:`, traits);
    console.log('');
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      testTraitExtraction();
      break;
      
    case 'add-column':
      await addSpecialTraitsColumn();
      break;
      
    case 'populate':
      await populateSpecialTraits();
      break;
      
    case 'full':
      console.log('🚀 Running full special traits migration...\n');
      const columnAdded = await addSpecialTraitsColumn();
      if (columnAdded) {
        await populateSpecialTraits();
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node add-special-traits-column-simple.js test');
      console.log('  node add-special-traits-column-simple.js add-column');
      console.log('  node add-special-traits-column-simple.js populate');
      console.log('  node add-special-traits-column-simple.js full');
      console.log('');
      console.log('Examples:');
      console.log('  node add-special-traits-column-simple.js test');
      console.log('  node add-special-traits-column-simple.js full');
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