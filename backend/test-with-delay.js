require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testWithDelay() {
  console.log('🧪 Testing with longer delays...\n');
  
  try {
    console.log('🔑 API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    console.log('💰 Budget: $4.78 / $40 (plenty remaining)');
    
    // Wait 10 seconds before making the request
    console.log('⏳ Waiting 10 seconds before making request...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('📤 Testing simple image generation...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A simple red circle",
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
    
    // If it's still a quota error, let's check account status
    if (error.status === 429) {
      console.log('\n🔍 This might be a rate limiting issue or account verification issue.');
      console.log('💡 Try checking:');
      console.log('   - Account verification status');
      console.log('   - Daily/monthly request limits');
      console.log('   - Regional availability of DALL-E');
    }
  }
}

testWithDelay(); 