require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const VercelBlobService = require('./services/vercelBlobService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const blobService = new VercelBlobService();

async function checkVercelBlobStatus() {
  try {
    console.log('🔍 Checking Vercel Blob status...\n');

    // Check database status
    const { data: monsterTypes, error } = await supabase
      .from('monster_types')
      .select('type_name, icon_image, image_generation_status')
      .order('type_name');

    if (error) {
      console.error('Error fetching monster types:', error);
      return;
    }

    console.log(`📊 Database Status (${monsterTypes.length} total types):`);
    console.log('─'.repeat(80));

    let vercelBlobCount = 0;
    let dalleUrlCount = 0;
    let noImageCount = 0;
    let errorCount = 0;

    monsterTypes.forEach(type => {
      const hasVercelBlob = type.icon_image && type.icon_image.includes('blob.vercel-storage.com');
      const hasDalleUrl = type.icon_image && type.icon_image.includes('oaidalleapiprodscus.blob.core.windows.net');
      const hasError = type.image_generation_status && type.image_generation_status.includes('error');

      let status = '❌ No image';
      if (hasVercelBlob) {
        status = '✅ Vercel Blob';
        vercelBlobCount++;
      } else if (hasDalleUrl) {
        status = '🔄 DALL-E URL';
        dalleUrlCount++;
      } else if (hasError) {
        status = '❌ Error';
        errorCount++;
      } else {
        noImageCount++;
      }

      console.log(`${type.type_name.padEnd(15)} | ${status}`);
    });

    console.log('─'.repeat(80));
    console.log(`✅ Vercel Blob URLs: ${vercelBlobCount}`);
    console.log(`🔄 DALL-E URLs: ${dalleUrlCount}`);
    console.log(`❌ No image: ${noImageCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    // Check Vercel Blob store
    console.log('\n📋 Vercel Blob Store Status:');
    try {
      const blobs = await blobService.listBlobs();
      console.log(`Found ${blobs.length} blobs in store:`);
      
      if (blobs.length > 0) {
        blobs.forEach((blob, index) => {
          console.log(`${index + 1}. ${blob.pathname} (${blob.size} bytes)`);
        });
      }
    } catch (error) {
      console.error('Error checking Vercel Blob store:', error);
    }

    // Test a few URLs
    console.log('\n🧪 Testing a few URLs:');
    const testTypes = monsterTypes.filter(t => t.icon_image && t.icon_image.includes('blob.vercel-storage.com')).slice(0, 3);
    
    if (testTypes.length > 0) {
      testTypes.forEach(type => {
        console.log(`${type.type_name}: ${type.icon_image}`);
      });
    } else {
      console.log('No Vercel Blob URLs found to test');
    }

  } catch (error) {
    console.error('Error checking status:', error);
  }
}

checkVercelBlobStatus(); 