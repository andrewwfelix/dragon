require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetch monster types that have visual descriptions but no images
 */
async function fetchMonsterTypesForImages() {
  console.log('📡 Fetching monster types for image generation...');
  
  try {
    const { data, error } = await supabase
      .from('monster_types')
      .select('id, type_name, visual_description, icon_image')
      .not('visual_description', 'is', null)
      .order('type_name');
    
    if (error) throw error;
    
    console.log(`✅ Found ${data.length} monster types with descriptions`);
    return data;
  } catch (error) {
    console.error('Error fetching monster types:', error);
    throw error;
  }
}

/**
 * Generate image using DALL-E
 */
async function generateImage(prompt, size = '1024x1024') {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: size,
      quality: "standard",
      n: 1,
    });

    return response.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Update monster type with generated image URL and status
 */
async function updateMonsterTypeImage(typeId, imageUrl, status = 'ok') {
  try {
    const updateData = { 
      icon_image: imageUrl,
      icon_filename: imageUrl ? `monster-type-${Date.now()}.png` : null,
      icon_mime_type: imageUrl ? 'image/png' : null
    };
    
    // Only add status if the column exists (we'll add this later)
    // updateData.image_generation_status = status;
    
    const { error } = await supabase
      .from('monster_types')
      .update(updateData)
      .eq('id', typeId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating monster type image:', error);
    return false;
  }
}

/**
 * Generate images for monster types and update the database
 */
async function generateAndUpdateTypeImages(options = {}) {
  console.log('🎨 Starting monster type image generation...\n');
  
  try {
    // Fetch monster types
    const monsterTypes = await fetchMonsterTypesForImages();
    
    if (monsterTypes.length === 0) {
      console.log('✅ No monster types found for image generation!');
      return;
    }
    
    console.log(`\n🖼️  Processing ${monsterTypes.length} monster types:\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const monsterType of monsterTypes) {
      console.log(`📝 Processing: ${monsterType.type_name}`);
      
      // Skip if already has an image and not forcing update
      if (monsterType.icon_image && !options.force) {
        console.log(`   ⏭️  Skipping (already has image)`);
        skippedCount++;
        continue;
      }
      
      try {
        // Generate image using the visual description as prompt
        const imageUrl = await generateImage(monsterType.visual_description, options.size || '1024x1024');
        
        console.log(`   Generated: Image URL received`);
        
        // Update database with success status
        const updated = await updateMonsterTypeImage(monsterType.id, imageUrl, 'ok');
        
        if (updated) {
          console.log(`   ✅ Updated database`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to update database`);
          errorCount++;
        }
        
        // Add delay to avoid rate limiting (DALL-E has rate limits)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        // Capture detailed error information
        const errorDetails = {
          message: error.message,
          type: error.type || 'unknown',
          code: error.code || 'unknown',
          status: error.status || 'unknown'
        };
        
        const errorStatus = `error: ${errorDetails.type} - ${errorDetails.message}`;
        console.error(`   ❌ Error processing ${monsterType.type_name}:`, errorDetails);
        
        // Update database with error status
        await updateMonsterTypeImage(monsterType.id, null, errorStatus);
        errorCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(`\n🎉 Image generation completed!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('❌ Error in image generation process:', error);
    throw error;
  }
}

/**
 * Test function to generate image for a specific type
 */
async function testSpecificTypeImage() {
  console.log('🧪 Testing image generation for specific monster type...\n');
  
  const testType = {
    type_name: 'dragon',
    visual_description: 'Draw a dragon, its majestic figure hunched in a powerful stance. Its scales are deep blue and teal with golden accents, shimmering against the black background. Bright white light burns in its eyes, and wisps of purple smoke curl from its nostrils. The creature stands centered, creating a striking silhouette with high contrast details.'
  };
  
  console.log(`\n🗂️  ${testType.type_name.toUpperCase()}:`);
  console.log('─'.repeat(50));
  console.log(`Prompt: ${testType.visual_description}`);
  
  try {
    const imageUrl = await generateImage(testType.visual_description, '1024x1024');
    console.log(`\n✅ Generated image URL: ${imageUrl}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      await testSpecificTypeImage();
      break;
      
    case 'generate':
      const options = {
        force: args.includes('--force') || args.includes('-f'),
        size: args.find(arg => arg.startsWith('--size='))?.split('=')[1] || '1024x1024'
      };
      await generateAndUpdateTypeImages(options);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node generate-monster-type-images.js test');
      console.log('  node generate-monster-type-images.js generate [--force] [--size=1024x1024]');
      console.log('');
      console.log('Examples:');
      console.log('  node generate-monster-type-images.js test');
      console.log('  node generate-monster-type-images.js generate');
      console.log('  node generate-monster-type-images.js generate --force');
      console.log('  node generate-monster-type-images.js generate --size=1792x1024');
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
  generateAndUpdateTypeImages,
  testSpecificTypeImage
}; 