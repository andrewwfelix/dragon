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

function analyzeUnderscoresInField(fieldValue, fieldName) {
  if (!fieldValue) return { hasUnderscores: false, count: 0, samples: [] };
  
  const fieldStr = typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue);
  const hasUnderscores = fieldStr.includes('_');
  
  if (!hasUnderscores) return { hasUnderscores: false, count: 0, samples: [] };
  
  // Count underscores
  const underscoreCount = (fieldStr.match(/_/g) || []).length;
  
  // Find sample positions
  const samples = [];
  let pos = fieldStr.indexOf('_');
  let sampleCount = 0;
  
  while (pos !== -1 && sampleCount < 3) {
    const start = Math.max(0, pos - 20);
    const end = Math.min(fieldStr.length, pos + 20);
    const context = fieldStr.substring(start, end);
    samples.push({
      position: pos,
      context: context.replace(/\n/g, ' ').replace(/\s+/g, ' ')
    });
    pos = fieldStr.indexOf('_', pos + 1);
    sampleCount++;
  }
  
  return { hasUnderscores: true, count: underscoreCount, samples };
}

async function detailedUnderscoreAnalysis() {
  try {
    console.log('🔍 Detailed underscore analysis...\n');
    
    const allMonsters = await getAllMonsters();
    console.log(`📊 Total monsters: ${allMonsters.length}\n`);
    
    // Detailed analysis by field
    const fieldAnalysis = {
      desc: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] },
      actions: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] },
      legendary_actions: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] },
      special_abilities: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] },
      name: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] },
      slug: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] },
      other: { total: 0, withUnderscores: 0, totalUnderscores: 0, samples: [] }
    };
    
    // Track monsters with underscores in any field
    const monstersWithAnyUnderscores = [];
    
    allMonsters.forEach((monster, index) => {
      const data = monster.data;
      if (!data) return;
      
      let monsterHasAnyUnderscores = false;
      
      // Analyze each field
      Object.keys(data).forEach(fieldName => {
        const fieldValue = data[fieldName];
        const analysis = analyzeUnderscoresInField(fieldValue, fieldName);
        
        if (analysis.hasUnderscores) {
          monsterHasAnyUnderscores = true;
          
          // Categorize by field type
          if (fieldName === 'desc') {
            fieldAnalysis.desc.total++;
            fieldAnalysis.desc.withUnderscores++;
            fieldAnalysis.desc.totalUnderscores += analysis.count;
            if (fieldAnalysis.desc.samples.length < 5) {
              fieldAnalysis.desc.samples.push({
                monster: monster.name,
                samples: analysis.samples
              });
            }
          } else if (fieldName === 'actions') {
            fieldAnalysis.actions.total++;
            fieldAnalysis.actions.withUnderscores++;
            fieldAnalysis.actions.totalUnderscores += analysis.count;
            if (fieldAnalysis.actions.samples.length < 5) {
              fieldAnalysis.actions.samples.push({
                monster: monster.name,
                samples: analysis.samples
              });
            }
          } else if (fieldName === 'legendary_actions') {
            fieldAnalysis.legendary_actions.total++;
            fieldAnalysis.legendary_actions.withUnderscores++;
            fieldAnalysis.legendary_actions.totalUnderscores += analysis.count;
            if (fieldAnalysis.legendary_actions.samples.length < 5) {
              fieldAnalysis.legendary_actions.samples.push({
                monster: monster.name,
                samples: analysis.samples
              });
            }
          } else if (fieldName === 'special_abilities') {
            fieldAnalysis.special_abilities.total++;
            fieldAnalysis.special_abilities.withUnderscores++;
            fieldAnalysis.special_abilities.totalUnderscores += analysis.count;
            if (fieldAnalysis.special_abilities.samples.length < 5) {
              fieldAnalysis.special_abilities.samples.push({
                monster: monster.name,
                samples: analysis.samples
              });
            }
          } else if (fieldName === 'name') {
            fieldAnalysis.name.total++;
            fieldAnalysis.name.withUnderscores++;
            fieldAnalysis.name.totalUnderscores += analysis.count;
            if (fieldAnalysis.name.samples.length < 5) {
              fieldAnalysis.name.samples.push({
                monster: monster.name,
                samples: analysis.samples
              });
            }
          } else if (fieldName === 'slug') {
            fieldAnalysis.slug.total++;
            fieldAnalysis.slug.withUnderscores++;
            fieldAnalysis.slug.totalUnderscores += analysis.count;
            if (fieldAnalysis.slug.samples.length < 5) {
              fieldAnalysis.slug.samples.push({
                monster: monster.name,
                samples: analysis.samples
              });
            }
          } else {
            fieldAnalysis.other.total++;
            fieldAnalysis.other.withUnderscores++;
            fieldAnalysis.other.totalUnderscores += analysis.count;
            if (fieldAnalysis.other.samples.length < 5) {
              fieldAnalysis.other.samples.push({
                monster: monster.name,
                field: fieldName,
                samples: analysis.samples
              });
            }
          }
        }
      });
      
      if (monsterHasAnyUnderscores) {
        monstersWithAnyUnderscores.push(monster.name);
      }
    });
    
    // Print detailed results
    console.log('📊 DETAILED UNDERSCORE ANALYSIS BY FIELD:\n');
    console.log('─'.repeat(80));
    
    Object.entries(fieldAnalysis).forEach(([fieldName, analysis]) => {
      if (analysis.withUnderscores > 0) {
        console.log(`\n🔍 ${fieldName.toUpperCase()}:`);
        console.log(`   Monsters with underscores: ${analysis.withUnderscores}`);
        console.log(`   Total underscores found: ${analysis.totalUnderscores}`);
        console.log(`   Average underscores per monster: ${(analysis.totalUnderscores / analysis.withUnderscores).toFixed(2)}`);
        
        if (analysis.samples.length > 0) {
          console.log(`   Sample underscores:`);
          analysis.samples.forEach((sample, idx) => {
            console.log(`     ${idx + 1}. ${sample.monster}:`);
            sample.samples.forEach(s => {
              console.log(`        "${s.context}"`);
            });
          });
        }
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total monsters: ${allMonsters.length}`);
    console.log(`   Monsters with underscores in any field: ${monstersWithAnyUnderscores.length}`);
    console.log(`   Monsters with underscores in descriptions: ${fieldAnalysis.desc.withUnderscores}`);
    
    // Show some specific patterns
    console.log('\n🔍 COMMON PATTERNS:');
    const descMonsters = allMonsters.filter(m => m.data?.desc && m.data.desc.includes('_'));
    
    let licenseCount = 0;
    let trailingUnderscoreCount = 0;
    let actionFormatCount = 0;
    
    descMonsters.forEach(monster => {
      const desc = monster.data.desc;
      if (desc.includes('Open Game License')) licenseCount++;
      if (desc.match(/_+\s*$/)) trailingUnderscoreCount++;
      if (desc.includes('_Melee Weapon Attack:_') || desc.includes('_Ranged Weapon Attack:_')) actionFormatCount++;
    });
    
    console.log(`   Descriptions with license text: ${licenseCount}`);
    console.log(`   Descriptions with trailing underscores: ${trailingUnderscoreCount}`);
    console.log(`   Descriptions with action formatting: ${actionFormatCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

detailedUnderscoreAnalysis(); 