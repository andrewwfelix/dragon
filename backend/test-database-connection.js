require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

    // Test basic connection
    const { data, error } = await supabase
      .from('monster_types')
      .select('type_name, image_url')
      .limit(5);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Sample data:');
    data.forEach(row => {
      const hasImage = row.image_url ? '✅' : '❌';
      console.log(`${hasImage} ${row.type_name}: ${row.image_url || 'No image'}`);
    });

  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testDatabaseConnection(); 