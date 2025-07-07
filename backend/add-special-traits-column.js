
const { createClient } = require('../backend/node_modules/@supabase/supabase-js');
require('../backend/node_modules/dotenv').config({ path: '../.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse description to extract special traits
 */
function parseSpecialTraits(desc) {
  if (!desc) return [];
  
  const traits = [];
  // Split by bold markers (**Trait Name.**)
  const parts = desc.split(/\*\*(.*?)\*\*\./);
  
  // Extract traits (every odd index after splitting)
  for (let i = 1; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1]) {
      traits.push({
        name: parts[i].trim(),
        description: parts[i + 1].trim()
      });
    }
  }
  
  return traits;
}

/**
 * Add special_traits column to monsters table
 */
async function addSpecialTraitsColumn() {
  console.log('🦖 Adding special_traits column to monsters table...');
  
  try {
    // Add the special_traits column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE monsters 
        ADD COLUMN IF NOT EXISTS special_traits JSONB DEFAULT '[]'::jsonb;
      `
    });

    if (error) {
      console.log('RPC method failed, trying alternative approach...');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('==========================================');
      console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS special_traits JSONB DEFAULT \'[]\'::jsonb;');
      console.log('==========================================');
      return false;
    }

    console.log('✅ special_traits column added successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error adding special_traits column:', error);
    console.log('\n📝 If the automatic migration failed, please run this SQL manually in your Supabase SQL Editor:');
    console.log('==========================================');
    console.log('ALTER TABLE monsters ADD COLUMN IF NOT EXISTS special_traits JSONB DEFAULT \'[]\'::jsonb;');
    console.log('==========================================');
    return false;
  }
}

/**
 * Extract and populate special traits for all monsters
 */
async function populateSpecialTraits() {
  console.log('📝 Extracting special traits from monster descriptions...');
  
  try {
    // Fetch all monsters with descriptions
    const { data: monsters, error } = await supabase
      .from('monsters')
      .select('id, name, desc, special_traits');
    
    if (error) throw error;
    
    console.log(`✅ Found ${monsters.length} monsters to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const monster of monsters) {
      try {
        const traits = parseSpecialTraits(monster.desc);
        
        if (traits.length > 0) {
          console.log(`  📝 ${monster.name}: Found ${traits.length} traits`);
          
          // Update the monster with extracted traits
          const { error: updateError } = await supabase
            .from('monsters')
            .update({ special_traits: traits })
            .eq('id', monster.id);
          
          if (updateError) {
            console.error(`    ❌ Error updating ${monster.name}:`, updateError);
            errorCount++;
          } else {
            console.log(`    ✅ Updated ${monster.name}`);
            successCount++;
          }
        } else {
          console.log(`  ⚪ ${monster.name}: No traits found`);
        }
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Special traits extraction completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in extraction process:', error);
    throw error;
  }
}

/**
 * Test function to show example trait extraction
 */
async function testTraitExtraction() {
  console.log('🧪 Testing special trait extraction...\n');
  
  const testDescriptions = [
    'A cloud of unconnected, flat gray triangles in the vague shape of a mantis flickers unpredictably from one position to another, clicking softly as its arm blades swing outward. Akaasits are constructed beings from a plane destroyed by a catastrophic misuse of time magic. **Mindless.** The akaasit has no mind, at least as understood by denizens of the Material Plane, and its motives are inscrutable. **Unknown Origin.** The home of the akaasit is unknown, but they are often encountered in areas touched or altered by time magic.',
    'A massive dragon with scales that shimmer like polished bronze. **Amphibious.** The dragon can breathe air and water.',
    'A simple creature with no special traits.'
  ];
  
  testDescriptions.forEach((desc, index) => {
    console.log(`Test ${index + 1}:`);
    console.log(`Description: ${desc.substring(0, 100)}...`);
    const traits = parseSpecialTraits(desc);
    console.log(`Extracted traits:`, traits);
    console.log('');
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      await testTraitExtraction();
      break;
      
    case 'add-column':
      await addSpecialTraitsColumn();
      break;
      
    case 'populate':
      await populateSpecialTraits();
      break;
      
    case 'full':
      console.log('🚀 Running full special traits migration...\n');
      const columnAdded = await addSpecialTraitsColumn();
      if (columnAdded) {
        await populateSpecialTraits();
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node add-special-traits-column.js test');
      console.log('  node add-special-traits-column.js add-column');
      console.log('  node add-special-traits-column.js populate');
      console.log('  node add-special-traits-column.js full');
      console.log('');
      console.log('Examples:');
      console.log('  node add-special-traits-column.js test');
      console.log('  node add-special-traits-column.js full');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  addSpecialTraitsColumn,
  populateSpecialTraits,
  parseSpecialTraits,
  testTraitExtraction
}; 