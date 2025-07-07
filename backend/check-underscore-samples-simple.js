const https = require('https');

// Use environment variables directly (set these in your shell)
const supabaseUrl = process.env.SUPABASE_URL?.replace(/"/g, '');
const supabaseKey = process.env.SUPABASE_ANON_KEY?.replace(/"/g, '');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
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

async function checkUnderscoreSamples() {
  try {
    console.log('🔍 Fetching sample monsters with underscores in descriptions...\n');
    
    // Get all monsters and filter for those with underscores in desc
    const monsters = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,data');
    if (!Array.isArray(monsters)) {
      console.error('❌ Error fetching monsters:', monsters);
      return;
    }
    
    const monstersWithUnderscores = monsters.filter(monster => 
      monster.data?.desc && monster.data.desc.includes('_')
    );
    
    console.log(`📊 Found ${monstersWithUnderscores.length} monsters with underscores in descriptions\n`);
    
    // Show first 10 samples
    console.log('📝 Sample descriptions with underscores:');
    console.log('─'.repeat(80));
    
    monstersWithUnderscores.slice(0, 10).forEach((monster, index) => {
      console.log(`${index + 1}. ${monster.name}:`);
      console.log(`   "${monster.data.desc}"`);
      console.log('');
    });
    
    // Show count of likely formatting artifacts
    const formattingArtifacts = monstersWithUnderscores.filter(monster => {
      const desc = monster.data.desc;
      return /\s_\s|^_|_$/.test(desc);
    });
    
    console.log(`🔍 Likely formatting artifacts (with spaces around underscores): ${formattingArtifacts.length}`);
    
    if (formattingArtifacts.length > 0) {
      console.log('\n📝 Sample formatting artifacts:');
      console.log('─'.repeat(80));
      
      formattingArtifacts.slice(0, 5).forEach((monster, index) => {
        console.log(`${index + 1}. ${monster.name}:`);
        console.log(`   "${monster.data.desc}"`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUnderscoreSamples(); 