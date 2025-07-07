require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testDalleVersions() {
  console.log('🧪 Testing DALL-E 2 vs DALL-E 3 for failing types...\n');
  
  const testPrompts = {
    'ooze_simple': 'A blue and purple blob shape on black background',
    'undead_simple': 'A white ghost figure on black background',
    'swarm_simple': 'Multiple small flying creatures on black background',
    'plant_simple': 'A green plant with blue leaves on black background'
  };
  
  for (const [name, prompt] of Object.entries(testPrompts)) {
    console.log(`\n📝 Testing: ${name}`);
    console.log(`📤 Prompt: "${prompt}"`);
    
    // Test DALL-E 2
    try {
      console.log('   🔄 Trying DALL-E 2...');
      const response2 = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt,
        size: "1024x1024",
        n: 1,
      });
      console.log('   ✅ DALL-E 2 Success!');
      console.log('   📸 URL:', response2.data[0].url);
    } catch (error) {
      console.log('   ❌ DALL-E 2 Error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test DALL-E 3
    try {
      console.log('   🔄 Trying DALL-E 3...');
      const response3 = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });
      console.log('   ✅ DALL-E 3 Success!');
      console.log('   📸 URL:', response3.data[0].url);
    } catch (error) {
      console.log('   ❌ DALL-E 3 Error:', error.message);
      if (error.response) {
        console.log('   🔴 Response:', error.response.data);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('-'.repeat(50));
  }
}

testDalleVersions(); 