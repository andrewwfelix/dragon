const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFalseDescriptions() {
  try {
    console.log('🔍 Checking for monsters with "False" descriptions...\n');
    
    // Check for monsters with 'False' desc values
    const { data: falseDescMonsters, error: falseError } = await supabase
      .from('monsters')
      .select('id, name, data')
      .eq('data->desc', 'False');
    
    if (falseError) {
      console.error('❌ Error checking false desc:', falseError);
      return;
    }
    
    console.log(`⚠️  Found ${falseDescMonsters.length} monsters with 'False' descriptions:`);
    falseDescMonsters.forEach((monster, index) => {
      console.log(`${index + 1}. ${monster.name} (ID: ${monster.id})`);
    });
    
    // Check for Shoggoth specifically
    const { data: shoggoth, error: shoggothError } = await supabase
      .from('monsters')
      .select('id, name, data, special_traits')
      .eq('name', 'Shoggoth')
      .single();
    
    if (shoggothError) {
      console.error('❌ Error fetching Shoggoth:', shoggothError);
    } else if (shoggoth) {
      console.log('\n🔍 Shoggoth details:');
      console.log(`   - Name: ${shoggoth.name}`);
      console.log(`   - Has data: ${!!shoggoth.data}`);
      console.log(`   - Desc value: "${shoggoth.data?.desc}"`);
      console.log(`   - Special traits: ${shoggoth.special_traits ? shoggoth.special_traits.length : 0}`);
      
      if (shoggoth.data) {
        console.log('\n📋 Full data structure:');
        console.log(JSON.stringify(shoggoth.data, null, 2));
      }
    }
    
    // Check total monster count
    const { count, error: countError } = await supabase
      .from('monsters')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting count:', countError);
    } else {
      console.log(`\n📊 Total monsters in database: ${count}`);
      console.log(`📊 Monsters with "False" desc: ${falseDescMonsters.length}`);
      console.log(`📊 Percentage affected: ${((falseDescMonsters.length / count) * 100).toFixed(2)}%`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFalseDescriptions(); 