require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkAccountStatus() {
  console.log('🔍 Checking account status and API access...\n');
  
  try {
    console.log('🔑 API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    
    // Test 1: Models endpoint (should work for any valid key)
    console.log('\n📤 Test 1: Checking available models...');
    try {
      const models = await openai.models.list();
      console.log('✅ Models API works');
      console.log(`📊 Available models: ${models.data.length}`);
      
      // Check if DALL-E models are available
      const dalleModels = models.data.filter(model => 
        model.id.includes('dall-e') || model.id.includes('gpt')
      );
      console.log('🎨 DALL-E models found:', dalleModels.map(m => m.id));
      
    } catch (error) {
      console.log('❌ Models API failed:', error.message);
    }
    
    // Test 2: Simple chat completion
    console.log('\n📤 Test 2: Testing chat completion...');
    try {
      const chat = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      console.log('✅ Chat API works');
      console.log('📝 Response:', chat.choices[0].message.content);
    } catch (error) {
      console.log('❌ Chat API failed:', error.message);
    }
    
    // Test 3: Image generation with DALL-E 2
    console.log('\n📤 Test 3: Testing DALL-E 2...');
    try {
      const image2 = await openai.images.generate({
        model: "dall-e-2",
        prompt: "red circle",
        size: "256x256",
        n: 1
      });
      console.log('✅ DALL-E 2 works');
      console.log('📸 URL:', image2.data[0].url);
    } catch (error) {
      console.log('❌ DALL-E 2 failed:', error.message);
      console.log('🔴 Error type:', error.type);
      console.log('🔴 Error status:', error.status);
    }
    
    // Test 4: Image generation with DALL-E 3
    console.log('\n📤 Test 4: Testing DALL-E 3...');
    try {
      const image3 = await openai.images.generate({
        model: "dall-e-3",
        prompt: "red circle",
        size: "1024x1024",
        quality: "standard",
        n: 1
      });
      console.log('✅ DALL-E 3 works');
      console.log('📸 URL:', image3.data[0].url);
    } catch (error) {
      console.log('❌ DALL-E 3 failed:', error.message);
      console.log('🔴 Error type:', error.type);
      console.log('🔴 Error status:', error.status);
      
      if (error.response) {
        console.log('🔴 Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

checkAccountStatus(); 