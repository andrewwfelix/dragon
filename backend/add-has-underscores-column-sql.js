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

async function addHasUnderscoresColumn() {
  try {
    console.log('🔧 Adding has_underscores column to monsters table...\n');
    
    // First, let's check if the column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'monsters' AND column_name = 'has_underscores';
    `;
    
    console.log('📋 Checking if column already exists...');
    
    // Since we can't use exec_sql, let's try a different approach
    // We'll use the REST API to update records and add the column through data manipulation
    
    // Get all monsters first
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    
    console.log(`📊 Found ${monsters.length} monsters to process\n`);
    
    // Process monsters in batches to add has_underscores field
    const batchSize = 100;
    let processed = 0;
    let updated = 0;
    
    for (let i = 0; i < monsters.length; i += batchSize) {
      const batch = monsters.slice(i, i + batchSize);
      
      for (const monster of batch) {
        try {
          const hasUnderscores = monster.data?.desc && monster.data.desc.includes('_');
          
          // Update the monster with has_underscores field
          const updateData = {
            ...monster.data,
            has_underscores: hasUnderscores
          };
          
          await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ data: updateData })
          });
          
          updated++;
        } catch (error) {
          console.error(`❌ Error updating monster ${monster.id}:`, error);
        }
      }
      
      processed += batch.length;
      console.log(`✅ Processed ${processed}/${monsters.length} monsters (${updated} updated with has_underscores)`);
    }
    
    console.log(`\n🎉 Completed! Updated ${updated} monsters with has_underscores field\n`);
    
    // Get count of monsters with underscores
    const monstersWithUnderscores = monsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    
    console.log(`📊 Found ${monstersWithUnderscores.length} monsters with underscores in descriptions\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addHasUnderscoresColumn(); 