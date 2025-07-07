require('dotenv').config({ path: './.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColonSpacing() {
  console.log('Checking for missing spaces after colons in monster data...');
  
  try {
    // Fetch a sample of monsters to check
    const { data: monsters, error } = await supabase
      .from('monsters')
      .select('id, name, desc, legendary_desc, special_traits, actions, legendary_actions, special_abilities')
      .limit(100);

    if (error) {
      console.error('Error fetching monsters:', error);
      return;
    }

    console.log(`Checking ${monsters.length} monsters for colon spacing issues...\n`);

    let issuesFound = 0;

    for (const monster of monsters) {
      let monsterHasIssues = false;
      const issues = [];

      // Check main description
      if (monster.desc && typeof monster.desc === 'string') {
        const colonMatches = monster.desc.match(/:[A-Z]/g);
        if (colonMatches && colonMatches.length > 0) {
          monsterHasIssues = true;
          issues.push(`desc: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
        }
      }

      // Check legendary description
      if (monster.legendary_desc && typeof monster.legendary_desc === 'string') {
        const colonMatches = monster.legendary_desc.match(/:[A-Z]/g);
        if (colonMatches && colonMatches.length > 0) {
          monsterHasIssues = true;
          issues.push(`legendary_desc: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
        }
      }

      // Check special traits
      if (monster.special_traits && Array.isArray(monster.special_traits)) {
        monster.special_traits.forEach((trait, index) => {
          if (trait.name && typeof trait.name === 'string') {
            const colonMatches = trait.name.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`special_traits[${index}].name: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
          if (trait.description && typeof trait.description === 'string') {
            const colonMatches = trait.description.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`special_traits[${index}].description: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
        });
      }

      // Check actions
      if (monster.actions && Array.isArray(monster.actions)) {
        monster.actions.forEach((action, index) => {
          if (action.name && typeof action.name === 'string') {
            const colonMatches = action.name.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`actions[${index}].name: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
          if (action.desc && typeof action.desc === 'string') {
            const colonMatches = action.desc.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`actions[${index}].desc: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
        });
      }

      // Check legendary actions
      if (monster.legendary_actions && Array.isArray(monster.legendary_actions)) {
        monster.legendary_actions.forEach((action, index) => {
          if (action.name && typeof action.name === 'string') {
            const colonMatches = action.name.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`legendary_actions[${index}].name: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
          if (action.desc && typeof action.desc === 'string') {
            const colonMatches = action.desc.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`legendary_actions[${index}].desc: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
        });
      }

      // Check special abilities
      if (monster.special_abilities && Array.isArray(monster.special_abilities)) {
        monster.special_abilities.forEach((ability, index) => {
          if (ability.name && typeof ability.name === 'string') {
            const colonMatches = ability.name.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`special_abilities[${index}].name: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
          if (ability.desc && typeof ability.desc === 'string') {
            const colonMatches = ability.desc.match(/:[A-Z]/g);
            if (colonMatches && colonMatches.length > 0) {
              monsterHasIssues = true;
              issues.push(`special_abilities[${index}].desc: Found ${colonMatches.length} instances (e.g., "${colonMatches[0]}")`);
            }
          }
        });
      }

      if (monsterHasIssues) {
        console.log(`\n🐉 ${monster.name} (ID: ${monster.id}):`);
        issues.forEach(issue => console.log(`  ❌ ${issue}`));
        issuesFound++;
      }
    }

    if (issuesFound === 0) {
      console.log('✅ No colon spacing issues found in the sample!');
    } else {
      console.log(`\n📊 Found ${issuesFound} monsters with colon spacing issues in the sample.`);
      console.log('This suggests there may be formatting issues in the data that need to be fixed.');
    }

  } catch (error) {
    console.error('Error in checkColonSpacing:', error);
  }
}

// Run the check
checkColonSpacing(); 