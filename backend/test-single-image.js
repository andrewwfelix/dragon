require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testSingleImage() {
  console.log('🧪 Testing single image generation...\n');
  
  const testPrompt = 'red circle';
  
  try {
    console.log('🔑 API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    console.log('📤 Prompt:', testPrompt);
    console.log('🎨 Model: DALL-E 3');
    console.log('📏 Size: 1024x1024');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: testPrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('📸 Image URL:', response.data[0].url);
    console.log('🆔 Image ID:', response.data[0].id);
    console.log('📊 Response object keys:', Object.keys(response));
    
  } catch (error) {
    console.error('\n❌ FAILED');
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Error type:', error.type);
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Error status:', error.status);
    
    if (error.response) {
      console.error('🔴 Full response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Try DALL-E 2 as fallback
    console.log('\n🔄 Trying DALL-E 2 as fallback...');
    try {
      const response2 = await openai.images.generate({
        model: "dall-e-2",
        prompt: testPrompt,
        size: "256x256",
        n: 1,
      });
      
      console.log('✅ DALL-E 2 SUCCESS!');
      console.log('📸 Image URL:', response2.data[0].url);
      
    } catch (error2) {
      console.error('❌ DALL-E 2 also failed:', error2.message);
      console.error('🔴 DALL-E 2 error type:', error2.type);
      console.error('🔴 DALL-E 2 error status:', error2.status);
    }
  }
}

testSingleImage(); 