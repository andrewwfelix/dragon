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

async function addHasUnderscoresColumn() {
  try {
    console.log('🔧 Adding has_underscores column to monsters table...\n');
    
    // Add the column using SQL
    const sqlQuery = `
      ALTER TABLE monsters 
      ADD COLUMN IF NOT EXISTS has_underscores BOOLEAN DEFAULT FALSE;
    `;
    
    const result = await makeSupabaseRequest('/rest/v1/rpc/exec_sql', {
      method: 'POST',
      body: JSON.stringify({ query: sqlQuery })
    });
    
    console.log('✅ Successfully added has_underscores column\n');
    
    // Now populate the column based on existing data
    console.log('🔍 Populating has_underscores column...\n');
    
    const updateQuery = `
      UPDATE monsters 
      SET has_underscores = CASE 
        WHEN data->>'desc' LIKE '%_%' THEN TRUE 
        ELSE FALSE 
      END;
    `;
    
    const updateResult = await makeSupabaseRequest('/rest/v1/rpc/exec_sql', {
      method: 'POST',
      body: JSON.stringify({ query: updateQuery })
    });
    
    console.log('✅ Successfully populated has_underscores column\n');
    
    // Get count of monsters with underscores
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM monsters 
      WHERE has_underscores = TRUE;
    `;
    
    const countResult = await makeSupabaseRequest('/rest/v1/rpc/exec_sql', {
      method: 'POST',
      body: JSON.stringify({ query: countQuery })
    });
    
    console.log(`📊 Found ${countResult[0]?.count || 0} monsters with underscores in descriptions\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addHasUnderscoresColumn(); 