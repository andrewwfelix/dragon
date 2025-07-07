require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const VercelBlobService = require('./services/vercelBlobService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const blobService = new VercelBlobService();

async function generateMonsterTypeImage(monsterType, options = {}) {
  try {
    console.log(`🎨 Generating image for: ${monsterType.type_name}`);

    // Check if already has a Vercel Blob URL
    if (monsterType.icon_image && monsterType.icon_image.includes('blob.vercel-storage.com') && !options.force) {
      console.log(`⏭️  Already has Vercel Blob image: ${monsterType.type_name}`);
      return;
    }

    // Generate DALL-E image
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: monsterType.visual_description,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const imageUrl = response.data.data[0].url;
    console.log(`🖼️  Generated DALL-E image: ${imageUrl}`);

    // Generate filename for Vercel Blob
    const filename = blobService.generateIconFilename(monsterType.type_name);

    // Upload to Vercel Blob
    const blob = await blobService.uploadImageFromUrl(imageUrl, filename);

    // Update database with Vercel Blob URL
    const { error: updateError } = await supabase
      .from('monster_types')
      .update({ 
        icon_image: blob.url,
        image_generation_status: 'success'
      })
      .eq('id', monsterType.id);

    if (updateError) {
      console.error(`❌ Error updating database:`, updateError);
      throw updateError;
    }

    console.log(`✅ Successfully generated and uploaded: ${monsterType.type_name} -> ${blob.url}`);

  } catch (error) {
    console.error(`❌ Error generating image for ${monsterType.type_name}:`, error);
    
    // Update status with error
    await supabase
      .from('monster_types')
      .update({ 
        image_generation_status: `error: ${error.message}` 
      })
      .eq('id', monsterType.id);

    throw error;
  }
}

async function generateAllMonsterTypeImages(options = {}) {
  try {
    console.log('🚀 Starting monster type image generation with Vercel Blob...');

    // Get all monster types
    const { data: allTypes, error } = await supabase
      .from('monster_types')
      .select('id, type_name, visual_description, icon_image, image_generation_status')
      .not('visual_description', 'is', null);

    if (error) {
      console.error('Error fetching monster types:', error);
      return;
    }

    console.log(`📊 Found ${allTypes.length} monster types with visual descriptions`);

    // Filter types that need images
    const typesToProcess = allTypes.filter(type => {
      if (options.force) return true;
      return !type.icon_image || !type.icon_image.includes('blob.vercel-storage.com');
    });

    console.log(`🎯 Processing ${typesToProcess.length} monster types`);

    let successCount = 0;
    let errorCount = 0;

    for (const monsterType of typesToProcess) {
      try {
        await generateMonsterTypeImage(monsterType, options);
        successCount++;
        
        // Rate limiting - wait 2 seconds between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        errorCount++;
        console.error(`Failed to process ${monsterType.type_name}:`, error.message);
      }
    }

    console.log(`\n🎉 Image generation completed!`);
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('Fatal error during image generation:', error);
  }
}

// Command line options
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force')
};

// Run the generation
generateAllMonsterTypeImages(options); 