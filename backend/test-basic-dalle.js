require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testBasicDalle() {
  console.log('🧪 Testing basic DALL-E functionality...\n');
  
  const testPrompt = 'A red circle';
  
  try {
    console.log('📤 Testing prompt:', testPrompt);
    console.log('🔑 API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: testPrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });
    
    console.log('✅ Success!');
    console.log('📸 Image URL:', response.data[0].url);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔴 Error type:', error.type);
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Error status:', error.status);
    
    if (error.response) {
      console.error('🔴 Full response:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Try DALL-E 2 as fallback
    try {
      console.log('\n🔄 Trying DALL-E 2 as fallback...');
      const response2 = await openai.images.generate({
        model: "dall-e-2",
        prompt: testPrompt,
        size: "1024x1024",
        n: 1,
      });
      console.log('✅ DALL-E 2 Success!');
      console.log('📸 Image URL:', response2.data[0].url);
    } catch (error2) {
      console.error('❌ DALL-E 2 also failed:', error2.message);
    }
  }
}

testBasicDalle(); 