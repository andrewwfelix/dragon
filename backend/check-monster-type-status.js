require('dotenv').config();
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/monster_types?select=*`;

async function checkStatus() {
  try {
    const { data } = await axios.get(endpoint, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    console.log('📊 Monster Types Status:');
    console.log('='.repeat(50));
    data.forEach(type => {
      const status = type.image_generation_status || 'No status';
      const hasUrl = type.image_url ? '✅ Has URL' : '❌ No URL';
      console.log(`${type.type_name.padEnd(15)} | ${status.padEnd(30)} | ${hasUrl}`);
    });

    console.log('\n📈 Summary:');
    const successful = data.filter(t => t.image_url).length;
    const failed = data.filter(t => t.image_generation_status && t.image_generation_status.includes('Error')).length;
    const pending = data.filter(t => !t.image_url && !t.image_generation_status).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏳ Pending: ${pending}`);
    console.log(`📊 Total: ${data.length}`);
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

checkStatus(); 