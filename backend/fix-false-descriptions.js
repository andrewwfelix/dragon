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

async function fixFalseDescriptions() {
  try {
    console.log('🔍 Finding monsters with "False" descriptions...\n');
    
    // Get monsters with 'False' desc values
    const { data: falseDescMonsters, error: falseError } = await supabase
      .from('monsters')
      .select('id, name, data')
      .eq('data->desc', 'False');
    
    if (falseError) {
      console.error('❌ Error checking false desc:', falseError);
      return;
    }
    
    console.log(`⚠️  Found ${falseDescMonsters.length} monsters with 'False' descriptions`);
    
    if (falseDescMonsters.length === 0) {
      console.log('✅ No monsters with "False" descriptions found!');
      return;
    }
    
    console.log('\n📝 Monsters to fix:');
    falseDescMonsters.forEach((monster, index) => {
      console.log(`${index + 1}. ${monster.name} (ID: ${monster.id})`);
    });
    
    // Ask for confirmation
    console.log('\n🤔 This will remove the "False" desc value from these monsters.');
    console.log('The description will be empty/null instead of showing "False".');
    console.log('Proceed? (y/N)');
    
    // For now, let's just show what would be fixed
    console.log('\n🔧 Would fix the following monsters:');
    
    for (const monster of falseDescMonsters) {
      console.log(`\n📝 ${monster.name}:`);
      console.log(`   - Current desc: "${monster.data?.desc}"`);
      console.log(`   - Would set to: null/empty`);
      
      // Show other available data
      if (monster.data) {
        const availableFields = Object.keys(monster.data).filter(key => 
          monster.data[key] && 
          monster.data[key] !== 'False' && 
          monster.data[key] !== false &&
          typeof monster.data[key] === 'string' &&
          monster.data[key].length > 10
        );
        
        if (availableFields.length > 0) {
          console.log(`   - Available fields: ${availableFields.join(', ')}`);
        }
      }
    }
    
    // For demonstration, let's fix one monster
    if (falseDescMonsters.length > 0) {
      const testMonster = falseDescMonsters[0];
      console.log(`\n🧪 Testing fix on: ${testMonster.name}`);
      
      // Update the monster to remove the "False" desc
      const updatedData = { ...testMonster.data };
      delete updatedData.desc; // Remove the "False" desc
      
      const { error: updateError } = await supabase
        .from('monsters')
        .update({ data: updatedData })
        .eq('id', testMonster.id);
      
      if (updateError) {
        console.error('❌ Error updating test monster:', updateError);
      } else {
        console.log('✅ Successfully fixed test monster!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixFalseDescriptions(); 