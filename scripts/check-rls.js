const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
    console.log('🔍 Checking RLS policies...');
    
    // Test with different approaches
    console.log('\n1️⃣ Testing with service role key (should bypass RLS)...');
    
    const { data: serviceData, error: serviceError } = await supabase
        .from('monsters')
        .select('name, slug')
        .limit(200);
    
    if (serviceError) {
        console.log(`❌ Service role error:`, serviceError);
    } else {
        console.log(`✅ Service role fetched: ${serviceData.length} records`);
        console.log(`📊 First 5:`, serviceData.slice(0, 5).map(m => m.name));
        console.log(`📊 Last 5:`, serviceData.slice(-5).map(m => m.name));
    }
    
    // Test with count
    console.log('\n2️⃣ Testing count with service role...');
    const { count, error: countError } = await supabase
        .from('monsters')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.log(`❌ Count error:`, countError);
    } else {
        console.log(`📊 Count with service role: ${count}`);
    }
    
    // Test with range
    console.log('\n3️⃣ Testing with range 100-200...');
    const { data: rangeData, error: rangeError } = await supabase
        .from('monsters')
        .select('name, slug')
        .range(100, 199);
    
    if (rangeError) {
        console.log(`❌ Range error:`, rangeError);
    } else {
        console.log(`📊 Range 100-200: ${rangeData.length} records`);
        if (rangeData.length > 0) {
            console.log(`📊 First in range:`, rangeData[0].name);
            console.log(`📊 Last in range:`, rangeData[rangeData.length - 1].name);
        }
    }
    
    // Test with range 200-300
    console.log('\n4️⃣ Testing with range 200-300...');
    const { data: rangeData2, error: rangeError2 } = await supabase
        .from('monsters')
        .select('name, slug')
        .range(200, 299);
    
    if (rangeError2) {
        console.log(`❌ Range 200-300 error:`, rangeError2);
    } else {
        console.log(`📊 Range 200-300: ${rangeData2.length} records`);
        if (rangeData2.length > 0) {
            console.log(`📊 First in range:`, rangeData2[0].name);
            console.log(`📊 Last in range:`, rangeData2[rangeData2.length - 1].name);
        }
    }
}

checkRLS().catch(console.error); 