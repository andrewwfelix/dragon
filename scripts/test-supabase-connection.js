const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Missing required environment variables');
    console.error('Please check your .env.local file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    try {
        console.log('\n🔗 Testing database connection...');
        
        // Test basic connection by querying a table
        const { data, error } = await supabase
            .from('classes')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }

        console.log('✅ Supabase connection successful!');
        
        // Test if tables exist
        console.log('\n📋 Checking table structure...');
        
        const tables = ['classes', 'races', 'monsters', 'spells', 'magic_items'];
        
        for (const table of tables) {
            try {
                const { data: tableData, error: tableError } = await supabase
                    .from(table)
                    .select('count')
                    .limit(1);
                
                if (tableError) {
                    console.log(`❌ Table ${table}: ${tableError.message}`);
                } else {
                    console.log(`✅ Table ${table}: Accessible`);
                }
            } catch (err) {
                console.log(`❌ Table ${table}: ${err.message}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return false;
    }
}

testConnection()
    .then(success => {
        if (success) {
            console.log('\n🎉 All tests passed! Supabase is ready for migration.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check your configuration.');
            process.exit(1);
        }
    })
    .catch(console.error); 