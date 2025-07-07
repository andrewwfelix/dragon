const https = require('https');

// Load environment variables
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/"/g, '');

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

function findUnderscoresInText(text, context = '') {
  if (!text || typeof text !== 'string') return [];
  const matches = [];
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('_')) {
      matches.push({
        line: index + 1,
        text: line.trim(),
        context
      });
    }
  });
  return matches;
}

async function checkUnderscores() {
  try {
    console.log('🔍 Fetching all monsters to search for underscores...\n');
    
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    
    console.log(`📊 Analyzing ${monsters.length} monsters for underscores...\n`);
    
    const results = {
      descriptions: [],
      actions: [],
      legendaryActions: [],
      specialAbilities: [],
      other: []
    };
    
    monsters.forEach(monster => {
      const data = monster.data || {};
      
      // Check descriptions
      if (data.desc && data.desc.includes('_')) {
        results.descriptions.push({
          name: monster.name,
          field: 'desc',
          text: data.desc.substring(0, 150) + '...'
        });
      }
      
      // Check actions
      if (Array.isArray(data.actions)) {
        data.actions.forEach((action, index) => {
          if (action.desc && action.desc.includes('_')) {
            results.actions.push({
              name: monster.name,
              field: `actions[${index}].desc`,
              actionName: action.name,
              text: action.desc.substring(0, 150) + '...'
            });
          }
        });
      }
      
      // Check legendary actions
      if (Array.isArray(data.legendary_actions)) {
        data.legendary_actions.forEach((action, index) => {
          if (action.desc && action.desc.includes('_')) {
            results.legendaryActions.push({
              name: monster.name,
              field: `legendary_actions[${index}].desc`,
              actionName: action.name,
              text: action.desc.substring(0, 150) + '...'
            });
          }
        });
      }
      
      // Check special abilities
      if (Array.isArray(data.special_abilities)) {
        data.special_abilities.forEach((ability, index) => {
          if (ability.desc && ability.desc.includes('_')) {
            results.specialAbilities.push({
              name: monster.name,
              field: `special_abilities[${index}].desc`,
              abilityName: ability.name,
              text: ability.desc.substring(0, 150) + '...'
            });
          }
        });
      }
      
      // Check other fields
      Object.keys(data).forEach(key => {
        if (key !== 'desc' && key !== 'actions' && key !== 'legendary_actions' && key !== 'special_abilities') {
          const value = data[key];
          if (typeof value === 'string' && value.includes('_')) {
            results.other.push({
              name: monster.name,
              field: key,
              text: value.substring(0, 150) + '...'
            });
          }
        }
      });
    });
    
    // Display results
    console.log('📝 Descriptions with underscores:');
    if (results.descriptions.length > 0) {
      results.descriptions.slice(0, 5).forEach(item => {
        console.log(`  - ${item.name}: "${item.text}"`);
      });
      if (results.descriptions.length > 5) {
        console.log(`  ... and ${results.descriptions.length - 5} more`);
      }
    } else {
      console.log('  ✅ None found');
    }
    
    console.log('\n⚔️ Actions with underscores:');
    if (results.actions.length > 0) {
      results.actions.slice(0, 5).forEach(item => {
        console.log(`  - ${item.name} (${item.actionName}): "${item.text}"`);
      });
      if (results.actions.length > 5) {
        console.log(`  ... and ${results.actions.length - 5} more`);
      }
    } else {
      console.log('  ✅ None found');
    }
    
    console.log('\n👑 Legendary Actions with underscores:');
    if (results.legendaryActions.length > 0) {
      results.legendaryActions.slice(0, 5).forEach(item => {
        console.log(`  - ${item.name} (${item.actionName}): "${item.text}"`);
      });
      if (results.legendaryActions.length > 5) {
        console.log(`  ... and ${results.legendaryActions.length - 5} more`);
      }
    } else {
      console.log('  ✅ None found');
    }
    
    console.log('\n✨ Special Abilities with underscores:');
    if (results.specialAbilities.length > 0) {
      results.specialAbilities.slice(0, 5).forEach(item => {
        console.log(`  - ${item.name} (${item.abilityName}): "${item.text}"`);
      });
      if (results.specialAbilities.length > 5) {
        console.log(`  ... and ${results.specialAbilities.length - 5} more`);
      }
    } else {
      console.log('  ✅ None found');
    }
    
    console.log('\n🔍 Other fields with underscores:');
    if (results.other.length > 0) {
      results.other.slice(0, 5).forEach(item => {
        console.log(`  - ${item.name} (${item.field}): "${item.text}"`);
      });
      if (results.other.length > 5) {
        console.log(`  ... and ${results.other.length - 5} more`);
      }
    } else {
      console.log('  ✅ None found');
    }
    
    // Summary
    const totalUnderscores = results.descriptions.length + results.actions.length + 
                           results.legendaryActions.length + results.specialAbilities.length + 
                           results.other.length;
    
    console.log('\n📊 Summary:');
    console.log(`  - Total monsters analyzed: ${monsters.length}`);
    console.log(`  - Total fields with underscores: ${totalUnderscores}`);
    console.log(`  - Descriptions: ${results.descriptions.length}`);
    console.log(`  - Actions: ${results.actions.length}`);
    console.log(`  - Legendary Actions: ${results.legendaryActions.length}`);
    console.log(`  - Special Abilities: ${results.specialAbilities.length}`);
    console.log(`  - Other fields: ${results.other.length}`);
    
    console.log('\n✅ Underscore search complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUnderscores(); 