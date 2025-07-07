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

function cleanDescription(desc) {
  if (!desc) return desc;
  let cleaned = desc;

  // Remove license text
  cleaned = cleaned.replace(/\s*_?\s*Open Game License.*$/i, '');
  cleaned = cleaned.replace(/\s*_?\s*Husks are the opposite of Open Game License.*$/i, '');

  // Remove isolated underscores surrounded by spaces
  cleaned = cleaned.replace(/\s_\s/g, ' ');

  // Remove trailing underscores and formatting artifacts
  cleaned = cleaned.replace(/_+\s*$/g, ''); // Remove trailing underscores at end
  cleaned = cleaned.replace(/\s*_+([A-Z])/g, ' $1'); // Remove underscore before capital letter
  cleaned = cleaned.replace(/^\s*_+\s*/g, ''); // Remove leading underscores

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function cleanFinalDescriptionUnderscores() {
  try {
    console.log('🧹 Cleaning final monsters with underscores in descriptions...\n');
    
    // Get monsters with underscores in descriptions
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    
    const monstersWithUnderscores = monsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    
    console.log(`📊 Found ${monstersWithUnderscores.length} monsters with underscores in descriptions\n`);
    
    if (monstersWithUnderscores.length === 0) {
      console.log('✅ No monsters with underscores in descriptions found!\n');
      return;
    }
    
    let updated = 0;
    
    for (const monster of monstersWithUnderscores) {
      try {
        const originalDesc = monster.data.desc;
        const cleanedDesc = cleanDescription(originalDesc);
        
        if (cleanedDesc !== originalDesc) {
          console.log(`🧹 Cleaning ${monster.name}:`);
          console.log(`   Before: "${originalDesc}"`);
          console.log(`   After:  "${cleanedDesc}"`);
          console.log('');
          
          // Update the monster
          const updateData = {
            ...monster.data,
            desc: cleanedDesc,
            has_underscores: cleanedDesc.includes('_')
          };
          
          await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ data: updateData })
          });
          
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating monster ${monster.name}:`, error);
      }
    }
    
    console.log(`🎉 Completed! Updated ${updated} monsters\n`);
    
    // Verify the cleanup
    const remainingMonsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    const remainingWithUnderscores = remainingMonsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    
    console.log(`📊 Remaining monsters with underscores in descriptions: ${remainingWithUnderscores.length}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanFinalDescriptionUnderscores(); 