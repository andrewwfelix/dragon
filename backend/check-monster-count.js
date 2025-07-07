require('dotenv').config({ path: '../.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMonsterCount() {
  try {
    console.log('🔍 Checking monster database...\n');
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('monsters')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting count:', countError);
      return;
    }
    
    console.log(`📊 Total monsters in database: ${count}`);
    
    // Get a sample of monsters to check their data structure
    const { data: sampleMonsters, error: sampleError } = await supabase
      .from('monsters')
      .select('id, name, data, special_traits')
      .order('name')
      .limit(10);
    
    if (sampleError) {
      console.error('❌ Error getting sample:', sampleError);
      return;
    }
    
    console.log('\n📝 Sample monsters:');
    sampleMonsters.forEach((monster, index) => {
      console.log(`${index + 1}. ${monster.name}`);
      console.log(`   - Has data: ${!!monster.data}`);
      console.log(`   - Has desc in data: ${!!monster.data?.desc}`);
      console.log(`   - Desc value: ${monster.data?.desc === 'False' ? 'FALSE' : (monster.data?.desc ? 'Has description' : 'No description')}`);
      console.log(`   - Special traits count: ${monster.special_traits ? monster.special_traits.length : 0}`);
      console.log('');
    });
    
    // Check for monsters with 'False' desc values
    const { data: falseDescMonsters, error: falseError } = await supabase
      .from('monsters')
      .select('id, name, data')
      .eq('data->desc', 'False')
      .limit(5);
    
    if (falseError) {
      console.error('❌ Error checking false desc:', falseError);
    } else {
      console.log(`\n⚠️  Monsters with 'False' desc: ${falseDescMonsters.length} (showing first 5)`);
      falseDescMonsters.forEach(monster => {
        console.log(`   - ${monster.name}`);
      });
    }
    
    // Check for monsters with actual descriptions
    const { data: realDescMonsters, error: realError } = await supabase
      .from('monsters')
      .select('id, name, data')
      .not('data->desc', 'eq', 'False')
      .not('data->desc', 'is', null)
      .limit(5);
    
    if (realError) {
      console.error('❌ Error checking real desc:', realError);
    } else {
      console.log(`\n✅ Monsters with real descriptions: ${realDescMonsters.length} (showing first 5)`);
      realDescMonsters.forEach(monster => {
        console.log(`   - ${monster.name}: ${monster.data.desc.substring(0, 50)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMonsterCount(); 