require('dotenv').config({ path: './.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function showTraitExamples() {
  console.log('Fetching examples of trait names...');
  
  try {
    // Fetch monsters with special traits
    const { data: monsters, error } = await supabase
      .from('monsters')
      .select('id, name, special_traits')
      .not('special_traits', 'is', null)
      .limit(20);

    if (error) {
      console.error('Error fetching monsters:', error);
      return;
    }

    console.log(`Found ${monsters.length} monsters with special traits\n`);

    for (const monster of monsters) {
      if (!monster.special_traits || !Array.isArray(monster.special_traits)) {
        continue;
      }

      console.log(`🐉 ${monster.name} (ID: ${monster.id}):`);
      
      monster.special_traits.forEach((trait, index) => {
        if (trait.name) {
          console.log(`  Trait ${index + 1}: "${trait.name}"`);
          
          // Check if it has the colon issue
          if (trait.name.match(/:[A-Z]/)) {
            console.log(`    ❌ HAS COLON ISSUE: "${trait.name}"`);
          }
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('Error in showTraitExamples:', error);
  }
}

// Run the check
showTraitExamples(); 