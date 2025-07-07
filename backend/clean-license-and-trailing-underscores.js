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
    
    if (monsters.length < limit) {
      break;
    }
    
    offset += limit;
  }
  
  return allMonsters;
}

function cleanDescription(desc) {
  if (!desc) return desc;
  
  let cleaned = desc;
  
  // Remove license text and related content
  cleaned = cleaned.replace(/\s*_?\s*Open Game License.*$/i, '');
  cleaned = cleaned.replace(/\s*_?\s*Husks are the opposite of Open Game License.*$/i, '');
  cleaned = cleaned.replace(/\s*_?\s*similar in nature to most Open Game License.*$/i, '');
  cleaned = cleaned.replace(/\s*_?\s*arctic relatives to Open Game License.*$/i, '');
  cleaned = cleaned.replace(/\s*_?\s*All steel and spring.*$/i, '');
  
  // Remove trailing underscores and formatting artifacts
  cleaned = cleaned.replace(/_+\s*$/g, ''); // Remove trailing underscores at end
  cleaned = cleaned.replace(/\s*_+([A-Z])/g, ' $1'); // Remove underscore before capital letter
  cleaned = cleaned.replace(/^\s*_+\s*/g, ''); // Remove leading underscores
  cleaned = cleaned.replace(/\s_\s/g, ' '); // Remove isolated underscores
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

async function cleanLicenseAndTrailingUnderscores() {
  try {
    console.log('🧹 Cleaning descriptions with license text and trailing underscores...\n');
    
    const allMonsters = await getAllMonsters();
    console.log(`📊 Total monsters: ${allMonsters.length}\n`);
    
    // Find monsters that need cleaning
    const monstersToClean = allMonsters.filter(monster => {
      const desc = monster.data?.desc;
      if (!desc) return false;
      
      return desc.includes('Open Game License') || 
             desc.match(/_+\s*$/) ||
             desc.includes('_') && (desc.includes('Husks are the opposite') || 
                                   desc.includes('similar in nature to most') ||
                                   desc.includes('arctic relatives to') ||
                                   desc.includes('All steel and spring'));
    });
    
    console.log(`📝 Found ${monstersToClean.length} monsters that need cleaning\n`);
    
    if (monstersToClean.length === 0) {
      console.log('✅ No monsters need cleaning!\n');
      return;
    }
    
    let updated = 0;
    let licenseCleaned = 0;
    let trailingCleaned = 0;
    
    for (const monster of monstersToClean) {
      try {
        const originalDesc = monster.data.desc;
        const cleanedDesc = cleanDescription(originalDesc);
        
        if (cleanedDesc !== originalDesc) {
          const hadLicense = originalDesc.includes('Open Game License');
          const hadTrailing = originalDesc.match(/_+\s*$/);
          
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
          if (hadLicense) licenseCleaned++;
          if (hadTrailing) trailingCleaned++;
        }
      } catch (error) {
        console.error(`❌ Error updating monster ${monster.name}:`, error);
      }
    }
    
    console.log(`🎉 Cleaning completed!`);
    console.log(`   Total updated: ${updated}`);
    console.log(`   License text cleaned: ${licenseCleaned}`);
    console.log(`   Trailing underscores cleaned: ${trailingCleaned}\n`);
    
    // Verify the cleanup
    const remainingMonsters = await getAllMonsters();
    const remainingWithLicense = remainingMonsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('Open Game License')
    );
    const remainingWithTrailing = remainingMonsters.filter(monster => 
      monster.data?.desc && monster.data.desc.match(/_+\s*$/)
    );
    
    console.log(`📊 Verification:`);
    console.log(`   Remaining with license text: ${remainingWithLicense.length}`);
    console.log(`   Remaining with trailing underscores: ${remainingWithTrailing.length}`);
    
    if (remainingWithLicense.length > 0 || remainingWithTrailing.length > 0) {
      console.log('\n📝 Remaining issues:');
      if (remainingWithLicense.length > 0) {
        console.log('   Monsters with license text:');
        remainingWithLicense.slice(0, 3).forEach(monster => {
          console.log(`     - ${monster.name}: "${monster.data.desc}"`);
        });
      }
      if (remainingWithTrailing.length > 0) {
        console.log('   Monsters with trailing underscores:');
        remainingWithTrailing.slice(0, 3).forEach(monster => {
          console.log(`     - ${monster.name}: "${monster.data.desc}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanLicenseAndTrailingUnderscores(); 