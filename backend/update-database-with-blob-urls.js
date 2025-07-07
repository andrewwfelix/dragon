require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const VercelBlobService = require('./services/vercelBlobService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const blobService = new VercelBlobService();

function extractTypeFromBlob(blob) {
  // Extracts the type_name from the blob filename
  // e.g., monster-types/aberration-icon-4Bzjhz3424pDYNZzx6QPS9IftYqEcK.png => aberration
  const match = blob.pathname.match(/monster-types\/([a-z0-9\-]+)-icon/i);
  if (match) {
    return match[1].toLowerCase().trim();
  }
  return null;
}

async function updateDatabaseWithBlobUrls() {
  try {
    console.log('🔄 Updating database with Vercel Blob URLs (using image_url column)...\n');

    // Get all monster types
    const { data: monsterTypes, error } = await supabase
      .from('monster_types')
      .select('id, type_name, image_url')
      .order('type_name');

    if (error) {
      console.error('Error fetching monster types:', error);
      return;
    }

    // Get all blobs from Vercel Blob store
    const blobs = await blobService.listBlobs();
    console.log(`Found ${blobs.length} blobs in Vercel Blob store`);

    // Build a mapping from type_name (lowercased, trimmed) to the latest blob
    const blobsByType = {};
    blobs.forEach(blob => {
      const typeKey = extractTypeFromBlob(blob);
      if (!typeKey) return;
      if (!blobsByType[typeKey]) {
        blobsByType[typeKey] = [];
      }
      blobsByType[typeKey].push(blob);
    });

    // For each type, pick the largest blob (most likely the latest/good one)
    Object.keys(blobsByType).forEach(type => {
      blobsByType[type].sort((a, b) => b.size - a.size); // descending by size
    });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const monsterType of monsterTypes) {
      const typeKey = monsterType.type_name.toLowerCase().trim();
      const typeBlobs = blobsByType[typeKey];

      if (!typeBlobs || typeBlobs.length === 0) {
        console.log(`⚠️  No blobs found for ${monsterType.type_name}`);
        skippedCount++;
        continue;
      }

      // Use the largest blob (first in the sorted array)
      const bestBlob = typeBlobs[0];
      
      // Check if already has this URL
      if (monsterType.image_url === bestBlob.url) {
        console.log(`⏭️  ${monsterType.type_name} already has correct URL`);
        skippedCount++;
        continue;
      }

      // Log mapping for debugging
      console.log(`🔗 Mapping: ${monsterType.type_name} -> ${bestBlob.pathname} (${bestBlob.size} bytes)`);

      // Update database with blob URL in the new image_url column
      const { error: updateError } = await supabase
        .from('monster_types')
        .update({ 
          image_url: bestBlob.url,
          image_generation_status: 'success'
        })
        .eq('id', monsterType.id);

      if (updateError) {
        console.error(`❌ Error updating ${monsterType.type_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${monsterType.type_name} -> ${bestBlob.url}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Database update completed!`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);

    // Show final status
    console.log('\n📋 Final Status:');
    const { data: finalStatus } = await supabase
      .from('monster_types')
      .select('type_name, image_url')
      .order('type_name');

    finalStatus.forEach(type => {
      const hasBlob = type.image_url && type.image_url.includes('blob.vercel-storage.com');
      const status = hasBlob ? '✅ Vercel Blob' : '❌ No image';
      console.log(`${type.type_name.padEnd(15)} | ${status}`);
    });

  } catch (error) {
    console.error('Error updating database:', error);
  }
}

updateDatabaseWithBlobUrls(); 