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

function cleanDescription(desc) {
  if (!desc) return desc;
  
  let cleaned = desc;
  
  // Remove leading underscores and spaces
  cleaned = cleaned.replace(/^_+\s*/, '');
  
  // Remove trailing underscores and spaces
  cleaned = cleaned.replace(/\s*_+$/, '');
  
  // Remove underscores in the middle of text (like "wings._ Sea dragons")
  cleaned = cleaned.replace(/\s*_\s*/g, ' ');
  
  // Remove license and non-content endings
  const endingsToRemove = [
    /Open Game License.*$/i,
    /This work.*$/i,
    /Permission.*$/i,
    /Copyright.*$/i,
    /All rights reserved.*$/i,
    /\.\.\..*$/, // Remove trailing ellipsis and anything after
    /\s+$/, // Remove trailing whitespace
  ];
  
  for (const ending of endingsToRemove) {
    cleaned = cleaned.replace(ending, '');
  }
  
  // Clean up multiple spaces and formatting
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s+\./g, '.') // Remove spaces before periods
    .replace(/\s+,/g, ',') // Remove spaces before commas
    .trim();
  
  return cleaned;
}

async function fixDescriptionIssues() {
  try {
    console.log('🔍 Fetching monsters with description issues...\n');
    
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    
    console.log(`📊 Analyzing ${monsters.length} monsters for description issues...\n`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const monster of monsters) {
      const data = monster.data || {};
      
      if (data.desc) {
        const originalDesc = data.desc;
        const cleanedDesc = cleanDescription(originalDesc);
        
        // Check if cleaning made any changes
        if (cleanedDesc !== originalDesc && cleanedDesc.length > 10) {
          console.log(`📝 ${monster.name}:`);
          console.log(`  Before: "${originalDesc.substring(0, 100)}..."`);
          console.log(`  After:  "${cleanedDesc.substring(0, 100)}..."`);
          
          try {
            const updatedData = { ...data, desc: cleanedDesc };
            await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ data: updatedData })
            });
            console.log(`  ✅ Updated ${monster.name}`);
            fixedCount++;
          } catch (err) {
            console.error(`  ❌ Error updating ${monster.name}:`, err);
            errorCount++;
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log('\n🎉 Description cleaning complete!');
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Check if we should run the fix
const args = process.argv.slice(2);
if (args.includes('fix')) {
  fixDescriptionIssues();
} else {
  console.log('🔍 Use "node scripts/fix-description-issues.js fix" to run the fix');
} 