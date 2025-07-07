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
 * Add attributes_populated column to monsters table
 */
async function addAttributesPopulatedColumn() {
  console.log('🦖 Adding attributes_populated column to monsters table...');
  
  try {
    // Use RPC to add column
    const result = await makeSupabaseRequest('/rest/v1/rpc/exec_sql', 'POST', {
      sql: `ALTER TABLE monsters ADD COLUMN IF NOT EXISTS attributes_populated BOOLEAN DEFAULT FALSE;`
    });

    if (result.error) {
      console.log('RPC method failed, trying alternative approach...');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('==========================================');
      console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS attributes_populated BOOLEAN DEFAULT FALSE;');
      console.log('==========================================');
      return false;
    }

    console.log('✅ attributes_populated column added successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error adding attributes_populated column:', error);
    console.log('\n📝 If the automatic migration failed, please run this SQL manually in your Supabase SQL Editor:');
    console.log('==========================================');
    console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS attributes_populated BOOLEAN DEFAULT FALSE;');
    console.log('==========================================');
    return false;
  }
}

/**
 * Update existing monsters that have special traits to mark them as populated
 */
async function updateExistingPopulatedMonsters() {
  console.log('📝 Updating existing monsters with special traits to mark them as populated...');
  
  try {
    // Find monsters that have special traits but aren't marked as populated
    const result = await makeSupabaseRequest('/rest/v1/monsters?select=id,name,special_traits,attributes_populated&special_traits=neq.[]&attributes_populated=eq.false');
    
    if (result.error) {
      console.error('Error fetching monsters:', result.error);
      return;
    }
    
    const monsters = Array.isArray(result) ? result : [];
    console.log(`✅ Found ${monsters.length} monsters with special traits that need to be marked as populated`);
    
    if (monsters.length === 0) {
      console.log('No monsters need updating!');
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
    
    console.log(`\n🎉 Update completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in update process:', error);
    throw error;
  }
}

/**
 * Show current status
 */
async function showStatus() {
  console.log('📊 Current status of attributes_populated column...\n');
  
  try {
    // Get total count
    const totalResult = await makeSupabaseRequest('/rest/v1/monsters?select=count');
    const total = totalResult[0]?.count || 0;
    
    // Get count of populated monsters
    const populatedResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.true');
    const populated = populatedResult[0]?.count || 0;
    
    // Get count of unpopulated monsters
    const unpopulatedResult = await makeSupabaseRequest('/rest/v1/monsters?select=count&attributes_populated=eq.false');
    const unpopulated = unpopulatedResult[0]?.count || 0;
    
    console.log(`📊 Total monsters: ${total}`);
    console.log(`✅ Populated: ${populated}`);
    console.log(`⏳ Unpopulated: ${unpopulated}`);
    
    // Show sample of unpopulated monsters
    const sampleUnpopulated = await makeSupabaseRequest('/rest/v1/monsters?select=name&attributes_populated=eq.false&order=name.asc&limit=10');
    console.log('\n⏳ Sample unpopulated monsters:');
    sampleUnpopulated.forEach(monster => {
      console.log(`  ⚪ ${monster.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'add-column':
      await addAttributesPopulatedColumn();
      break;
      
    case 'update-existing':
      await updateExistingPopulatedMonsters();
      break;
      
    case 'status':
      await showStatus();
      break;
      
    case 'setup':
      console.log('🚀 Setting up attributes_populated column...\n');
      const columnAdded = await addAttributesPopulatedColumn();
      if (columnAdded) {
        await updateExistingPopulatedMonsters();
        await showStatus();
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node add-attributes-populated-column.js add-column');
      console.log('  node add-attributes-populated-column.js update-existing');
      console.log('  node add-attributes-populated-column.js status');
      console.log('  node add-attributes-populated-column.js setup');
      console.log('');
      console.log('Examples:');
      console.log('  node add-attributes-populated-column.js setup');
      console.log('  node add-attributes-populated-column.js status');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
} 