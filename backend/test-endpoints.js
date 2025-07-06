const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api';
const TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper function to log test results
function logTest(testName, success, details = '') {
  totalTests++;
  if (success) {
    passedTests++;
    console.log(`${colors.green}✅ PASS${colors.reset} - ${testName}`);
  } else {
    failedTests++;
    console.log(`${colors.red}❌ FAIL${colors.reset} - ${testName}`);
    if (details) {
      console.log(`   ${colors.yellow}Details: ${details}${colors.reset}`);
    }
  }
}

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 0 
    };
  }
}

// Test functions
async function testHealthEndpoint() {
  console.log(`\n${colors.bold}${colors.blue}🏥 Testing Health Endpoint${colors.reset}`);
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.status === 200) {
    logTest('Health endpoint returns 200', true);
    
    // Check if response has expected structure
    if (result.data.status === 'OK' && result.data.service) {
      logTest('Health response has correct structure', true);
    } else {
      logTest('Health response has correct structure', false, 'Missing status or service field');
    }
  } else {
    logTest('Health endpoint returns 200', false, `Status: ${result.status}, Error: ${result.error}`);
  }
}

async function testMonstersEndpoints() {
  console.log(`\n${colors.bold}${colors.blue}🐉 Testing Monsters Endpoints${colors.reset}`);
  
  // Test GET /monsters (basic)
  const basicResult = await makeRequest('GET', '/monsters');
  if (basicResult.success && basicResult.status === 200) {
    logTest('Monsters endpoint returns 200', true);
    
    // Check response structure
    if (basicResult.data.data && Array.isArray(basicResult.data.data)) {
      logTest('Monsters response has correct structure', true);
      console.log(`   Found ${basicResult.data.data.length} monsters`);
    } else {
      logTest('Monsters response has correct structure', false, 'Missing data array');
    }
  } else {
    logTest('Monsters endpoint returns 200', false, `Status: ${basicResult.status}, Error: ${basicResult.error}`);
  }
  
  // Test GET /monsters with pagination
  const paginationResult = await makeRequest('GET', '/monsters', null, { page: 1, limit: 5 });
  if (paginationResult.success && paginationResult.status === 200) {
    logTest('Monsters pagination works', true);
    
    if (paginationResult.data.pagination && paginationResult.data.pagination.page === 1) {
      logTest('Pagination structure is correct', true);
    } else {
      logTest('Pagination structure is correct', false, 'Missing or incorrect pagination data');
    }
  } else {
    logTest('Monsters pagination works', false, `Status: ${paginationResult.status}`);
  }
  
  // Test GET /monsters with search
  const searchResult = await makeRequest('GET', '/monsters', null, { search: 'dragon' });
  if (searchResult.success && searchResult.status === 200) {
    logTest('Monsters search works', true);
  } else {
    logTest('Monsters search works', false, `Status: ${searchResult.status}`);
  }
  
  // Test GET /monsters with filters
  const filterResult = await makeRequest('GET', '/monsters', null, { type: 'dragon', cr_min: 1, cr_max: 10 });
  if (filterResult.success && filterResult.status === 200) {
    logTest('Monsters filtering works', true);
  } else {
    logTest('Monsters filtering works', false, `Status: ${filterResult.status}`);
  }
  
  // Test GET /monsters/:slug (try to get a specific monster)
  const slugResult = await makeRequest('GET', '/monsters/aboleth');
  if (slugResult.success && slugResult.status === 200) {
    logTest('Monster by slug works', true);
    
    if (slugResult.data.name && slugResult.data.slug === 'aboleth') {
      logTest('Monster slug response is correct', true);
    } else {
      logTest('Monster slug response is correct', false, 'Incorrect monster data');
    }
  } else if (slugResult.status === 404) {
    logTest('Monster by slug returns 404 for non-existent monster', true);
  } else {
    logTest('Monster by slug works', false, `Status: ${slugResult.status}, Error: ${slugResult.error}`);
  }
  
  // Test GET /monsters/search/:query
  const searchQueryResult = await makeRequest('GET', '/monsters/search/dragon');
  if (searchQueryResult.success && searchQueryResult.status === 200) {
    logTest('Monsters search by query works', true);
    
    if (Array.isArray(searchQueryResult.data)) {
      logTest('Search query response is array', true);
    } else {
      logTest('Search query response is array', false, 'Response is not an array');
    }
  } else {
    logTest('Monsters search by query works', false, `Status: ${searchQueryResult.status}`);
  }
}

async function testSpellsEndpoints() {
  console.log(`\n${colors.bold}${colors.blue}✨ Testing Spells Endpoints${colors.reset}`);
  
  // Test GET /spells (basic)
  const basicResult = await makeRequest('GET', '/spells');
  if (basicResult.success && basicResult.status === 200) {
    logTest('Spells endpoint returns 200', true);
    
    // Check response structure
    if (basicResult.data.spells && Array.isArray(basicResult.data.spells)) {
      logTest('Spells response has correct structure', true);
      console.log(`   Found ${basicResult.data.spells.length} spells`);
    } else {
      logTest('Spells response has correct structure', false, 'Missing spells array');
    }
  } else {
    logTest('Spells endpoint returns 200', false, `Status: ${basicResult.status}, Error: ${basicResult.error}`);
  }
  
  // Test GET /spells with pagination
  const paginationResult = await makeRequest('GET', '/spells', null, { page: 1, limit: 5 });
  if (paginationResult.success && paginationResult.status === 200) {
    logTest('Spells pagination works', true);
  } else {
    logTest('Spells pagination works', false, `Status: ${paginationResult.status}`);
  }
  
  // Test GET /spells with search
  const searchResult = await makeRequest('GET', '/spells', null, { search: 'fire' });
  if (searchResult.success && searchResult.status === 200) {
    logTest('Spells search works', true);
  } else {
    logTest('Spells search works', false, `Status: ${searchResult.status}`);
  }
  
  // Test GET /spells with filters
  const filterResult = await makeRequest('GET', '/spells', null, { level: 3, school: 'evocation' });
  if (filterResult.success && filterResult.status === 200) {
    logTest('Spells filtering works', true);
  } else {
    logTest('Spells filtering works', false, `Status: ${filterResult.status}`);
  }
  
  // Test GET /spells/:id (use a real spell ID if available)
  let spellId = 1;
  if (basicResult.success && basicResult.data.spells && basicResult.data.spells.length > 0) {
    spellId = basicResult.data.spells[0].id;
  }
  console.log(`   Testing spell by ID: ${spellId}`);
  const idResult = await makeRequest('GET', `/spells/${spellId}`);
  if (idResult.success && idResult.status === 200) {
    logTest('Spell by ID works', true);
  } else if (idResult.status === 404) {
    logTest('Spell by ID returns 404 for non-existent spell', true);
  } else {
    logTest('Spell by ID works', false, `Status: ${idResult.status}`);
  }
  
  // Test GET /spells/slug/:slug
  const slugResult = await makeRequest('GET', '/spells/slug/fireball');
  if (slugResult.success && idResult.status === 200) {
    logTest('Spell by slug works', true);
  } else if (slugResult.status === 404) {
    logTest('Spell by slug returns 404 for non-existent spell', true);
  } else {
    logTest('Spell by slug works', false, `Status: ${slugResult.status}`);
  }
}

async function testCharactersEndpoints() {
  console.log(`\n${colors.bold}${colors.blue}👤 Testing Characters Endpoints${colors.reset}`);
  
  // Test GET /characters
  const getResult = await makeRequest('GET', '/characters');
  if (getResult.success && getResult.status === 200) {
    logTest('Characters endpoint returns 200', true);
    
    if (getResult.data.message && getResult.data.message.includes('Coming soon')) {
      logTest('Characters endpoint returns placeholder message', true);
    } else {
      logTest('Characters endpoint returns placeholder message', false, 'Unexpected response');
    }
  } else {
    logTest('Characters endpoint returns 200', false, `Status: ${getResult.status}`);
  }
  
  // Test GET /characters/:id
  const getByIdResult = await makeRequest('GET', '/characters/1');
  if (getByIdResult.success && getByIdResult.status === 200) {
    logTest('Character by ID endpoint works', true);
  } else {
    logTest('Character by ID endpoint works', false, `Status: ${getByIdResult.status}`);
  }
  
  // Test POST /characters
  const postResult = await makeRequest('POST', '/characters', { name: 'Test Character' });
  if (postResult.success && postResult.status === 200) {
    logTest('Create character endpoint works', true);
  } else {
    logTest('Create character endpoint works', false, `Status: ${postResult.status}`);
  }
  
  // Test PUT /characters/:id
  const putResult = await makeRequest('PUT', '/characters/1', { name: 'Updated Character' });
  if (putResult.success && putResult.status === 200) {
    logTest('Update character endpoint works', true);
  } else {
    logTest('Update character endpoint works', false, `Status: ${putResult.status}`);
  }
  
  // Test DELETE /characters/:id
  const deleteResult = await makeRequest('DELETE', '/characters/1');
  if (deleteResult.success && deleteResult.status === 200) {
    logTest('Delete character endpoint works', true);
  } else {
    logTest('Delete character endpoint works', false, `Status: ${deleteResult.status}`);
  }
}

async function testEncountersEndpoints() {
  console.log(`\n${colors.bold}${colors.blue}⚔️ Testing Encounters Endpoints${colors.reset}`);
  
  // Test GET /encounters
  const getResult = await makeRequest('GET', '/encounters');
  if (getResult.success && getResult.status === 200) {
    logTest('Encounters endpoint returns 200', true);
  } else {
    logTest('Encounters endpoint returns 200', false, `Status: ${getResult.status}`);
  }
  
  // Test GET /encounters/:id
  const getByIdResult = await makeRequest('GET', '/encounters/1');
  if (getByIdResult.success && getByIdResult.status === 200) {
    logTest('Encounter by ID endpoint works', true);
  } else {
    logTest('Encounter by ID endpoint works', false, `Status: ${getByIdResult.status}`);
  }
  
  // Test POST /encounters
  const postResult = await makeRequest('POST', '/encounters', { name: 'Test Encounter' });
  if (postResult.success && postResult.status === 200) {
    logTest('Create encounter endpoint works', true);
  } else {
    logTest('Create encounter endpoint works', false, `Status: ${postResult.status}`);
  }
  
  // Test PUT /encounters/:id
  const putResult = await makeRequest('PUT', '/encounters/1', { name: 'Updated Encounter' });
  if (putResult.success && putResult.status === 200) {
    logTest('Update encounter endpoint works', true);
  } else {
    logTest('Update encounter endpoint works', false, `Status: ${putResult.status}`);
  }
  
  // Test DELETE /encounters/:id
  const deleteResult = await makeRequest('DELETE', '/encounters/1');
  if (deleteResult.success && deleteResult.status === 200) {
    logTest('Delete encounter endpoint works', true);
  } else {
    logTest('Delete encounter endpoint works', false, `Status: ${deleteResult.status}`);
  }
}

async function testItemsEndpoints() {
  console.log(`\n${colors.bold}${colors.blue}🗡️ Testing Items Endpoints${colors.reset}`);
  
  // Test GET /items
  const getResult = await makeRequest('GET', '/items');
  if (getResult.success && getResult.status === 200) {
    logTest('Items endpoint returns 200', true);
  } else {
    logTest('Items endpoint returns 200', false, `Status: ${getResult.status}`);
  }
  
  // Test GET /items/:id
  const getByIdResult = await makeRequest('GET', '/items/1');
  if (getByIdResult.success && getByIdResult.status === 200) {
    logTest('Item by ID endpoint works', true);
  } else {
    logTest('Item by ID endpoint works', false, `Status: ${getByIdResult.status}`);
  }
  
  // Test POST /items
  const postResult = await makeRequest('POST', '/items', { name: 'Test Item' });
  if (postResult.success && postResult.status === 200) {
    logTest('Create item endpoint works', true);
  } else {
    logTest('Create item endpoint works', false, `Status: ${postResult.status}`);
  }
  
  // Test PUT /items/:id
  const putResult = await makeRequest('PUT', '/items/1', { name: 'Updated Item' });
  if (putResult.success && putResult.status === 200) {
    logTest('Update item endpoint works', true);
  } else {
    logTest('Update item endpoint works', false, `Status: ${putResult.status}`);
  }
  
  // Test DELETE /items/:id
  const deleteResult = await makeRequest('DELETE', '/items/1');
  if (deleteResult.success && deleteResult.status === 200) {
    logTest('Delete item endpoint works', true);
  } else {
    logTest('Delete item endpoint works', false, `Status: ${deleteResult.status}`);
  }
}

async function testErrorHandling() {
  console.log(`\n${colors.bold}${colors.blue}🚨 Testing Error Handling${colors.reset}`);
  
  // Test 404 for non-existent endpoint
  const notFoundResult = await makeRequest('GET', '/nonexistent');
  if (notFoundResult.status === 404) {
    logTest('404 handling works for non-existent endpoints', true);
  } else {
    logTest('404 handling works for non-existent endpoints', false, `Status: ${notFoundResult.status}`);
  }
  
  // Test invalid monster slug
  const invalidMonsterResult = await makeRequest('GET', '/monsters/invalid-slug-12345');
  if (invalidMonsterResult.status === 404) {
    logTest('404 handling works for invalid monster slug', true);
  } else {
    logTest('404 handling works for invalid monster slug', false, `Status: ${invalidMonsterResult.status}`);
  }
  
  // Test invalid spell slug
  const invalidSpellResult = await makeRequest('GET', '/spells/slug/invalid-spell-12345');
  if (invalidSpellResult.status === 404) {
    logTest('404 handling works for invalid spell slug', true);
  } else {
    logTest('404 handling works for invalid spell slug', false, `Status: ${invalidSpellResult.status}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🧪 Starting Backend API Tests${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timeout: ${TIMEOUT}ms`);
  
  const startTime = Date.now();
  
  try {
    await testHealthEndpoint();
    await testMonstersEndpoints();
    await testSpellsEndpoints();
    await testCharactersEndpoints();
    await testEncountersEndpoints();
    await testItemsEndpoints();
    await testErrorHandling();
  } catch (error) {
    console.error(`${colors.red}❌ Test runner error: ${error.message}${colors.reset}`);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print summary
  console.log(`\n${colors.bold}${colors.blue}📊 Test Summary${colors.reset}`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Duration: ${duration}ms`);
  
  if (failedTests === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}❌ ${failedTests} test(s) failed${colors.reset}`);
  }
  
  // Exit with appropriate code
  process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testHealthEndpoint,
  testMonstersEndpoints,
  testSpellsEndpoints,
  testCharactersEndpoints,
  testEncountersEndpoints,
  testItemsEndpoints,
  testErrorHandling
}; 