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

async function checkUnderscores() {
  try {
    console.log('🔍 Searching for underscores in JSONB data...\n');
    
    // Query 1: Check for underscores in desc field
    console.log('📝 Checking for underscores in descriptions...');
    const descResult = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data&data->desc=like.*_*');
    if (Array.isArray(descResult)) {
      console.log(`Found ${descResult.length} monsters with underscores in descriptions:`);
      descResult.slice(0, 5).forEach(monster => {
        console.log(`  - ${monster.name}: "${monster.data?.desc?.substring(0, 100)}..."`);
      });
      if (descResult.length > 5) {
        console.log(`  ... and ${descResult.length - 5} more`);
      }
    }
    
    // Query 2: Check for underscores in actions
    console.log('\n⚔️ Checking for underscores in actions...');
    const actionsResult = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data&data->actions=like.*_*');
    if (Array.isArray(actionsResult)) {
      console.log(`Found ${actionsResult.length} monsters with underscores in actions:`);
      actionsResult.slice(0, 5).forEach(monster => {
        const actions = monster.data?.actions || [];
        const actionWithUnderscore = actions.find(action => action.desc && action.desc.includes('_'));
        if (actionWithUnderscore) {
          console.log(`  - ${monster.name}: "${actionWithUnderscore.desc.substring(0, 100)}..."`);
        }
      });
      if (actionsResult.length > 5) {
        console.log(`  ... and ${actionsResult.length - 5} more`);
      }
    }
    
    // Query 3: Check for underscores in legendary actions
    console.log('\n👑 Checking for underscores in legendary actions...');
    const legendaryResult = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data&data->legendary_actions=like.*_*');
    if (Array.isArray(legendaryResult)) {
      console.log(`Found ${legendaryResult.length} monsters with underscores in legendary actions:`);
      legendaryResult.slice(0, 5).forEach(monster => {
        const legendaryActions = monster.data?.legendary_actions || [];
        const actionWithUnderscore = legendaryActions.find(action => action.desc && action.desc.includes('_'));
        if (actionWithUnderscore) {
          console.log(`  - ${monster.name}: "${actionWithUnderscore.desc.substring(0, 100)}..."`);
        }
      });
      if (legendaryResult.length > 5) {
        console.log(`  ... and ${legendaryResult.length - 5} more`);
      }
    }
    
    // Query 4: Check for underscores in special abilities
    console.log('\n✨ Checking for underscores in special abilities...');
    const abilitiesResult = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data&data->special_abilities=like.*_*');
    if (Array.isArray(abilitiesResult)) {
      console.log(`Found ${abilitiesResult.length} monsters with underscores in special abilities:`);
      abilitiesResult.slice(0, 5).forEach(monster => {
        const abilities = monster.data?.special_abilities || [];
        const abilityWithUnderscore = abilities.find(ability => ability.desc && ability.desc.includes('_'));
        if (abilityWithUnderscore) {
          console.log(`  - ${monster.name}: "${abilityWithUnderscore.desc.substring(0, 100)}..."`);
        }
      });
      if (abilitiesResult.length > 5) {
        console.log(`  ... and ${abilitiesResult.length - 5} more`);
      }
    }
    
    // Query 5: General search for any underscores in JSONB
    console.log('\n🔍 General search for underscores in any JSONB field...');
    const generalResult = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data&data=like.*_*');
    if (Array.isArray(generalResult)) {
      console.log(`Found ${generalResult.length} monsters with underscores anywhere in JSONB data`);
    }
    
    console.log('\n✅ Underscore search complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUnderscores(); 