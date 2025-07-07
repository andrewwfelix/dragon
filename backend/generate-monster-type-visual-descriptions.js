require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generateMonsterTypeVisualDescription } = require('../prompt/monster-type-visual-description');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch all monster types from the database
 */
async function fetchMonsterTypes() {
  console.log('📡 Fetching monster types from database...');
  
  try {
    const { data, error } = await supabase
      .from('monster_types')
      .select('id, type_name, visual_description')
      .order('type_name');
    
    if (error) throw error;
    
    console.log(`✅ Found ${data.length} monster types`);
    return data;
  } catch (error) {
    console.error('Error fetching monster types:', error);
    throw error;
  }
}

/**
 * Update a monster type with its generated visual description
 */
async function updateMonsterTypeVisualDescription(typeId, visualDescription) {
  try {
    const { error } = await supabase
      .from('monster_types')
      .update({ visual_description: visualDescription })
      .eq('id', typeId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating monster type:', error);
    return false;
  }
}

/**
 * Generate visual descriptions for monster types and update the database
 */
async function generateAndUpdateTypeVisualDescriptions(options = {}) {
  console.log('🎨 Starting monster type visual description generation...\n');
  
  try {
    // Fetch monster types
    const monsterTypes = await fetchMonsterTypes();
    
    if (monsterTypes.length === 0) {
      console.log('✅ No monster types found!');
      return;
    }
    
    console.log(`\n🗂️  Processing ${monsterTypes.length} monster types:\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const monsterType of monsterTypes) {
      console.log(`📝 Processing: ${monsterType.type_name}`);
      
      // Skip if already has a description and not forcing update
      if (monsterType.visual_description && !options.force) {
        console.log(`   ⏭️  Skipping (already has description)`);
        continue;
      }
      
      try {
        // Generate visual description
        const visualDescription = await generateMonsterTypeVisualDescription(monsterType.type_name);
        
        console.log(`   Generated: "${visualDescription.substring(0, 80)}..."`);
        
        // Update database
        const updated = await updateMonsterTypeVisualDescription(monsterType.id, visualDescription);
        
        if (updated) {
          console.log(`   ✅ Updated database`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to update database`);
          errorCount++;
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Error processing ${monsterType.type_name}:`, error.message);
        errorCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(`\n🎉 Generation completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${monsterTypes.length - successCount - errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in generation process:', error);
    throw error;
  }
}

/**
 * Test function to generate descriptions for specific monster types
 */
async function testSpecificTypes() {
  console.log('🧪 Testing with specific monster types...\n');
  
  const testTypes = [
    'dragon',
    'fiend',
    'beast',
    'undead',
    'construct'
  ];
  
  for (const type of testTypes) {
    console.log(`\n🗂️  ${type.toUpperCase()}:`);
    console.log('─'.repeat(50));
    
    try {
      const visualDescription = await generateMonsterTypeVisualDescription(type);
      console.log(visualDescription);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      await testSpecificTypes();
      break;
      
    case 'generate':
      const options = {
        force: args.includes('--force') || args.includes('-f')
      };
      await generateAndUpdateTypeVisualDescriptions(options);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node generate-monster-type-visual-descriptions.js test');
      console.log('  node generate-monster-type-visual-descriptions.js generate [--force]');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-monster-type-visual-descriptions.js test');
      console.log('  node generate-monster-type-visual-descriptions.js generate');
      console.log('  node generate-monster-type-visual-descriptions.js generate --force');
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
  generateAndUpdateTypeVisualDescriptions,
  testSpecificTypes
}; 