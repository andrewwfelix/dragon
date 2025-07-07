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

/**
 * Fix the attributes_populated column by setting default values
 */
async function fixAttributesColumn() {
  console.log('🔧 Fixing attributes_populated column...\n');
  
  try {
    // First, let's try to set all monsters to have attributes_populated = false
    console.log('📝 Setting all monsters to attributes_populated = false...');
    
    const updateResult = await makeSupabaseRequest('/rest/v1/monsters', 'PATCH', {
      attributes_populated: false
    });
    
    if (updateResult.error) {
      console.error('❌ Error updating all monsters:', updateResult.error);
      console.log('\n📝 Please run this SQL manually in your Supabase SQL Editor:');
      console.log('==========================================');
      console.log('UPDATE monsters SET attributes_populated = FALSE WHERE attributes_populated IS NULL;');
      console.log('==========================================');
      return false;
    }
    
    console.log('✅ Successfully set all monsters to attributes_populated = false');
    
    // Now let's check the status
    const trueResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.true');
    const falseResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.false');
    const totalResult = await makeSupabaseRequest('/rest/v1/monsters?select=count');
    
    console.log(`\n📊 Updated status:`);
    console.log(`📊 Total monsters: ${totalResult[0]?.count || 0}`);
    console.log(`✅ Populated (true): ${trueResult[0]?.count || 0}`);
    console.log(`⏳ Unpopulated (false): ${falseResult[0]?.count || 0}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing attributes column:', error);
    console.log('\n📝 If the automatic fix failed, please run this SQL manually in your Supabase SQL Editor:');
    console.log('==========================================');
    console.log('UPDATE monsters SET attributes_populated = FALSE WHERE attributes_populated IS NULL;');
    console.log('==========================================');
    return false;
  }
}

/**
 * Mark monsters with existing special traits as populated
 */
async function markExistingTraitsAsPopulated() {
  console.log('\n📝 Marking monsters with existing special traits as populated...');
  
  try {
    // Find monsters that have special traits
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,special_traits&special_traits=neq.[]');
    
    if (result.error) {
      console.error('Error fetching monsters with traits:', result.error);
      return;
    }
    
    const monsters = Array.isArray(result) ? result : [];
    console.log(`✅ Found ${monsters.length} monsters with existing special traits`);
    
    if (monsters.length === 0) {
      console.log('No monsters with special traits found!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const monster of monsters) {
      try {
        // Update the monster to mark it as populated
        const updateResult = await makeSupabaseRequest(`/rest/v1/monsters?id=eq.${monster.id}`, 'PATCH', {
          attributes_populated: true
        });
        
        if (updateResult.error) {
          console.error(`    ❌ Error updating ${monster.name}:`, updateResult.error);
          errorCount++;
        } else {
          console.log(`    ✅ Marked ${monster.name} as populated`);
          successCount++;
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Marking completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in marking process:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Fixing attributes_populated column...\n');
  
  const fixed = await fixAttributesColumn();
  if (fixed) {
    await markExistingTraitsAsPopulated();
    
    // Show final status
    console.log('\n📊 Final status:');
    const trueResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.true');
    const falseResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.false');
    const totalResult = await makeSupabaseRequest('/rest/v1/monsters?select=count');
    
    console.log(`📊 Total monsters: ${totalResult[0]?.count || 0}`);
    console.log(`✅ Populated: ${trueResult[0]?.count || 0}`);
    console.log(`⏳ Unpopulated: ${falseResult[0]?.count || 0}`);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error);
      process.exit(1);
    });
} 