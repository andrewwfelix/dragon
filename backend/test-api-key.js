require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testApiKey() {
  console.log('🧪 Testing API key functionality...\n');
  
  try {
    console.log('🔑 API Key (first 10 chars):', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    
    // Test with a simple chat completion to verify the key works
    console.log('📤 Testing with chat completion...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say hello"
        }
      ],
      max_tokens: 10
    });
    
    console.log('✅ Chat API Success!');
    console.log('📝 Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Chat API Error:', error.message);
    console.error('🔴 Error type:', error.type);
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Error status:', error.status);
    
    if (error.response) {
      console.error('🔴 Full response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testApiKey(); 