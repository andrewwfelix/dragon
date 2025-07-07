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

async function checkProgress() {
  console.log('🔍 Checking special traits population progress...\n');
  
  try {
    // Get total count of monsters
    const totalResult = await makeSupabaseRequest('/rest/v1/monsters?select=count');
    console.log('Total monsters in database:', totalResult[0]?.count || 'Unknown');
    
    // Get count of monsters with special traits
    const withTraitsResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&special_traits=neq.[]');
    console.log('Monsters with special traits:', withTraitsResult[0]?.count || 0);
    
    // Get count of monsters without special traits
    const withoutTraitsResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&special_traits=eq.[]');
    console.log('Monsters without special traits:', withoutTraitsResult[0]?.count || 0);
    
    // Get a sample of monsters with traits to see where we left off
    const sampleWithTraits = await makeSupabaseRequest('/rest/v1/monsters?select=name,special_traits&special_traits=neq.[]&order=name.asc&limit=10');
    console.log('\n📝 Sample monsters with traits:');
    sampleWithTraits.forEach(monster => {
      console.log(`  ✅ ${monster.name} (${monster.special_traits.length} traits)`);
    });
    
    // Get a sample of monsters without traits to see what's left
    const sampleWithoutTraits = await makeSupabaseRequest('/rest/v1/monsters?select=name&special_traits=eq.[]&order=name.asc&limit=10');
    console.log('\n⏳ Sample monsters without traits:');
    sampleWithoutTraits.forEach(monster => {
      console.log(`  ⚪ ${monster.name}`);
    });
    
    // Get the last monster with traits to see where we stopped
    const lastWithTraits = await makeSupabaseRequest('/rest/v1/monsters?select=name&special_traits=neq.[]&order=name.desc&limit=1');
    if (lastWithTraits.length > 0) {
      console.log(`\n📍 Last monster processed: ${lastWithTraits[0].name}`);
    }
    
    // Get the first monster without traits to see where to continue
    const firstWithoutTraits = await makeSupabaseRequest('/rest/v1/monsters?select=name&special_traits=eq.[]&order=name.asc&limit=1');
    if (firstWithoutTraits.length > 0) {
      console.log(`📍 Next monster to process: ${firstWithoutTraits[0].name}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking progress:', error);
  }
}

// Run the check
checkProgress()
  .then(() => {
    console.log('\n✨ Progress check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Progress check failed:', error);
    process.exit(1);
  }); 