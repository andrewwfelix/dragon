require('dotenv').config({ path: './.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTraitNameFormatting() {
  console.log('Fixing trait name formatting (adding spaces after colons)...');
  
  try {
    // Fetch all monsters that have special traits
    const { data: monsters, error } = await supabase
      .from('monsters')
      .select('id, name, special_traits')
      .not('special_traits', 'is', null);

    if (error) {
      console.error('Error fetching monsters:', error);
      return;
    }

    console.log(`Found ${monsters.length} monsters with special traits`);

    let fixedCount = 0;
    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < monsters.length; i += batchSize) {
      batches.push(monsters.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} monsters)`);

      const updates = [];

      for (const monster of batch) {
        if (!monster.special_traits || !Array.isArray(monster.special_traits)) {
          continue;
        }

        let hasChanges = false;
        const fixedTraits = monster.special_traits.map(trait => {
          let fixedTrait = { ...trait };
          
          // Fix trait name formatting (add space after colon if missing)
          if (trait.name && typeof trait.name === 'string') {
            const originalName = trait.name;
            // Replace patterns like "Name:Description" with "Name: Description"
            fixedTrait.name = trait.name.replace(/:([A-Za-z])/g, ': $1');
            
            if (fixedTrait.name !== originalName) {
              hasChanges = true;
              console.log(`  Fixed trait name: "${originalName}" -> "${fixedTrait.name}"`);
            }
          }

          return fixedTrait;
        });

        if (hasChanges) {
          updates.push({
            id: monster.id,
            special_traits: fixedTraits
          });
          fixedCount++;
        }
      }

      // Update the batch
      if (updates.length > 0) {
        console.log(`  Updating ${updates.length} monsters in this batch...`);
        
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('monsters')
            .update({ special_traits: update.special_traits })
            .eq('id', update.id);

          if (updateError) {
            console.error(`Error updating monster ${update.id}:`, updateError);
          }
        }
      }
    }

    console.log(`\n✅ Fixed trait name formatting for ${fixedCount} monsters`);
    console.log('Trait name formatting fix completed!');

  } catch (error) {
    console.error('Error in fixTraitNameFormatting:', error);
  }
}

// Run the fix
fixTraitNameFormatting(); 