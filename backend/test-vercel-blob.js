require('dotenv').config();
const VercelBlobService = require('./services/vercelBlobService');

async function testVercelBlob() {
  try {
    console.log('🧪 Testing Vercel Blob connectivity...');
    
    const blobService = new VercelBlobService();
    
    // Test listing blobs
    console.log('\n📋 Listing existing blobs...');
    const blobs = await blobService.listBlobs();
    
    if (blobs.length === 0) {
      console.log('No blobs found in the store.');
    } else {
      console.log(`Found ${blobs.length} blobs:`);
      blobs.forEach((blob, index) => {
        console.log(`${index + 1}. ${blob.pathname} (${blob.size} bytes)`);
      });
    }
    
    // Test filename generation
    console.log('\n📝 Testing filename generation...');
    const testTypes = ['Dragon', 'Aberration', 'Beast', 'Celestial'];
    testTypes.forEach(type => {
      const filename = blobService.generateIconFilename(type);
      console.log(`${type} -> ${filename}`);
    });
    
    console.log('\n✅ Vercel Blob test completed successfully!');
    
  } catch (error) {
    console.error('❌ Vercel Blob test failed:', error);
  }
}

testVercelBlob(); 