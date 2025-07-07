require('dotenv').config();
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testCurlApi() {
  console.log('🧪 Testing with direct curl API call...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = 'A simple red circle';
  
  const curlCommand = `curl -X POST https://api.openai.com/v1/images/generations \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "dall-e-3",
    "prompt": "${prompt}",
    "size": "1024x1024",
    "quality": "standard",
    "n": 1
  }'`;
  
  try {
    console.log('📤 Making direct API call...');
    console.log('🔑 API Key (first 10 chars):', apiKey?.substring(0, 10) + '...');
    console.log('📝 Prompt:', prompt);
    
    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stdout) {
      console.log('✅ Response:');
      console.log(stdout);
      
      try {
        const response = JSON.parse(stdout);
        if (response.data && response.data[0] && response.data[0].url) {
          console.log('🎉 Success! Image URL:', response.data[0].url);
        }
      } catch (parseError) {
        console.log('📄 Raw response (not JSON):', stdout);
      }
    }
    
    if (stderr) {
      console.log('⚠️  stderr:', stderr);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.stdout) {
      console.log('📄 stdout:', error.stdout);
    }
    
    if (error.stderr) {
      console.log('📄 stderr:', error.stderr);
    }
  }
}

testCurlApi(); 