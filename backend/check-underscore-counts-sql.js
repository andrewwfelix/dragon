const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend\.env
const envPath = path.join(__dirname, '..', 'backend', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure backend\\.env contains SUPABASE_URL and SUPABASE_ANON_KEY');
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
      res.on('data', (chunk) => { data += chunk; });
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
    req.on('error', (error) => { reject(error); });
    if (options.body) { req.write(options.body); }
    req.end();
  });
}

async function checkUnderscoreCounts() {
  try {
    console.log('🔍 Running PostgreSQL queries to check underscore counts...\n');
    
    // Get all monsters to analyze
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    
    console.log(`📊 Total monsters in database: ${monsters.length}\n`);
    
    // Count monsters with underscores in descriptions
    const monstersWithDescUnderscores = monsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    
    console.log(`📝 Monsters with underscores in descriptions: ${monstersWithDescUnderscores.length}`);
    
    // Count monsters with underscores in any field
    const monstersWithAnyUnderscores = monsters.filter(monster => {
      const data = monster.data;
      if (!data) return false;
      
      const dataStr = JSON.stringify(data);
      return dataStr.includes('_');
    });
    
    console.log(`🔍 Monsters with underscores in any field: ${monstersWithAnyUnderscores.length}`);
    
    // Count underscores in specific fields
    let descUnderscoreCount = 0;
    let actionUnderscoreCount = 0;
    let legendaryActionUnderscoreCount = 0;
    let specialAbilityUnderscoreCount = 0;
    
    monsters.forEach(monster => {
      const data = monster.data;
      if (!data) return;
      
      if (data.desc && data.desc.includes('_')) {
        descUnderscoreCount++;
      }
      
      if (data.actions && JSON.stringify(data.actions).includes('_')) {
        actionUnderscoreCount++;
      }
      
      if (data.legendary_actions && JSON.stringify(data.legendary_actions).includes('_')) {
        legendaryActionUnderscoreCount++;
      }
      
      if (data.special_abilities && JSON.stringify(data.special_abilities).includes('_')) {
        specialAbilityUnderscoreCount++;
      }
    });
    
    console.log('\n📊 Underscore counts by field:');
    console.log(`   Descriptions: ${descUnderscoreCount}`);
    console.log(`   Actions: ${actionUnderscoreCount}`);
    console.log(`   Legendary Actions: ${legendaryActionUnderscoreCount}`);
    console.log(`   Special Abilities: ${specialAbilityUnderscoreCount}`);
    
    // Show sample monsters with underscores in descriptions
    if (monstersWithDescUnderscores.length > 0) {
      console.log('\n📝 Sample monsters with underscores in descriptions:');
      console.log('─'.repeat(80));
      
      monstersWithDescUnderscores.slice(0, 5).forEach((monster, index) => {
        console.log(`${index + 1}. ${monster.name}:`);
        console.log(`   "${monster.data.desc}"`);
        console.log('');
      });
    }
    
    // Check for specific patterns
    let licenseTextCount = 0;
    let trailingUnderscoreCount = 0;
    
    monsters.forEach(monster => {
      const desc = monster.data?.desc;
      if (!desc) return;
      
      if (desc.includes('Open Game License')) {
        licenseTextCount++;
      }
      
      if (desc.match(/_+\s*$/)) {
        trailingUnderscoreCount++;
      }
    });
    
    console.log('\n🔍 Pattern analysis:');
    console.log(`   Monsters with license text: ${licenseTextCount}`);
    console.log(`   Monsters with trailing underscores: ${trailingUnderscoreCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUnderscoreCounts(); 