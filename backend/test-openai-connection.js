const path = require('path');
const OpenAI = require(path.join(__dirname, '../backend/node_modules/openai'));
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../.env.local') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAIConnection() {
  console.log('🤖 Testing OpenAI API connection...');
  
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    console.log('Please add OPENAI_API_KEY to your .env file');
    process.exit(1);
  }
  
  console.log('✅ OPENAI_API_KEY found in environment variables');
  
  try {
    // Test with a simple completion
    console.log('📡 Making test API call...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Hello! Please respond with 'OpenAI connection successful!' if you can see this message."
        }
      ],
      max_tokens: 50,
    });

    console.log('✅ OpenAI API connection successful!');
    console.log('📝 Response:', completion.choices[0].message.content);
    
    // Test with a more complex request to verify full functionality
    console.log('\n🧪 Testing more complex request...');
    
    const complexCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides brief, accurate responses."
        },
        {
          role: "user",
          content: "What is 2 + 2? Respond with just the number."
        }
      ],
      max_tokens: 10,
    });

    console.log('✅ Complex request successful!');
    console.log('📝 Response:', complexCompletion.choices[0].message.content);
    
    console.log('\n🎉 All OpenAI API tests passed!');
    console.log('You can now use OpenAI for data processing in your application.');
    
  } catch (error) {
    console.error('❌ OpenAI API test failed:', error.message);
    
    if (error.status === 401) {
      console.error('🔑 Authentication failed. Please check your API key.');
    } else if (error.status === 429) {
      console.error('⏰ Rate limit exceeded. Please try again later.');
    } else if (error.status === 500) {
      console.error('🔧 OpenAI service error. Please try again.');
    } else {
      console.error('❓ Unexpected error. Please check your internet connection and try again.');
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testOpenAIConnection()
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOpenAIConnection }; 