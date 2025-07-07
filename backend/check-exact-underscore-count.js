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

async function getAllMonsters() {
  const allMonsters = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const endpoint = `/rest/v1/monsters?select=id,name,data&limit=${limit}&offset=${offset}`;
    const monsters = await makeSupabaseRequest(endpoint);
    
    if (!Array.isArray(monsters) || monsters.length === 0) {
      break;
    }
    
    allMonsters.push(...monsters);
    console.log(`📥 Fetched ${monsters.length} monsters (offset: ${offset})`);
    
    if (monsters.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  return allMonsters;
}

async function checkExactUnderscoreCount() {
  try {
    console.log('🔍 Getting exact underscore count with pagination...\n');
    
    const allMonsters = await getAllMonsters();
    console.log(`\n📊 Total monsters fetched: ${allMonsters.length}\n`);
    
    // Count monsters with underscores in descriptions
    const monstersWithDescUnderscores = allMonsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    
    console.log(`📝 Monsters with underscores in descriptions: ${monstersWithDescUnderscores.length}`);
    
    // Count monsters with underscores in any field
    const monstersWithAnyUnderscores = allMonsters.filter(monster => {
      const data = monster.data;
      if (!data) return false;
      
      const dataStr = JSON.stringify(data);
      return dataStr.includes('_');
    });
    
    console.log(`🔍 Monsters with underscores in any field: ${monstersWithAnyUnderscores.length}`);
    
    // Show first few monsters with underscores in descriptions
    if (monstersWithDescUnderscores.length > 0) {
      console.log('\n📝 First 5 monsters with underscores in descriptions:');
      console.log('─'.repeat(80));
      
      monstersWithDescUnderscores.slice(0, 5).forEach((monster, index) => {
        console.log(`${index + 1}. ${monster.name}:`);
        console.log(`   "${monster.data.desc}"`);
        console.log('');
      });
    }
    
    // Count by field
    let descCount = 0;
    let actionCount = 0;
    let legendaryCount = 0;
    let specialCount = 0;
    
    allMonsters.forEach(monster => {
      const data = monster.data;
      if (!data) return;
      
      if (data.desc && data.desc.includes('_')) descCount++;
      if (data.actions && JSON.stringify(data.actions).includes('_')) actionCount++;
      if (data.legendary_actions && JSON.stringify(data.legendary_actions).includes('_')) legendaryCount++;
      if (data.special_abilities && JSON.stringify(data.special_abilities).includes('_')) specialCount++;
    });
    
    console.log('\n📊 Underscore counts by field:');
    console.log(`   Descriptions: ${descCount}`);
    console.log(`   Actions: ${actionCount}`);
    console.log(`   Legendary Actions: ${legendaryCount}`);
    console.log(`   Special Abilities: ${specialCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExactUnderscoreCount(); 