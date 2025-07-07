// Fix monsters with "False" descriptions using REST API
const https = require('https');

// Load environment variables
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

function makeSupabaseRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}${endpoint}`;
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject({ error: jsonData, statusCode: res.statusCode });
          }
        } catch (error) {
          reject({ error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function fixFalseDescriptions() {
  try {
    console.log('🔍 Finding monsters with "False" descriptions...\n');
    
    // Get monsters with 'False' desc values
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data&data->desc=eq.False');
    
    if (result.error) {
      console.error('❌ Error fetching monsters:', result.error);
      return;
    }
    
    const falseDescMonsters = Array.isArray(result) ? result : [];
    console.log(`⚠️  Found ${falseDescMonsters.length} monsters with 'False' descriptions`);
    
    if (falseDescMonsters.length === 0) {
      console.log('✅ No monsters with "False" descriptions found!');
      return;
    }
    
    console.log('\n📝 Monsters to fix:');
    falseDescMonsters.forEach((monster, index) => {
      console.log(`${index + 1}. ${monster.name} (ID: ${monster.id})`);
    });
    
    // Show details of what would be fixed
    console.log('\n🔧 Would fix the following monsters:');
    
    for (const monster of falseDescMonsters) {
      console.log(`\n📝 ${monster.name}:`);
      console.log(`   - Current desc: "${monster.data?.desc}"`);
      console.log(`   - Would set to: null/empty`);
      
      // Show other available data
      if (monster.data) {
        const availableFields = Object.keys(monster.data).filter(key => 
          monster.data[key] && 
          monster.data[key] !== 'False' && 
          monster.data[key] !== false &&
          typeof monster.data[key] === 'string' &&
          monster.data[key].length > 10
        );
        
        if (availableFields.length > 0) {
          console.log(`   - Available fields: ${availableFields.join(', ')}`);
        }
      }
    }
    
    // Fix all monsters with "False" descriptions
    console.log('\n🔧 Fixing all monsters with "False" descriptions...');
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const monster of falseDescMonsters) {
      try {
        // Update the monster to remove the "False" desc
        const updatedData = { ...monster.data };
        delete updatedData.desc; // Remove the "False" desc
        
        const updateResult = await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ data: updatedData })
        });
        
        if (updateResult.error) {
          console.error(`❌ Error updating ${monster.name}:`, updateResult.error);
          errorCount++;
        } else {
          console.log(`✅ Fixed ${monster.name}`);
          fixedCount++;
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error updating ${monster.name}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Fix completed!');
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check if we should run the fix
const args = process.argv.slice(2);
if (args.includes('fix')) {
  fixFalseDescriptions();
} else {
  console.log('🔍 Use "node scripts/fix-false-desc-rest.js fix" to run the fix');
} 