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

function cleanUnderscores(text) {
  if (!text) return text;
  let cleaned = text;
  // Remove leading underscores and spaces
  cleaned = cleaned.replace(/^_+\s*/, '');
  // Remove trailing underscores and spaces
  cleaned = cleaned.replace(/\s*_+$/, '');
  // Remove underscores in the middle of text (like "wings._ Sea dragons")
  cleaned = cleaned.replace(/\s*_\s*/g, ' ');
  // Clean up multiple spaces and formatting
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s+\./g, '.') // Remove spaces before periods
    .replace(/\s+,/g, ',') // Remove spaces before commas
    .trim();
  return cleaned;
}

async function fixActionUnderscores() {
  try {
    console.log('🔍 Fetching all monsters...');
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    let fixedCount = 0;
    let errorCount = 0;
    for (const monster of monsters) {
      let needsUpdate = false;
      const updatedData = { ...monster.data };
      // Clean actions
      if (Array.isArray(updatedData.actions)) {
        updatedData.actions = updatedData.actions.map(action => {
          if (action.desc && /_/.test(action.desc)) {
            const cleaned = cleanUnderscores(action.desc);
            if (cleaned !== action.desc) needsUpdate = true;
            return { ...action, desc: cleaned };
          }
          return action;
        });
      }
      // Clean legendary actions
      if (Array.isArray(updatedData.legendary_actions)) {
        updatedData.legendary_actions = updatedData.legendary_actions.map(action => {
          if (action.desc && /_/.test(action.desc)) {
            const cleaned = cleanUnderscores(action.desc);
            if (cleaned !== action.desc) needsUpdate = true;
            return { ...action, desc: cleaned };
          }
          return action;
        });
      }
      // Clean special abilities
      if (Array.isArray(updatedData.special_abilities)) {
        updatedData.special_abilities = updatedData.special_abilities.map(ability => {
          if (ability.desc && /_/.test(ability.desc)) {
            const cleaned = cleanUnderscores(ability.desc);
            if (cleaned !== ability.desc) needsUpdate = true;
            return { ...ability, desc: cleaned };
          }
          return ability;
        });
      }
      if (needsUpdate) {
        try {
          await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ data: updatedData })
          });
          console.log(`✅ Fixed: ${monster.name}`);
          fixedCount++;
        } catch (err) {
          console.error(`❌ Error updating ${monster.name}:`, err);
          errorCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    console.log(`\n🎉 Cleaning complete! Fixed: ${fixedCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (process.argv.includes('fix')) {
  fixActionUnderscores();
} else {
  console.log('Run with "node scripts/fix-action-underscores.js fix"');
} 