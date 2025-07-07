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

async function showRemainingUnderscoreDescriptions() {
  try {
    console.log('🔍 Fetching monsters with underscores in descriptions...\n');
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    const monstersWithUnderscores = monsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    if (monstersWithUnderscores.length === 0) {
      console.log('✅ No monsters with underscores in descriptions!');
      return;
    }
    monstersWithUnderscores.forEach((monster, idx) => {
      console.log(`#${idx + 1}: ${monster.name}`);
      console.log(`ID: ${monster.id}`);
      console.log('Description:');
      console.log(monster.data.desc);
      console.log('─'.repeat(80));
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

showRemainingUnderscoreDescriptions(); 