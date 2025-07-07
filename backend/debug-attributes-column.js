const path = require('path');

// Simple environment variable loading
const fs = require('fs');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/"/g, '');
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Simple HTTP client for Supabase
const https = require('https');

function makeSupabaseRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ data: body, error: null });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function debugAttributesColumn() {
  console.log('🔍 Debugging attributes_populated column...\n');
  
  try {
    // Get a sample of monsters to see the actual values
    const sampleResult = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,attributes_populated,special_traits&limit=10');
    
    console.log('📝 Sample monsters with their attributes_populated values:');
    if (Array.isArray(sampleResult)) {
      sampleResult.forEach(monster => {
        console.log(`  ${monster.name}: attributes_populated = ${monster.attributes_populated} (type: ${typeof monster.attributes_populated})`);
      });
    }
    
    // Check for null values
    const nullResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=is.null');
    console.log(`\n📊 Monsters with null attributes_populated: ${nullResult[0]?.count || 0}`);
    
    // Check for true values
    const trueResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.true');
    console.log(`📊 Monsters with attributes_populated = true: ${trueResult[0]?.count || 0}`);
    
    // Check for false values
    const falseResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.false');
    console.log(`📊 Monsters with attributes_populated = false: ${falseResult[0]?.count || 0}`);
    
    // Check for any value that's not null
    const notNullResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=not.is.null');
    console.log(`📊 Monsters with non-null attributes_populated: ${notNullResult[0]?.count || 0}`);
    
    // Get total count
    const totalResult = await makeSupabaseRequest('/rest/v1/monsters?select=count');
    console.log(`📊 Total monsters: ${totalResult[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Error debugging:', error);
  }
}

// Run the debug
debugAttributesColumn()
  .then(() => {
    console.log('\n✨ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  }); 