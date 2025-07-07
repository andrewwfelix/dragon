require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const VercelBlobService = require('./services/vercelBlobService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const blobService = new VercelBlobService();

async function migrateToVercelBlob() {
  try {
    console.log('🚀 Starting migration to Vercel Blob...');

    // Get all monster types with existing image URLs
    const { data: monsterTypes, error } = await supabase
      .from('monster_types')
      .select('id, type_name, icon_image, image_generation_status')
      .not('icon_image', 'is', null);

    if (error) {
      console.error('Error fetching monster types:', error);
      return;
    }

    console.log(`📊 Found ${monsterTypes.length} monster types with images`);

    let successCount = 0;
    let errorCount = 0;

    for (const monsterType of monsterTypes) {
      try {
        console.log(`\n🔄 Processing: ${monsterType.type_name}`);

        // Skip if already migrated to Vercel Blob
        if (monsterType.icon_image && monsterType.icon_image.includes('blob.vercel-storage.com')) {
          console.log(`⏭️  Already migrated: ${monsterType.type_name}`);
          continue;
        }

        // Handle hex-encoded URLs
        let imageUrl = monsterType.icon_image;
        if (typeof imageUrl === 'string' && /^\\?x/.test(imageUrl)) {
          const hexString = imageUrl.replace(/^\\?x/, '');
          imageUrl = Buffer.from(hexString, 'hex').toString('utf8');
        }

        if (!imageUrl || !imageUrl.startsWith('http')) {
          console.log(`⚠️  Invalid URL for ${monsterType.type_name}: ${imageUrl}`);
          continue;
        }

        // Generate filename for Vercel Blob
        const filename = blobService.generateIconFilename(monsterType.type_name);

        // Upload to Vercel Blob
        const blob = await blobService.uploadImageFromUrl(imageUrl, filename);

        // Update database with new Vercel Blob URL
        const { error: updateError } = await supabase
          .from('monster_types')
          .update({ 
            icon_image: blob.url,
            image_generation_status: 'migrated_to_vercel_blob'
          })
          .eq('id', monsterType.id);

        if (updateError) {
          console.error(`❌ Error updating database for ${monsterType.type_name}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Successfully migrated: ${monsterType.type_name} -> ${blob.url}`);
          successCount++;
        }

        // Rate limiting - wait 1 second between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing ${monsterType.type_name}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);

  } catch (error) {
    console.error('Fatal error during migration:', error);
  }
}

// Run the migration
migrateToVercelBlob(); 