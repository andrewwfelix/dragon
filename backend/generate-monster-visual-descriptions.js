const { createClient } = require('@supabase/supabase-js');
const { generateMonsterVisualDescription, batchGenerateVisualDescriptions } = require('../services/openaiService');
require('dotenv').config({ path: '../.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch monsters that don't have visual descriptions yet
 */
async function fetchMonstersWithoutVisualDescriptions(limit = 10) {
  console.log('📡 Fetching monsters without visual descriptions...');
  
  try {
    const { data, error } = await supabase
      .from('monsters')
      .select('id, name, desc, visual_description')
      .or('visual_description.is.null,visual_description.eq.')
      .limit(limit);
    
    if (error) throw error;
    
    console.log(`✅ Found ${data.length} monsters without visual descriptions`);
    return data;
  } catch (error) {
    console.error('Error fetching monsters:', error);
    throw error;
  }
}

/**
 * Update a monster with its generated visual description
 */
async function updateMonsterVisualDescription(monsterId, visualDescription) {
  try {
    const { error } = await supabase
      .from('monsters')
      .update({ visual_description: visualDescription })
      .eq('id', monsterId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating monster:', error);
    return false;
  }
}

/**
 * Generate visual descriptions for monsters and update the database
 */
async function generateAndUpdateVisualDescriptions(options = {}) {
  console.log('🎨 Starting visual description generation...\n');
  
  try {
    // Fetch monsters without visual descriptions
    const monsters = await fetchMonstersWithoutVisualDescriptions(options.limit || 5);
    
    if (monsters.length === 0) {
      console.log('✅ All monsters already have visual descriptions!');
      return;
    }
    
    console.log(`\n🦖 Processing ${monsters.length} monsters:\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const monster of monsters) {
      console.log(`📝 Processing: ${monster.name}`);
      
      try {
        // Generate visual description
        const visualDescription = await generateMonsterVisualDescription(
          monster.name,
          monster.desc || 'No description available',
          {
            style: options.style || 'cinematic',
            length: options.length || 'medium',
            focus: options.focus || 'visual'
          }
        );
        
        console.log(`   Generated: "${visualDescription.substring(0, 80)}..."`);
        
        // Update database
        const updated = await updateMonsterVisualDescription(monster.id, visualDescription);
        
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
        console.error(`   ❌ Error processing ${monster.name}:`, error.message);
        errorCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(`\n🎉 Generation completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error in generation process:', error);
    throw error;
  }
}

/**
 * Test function to generate descriptions for specific monsters
 */
async function testSpecificMonsters() {
  console.log('🧪 Testing with specific monsters...\n');
  
  const testMonsters = [
    { name: 'Adult Bronze Dragon', desc: 'Bronze dragons are coastal dwellers that feed primarily on aquatic plants and fish.' },
    { name: 'Beholder', desc: 'A beholder is an aberration that appears as a floating orb of flesh with a large mouth, single central eye, and many smaller eyestalks.' }
  ];
  
  for (const monster of testMonsters) {
    console.log(`\n🦖 ${monster.name}:`);
    console.log('─'.repeat(50));
    
    try {
      const visualDescription = await generateMonsterVisualDescription(
        monster.name,
        monster.desc,
        { style: 'cinematic', length: 'medium' }
      );
      
      console.log(`Generated: ${visualDescription}`);
      
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
      await testSpecificMonsters();
      break;
      
    case 'generate':
      const options = {
        limit: parseInt(args[1]) || 5,
        style: args[2] || 'cinematic',
        length: args[3] || 'medium',
        focus: args[4] || 'visual'
      };
      await generateAndUpdateVisualDescriptions(options);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node generate-monster-visual-descriptions.js test');
      console.log('  node generate-monster-visual-descriptions.js generate [limit] [style] [length] [focus]');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-monster-visual-descriptions.js test');
      console.log('  node generate-monster-visual-descriptions.js generate 10 cinematic medium visual');
      console.log('  node generate-monster-visual-descriptions.js generate 5 atmospheric long threatening');
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
  generateAndUpdateVisualDescriptions,
  testSpecificMonsters
}; 