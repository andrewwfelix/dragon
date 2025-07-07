require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint() {
  console.log('🧪 Testing monster type icon endpoint...\n');
  
  const testTypes = ['dragon', 'Dragon', 'aberration', 'Aberration'];
  
  for (const type of testTypes) {
    try {
      console.log(`📡 Testing type: "${type}"`);
      const url = `${BASE_URL}/api/monsters/type-icon/${encodeURIComponent(type)}`;
      console.log(`🔗 URL: ${url}`);
      
      const response = await axios.get(url);
      console.log(`✅ Status: ${response.status}`);
      console.log(`📦 Data:`, response.data);
      console.log('---');
    } catch (error) {
      console.log(`❌ Error for "${type}":`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      console.log('---');
    }
  }
}

testEndpoint(); 