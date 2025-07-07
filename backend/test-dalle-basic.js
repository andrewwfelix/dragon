require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testBasicDalle() {
  console.log('🧪 Testing basic DALL-E 3 functionality...\n');
  
  const testPrompt = 'A simple red circle on a white background';
  
  try {
    console.log('📤 Testing prompt:', testPrompt);
    
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
      console.error('🔴 Full response:', error.response.data);
    }
  }
}

testBasicDalle(); 