require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function validateJsonFormatting() {
  console.log('🔍 Validating JSON formatting and special characters...\n');
  
  const testPrompts = {
    'ooze_simple': 'A blue and purple blob shape on black background',
    'undead_simple': 'A white ghost figure on black background',
    'swarm_simple': 'Multiple small flying creatures on black background',
    'plant_simple': 'A green plant with blue leaves on black background'
  };
  
  for (const [name, prompt] of Object.entries(testPrompts)) {
    console.log(`\n📝 Testing: ${name}`);
    console.log(`📤 Original prompt: "${prompt}"`);
    
    // Check for special characters
    const specialChars = prompt.match(/[^\w\s.,!?-]/g);
    if (specialChars) {
      console.log(`⚠️  Special characters found: ${specialChars.join(', ')}`);
    }
    
    // Create the exact request body
    const requestBody = {
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    };
    
    // Validate JSON formatting
    try {
      const jsonString = JSON.stringify(requestBody);
      console.log(`✅ JSON is valid`);
      console.log(`📦 JSON string length: ${jsonString.length}`);
      console.log(`📦 JSON content: ${jsonString}`);
      
      // Test parsing back
      const parsed = JSON.parse(jsonString);
      console.log(`✅ JSON can be parsed back successfully`);
      
      // Check for any hidden characters
      const hasHiddenChars = /[\x00-\x1F\x7F-\x9F]/.test(jsonString);
      if (hasHiddenChars) {
        console.log(`⚠️  Hidden characters detected in JSON`);
      }
      
      // Check for unicode issues
      const hasUnicode = /[\u0080-\uFFFF]/.test(jsonString);
      if (hasUnicode) {
        console.log(`⚠️  Unicode characters detected`);
      }
      
    } catch (error) {
      console.log(`❌ JSON validation failed: ${error.message}`);
    }
    
    // Test with cleaned prompt (remove any potential problematic characters)
    const cleanedPrompt = prompt.replace(/[^\w\s.,!?-]/g, '');
    if (cleanedPrompt !== prompt) {
      console.log(`🧹 Cleaned prompt: "${cleanedPrompt}"`);
      
      const cleanedRequestBody = {
        model: "dall-e-3",
        prompt: cleanedPrompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      };
      
      try {
        console.log(`🔄 Testing with cleaned prompt...`);
        const response = await openai.images.generate(cleanedRequestBody);
        console.log(`✅ Cleaned prompt SUCCESS!`);
        console.log(`📸 URL: ${response.data[0].url}`);
      } catch (error) {
        console.log(`❌ Cleaned prompt still failed: ${error.message}`);
      }
    }
    
    console.log('-'.repeat(60));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

validateJsonFormatting(); 