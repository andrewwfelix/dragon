# Backend API Testing

This document explains how to test the D&D 5e Backend API endpoints.

## Prerequisites

1. Make sure the backend server is running on `http://localhost:3001`
2. Ensure you have the required dependencies installed

## Installing Dependencies

```bash
cd backend
npm install
```

## Running the Tests

### Test All Endpoints

```bash
npm run test:endpoints
```

This will run a comprehensive test suite that checks:

- ✅ Health endpoint
- 🐉 Monsters endpoints (GET, search, filtering, pagination)
- ✨ Spells endpoints (GET, search, filtering, pagination)
- 👤 Characters endpoints (placeholder endpoints)
- ⚔️ Encounters endpoints (placeholder endpoints)
- 🗡️ Items endpoints (placeholder endpoints)
- 🚨 Error handling (404 responses)

### Test Output

The test script provides colored output with:
- **Green ✅** for passed tests
- **Red ❌** for failed tests
- **Yellow** for error details
- **Blue** for section headers

Example output:
```
🧪 Starting Backend API Tests
Base URL: http://localhost:3001/api
Timeout: 10000ms

🏥 Testing Health Endpoint
✅ PASS - Health endpoint returns 200
✅ PASS - Health response has correct structure

🐉 Testing Monsters Endpoints
✅ PASS - Monsters endpoint returns 200
✅ PASS - Monsters response has correct structure
   Found 20 monsters
✅ PASS - Monsters pagination works
✅ PASS - Pagination structure is correct
...

📊 Test Summary
Total tests: 25
Passed: 25
Failed: 0
Duration: 1234ms

🎉 All tests passed!
```

## Individual Test Functions

You can also run individual test functions by importing the test module:

```javascript
const { testHealthEndpoint, testMonstersEndpoints } = require('./test-endpoints');

// Run specific tests
await testHealthEndpoint();
await testMonstersEndpoints();
```

## Test Coverage

The test suite covers:

### Health Endpoint
- GET `/api/health` - Basic health check
- Response structure validation

### Monsters Endpoints
- GET `/api/monsters` - Get all monsters
- GET `/api/monsters?page=1&limit=5` - Pagination
- GET `/api/monsters?search=dragon` - Search
- GET `/api/monsters?type=dragon&cr_min=1&cr_max=10` - Filtering
- GET `/api/monsters/aboleth` - Get by slug
- GET `/api/monsters/search/dragon` - Search by query

### Spells Endpoints
- GET `/api/spells` - Get all spells
- GET `/api/spells?page=1&limit=5` - Pagination
- GET `/api/spells?search=fire` - Search
- GET `/api/spells?level=3&school=evocation` - Filtering
- GET `/api/spells/1` - Get by ID
- GET `/api/spells/slug/fireball` - Get by slug

### Placeholder Endpoints
- Characters (GET, POST, PUT, DELETE)
- Encounters (GET, POST, PUT, DELETE)
- Items (GET, POST, PUT, DELETE)

### Error Handling
- 404 responses for non-existent endpoints
- 404 responses for invalid slugs/IDs

## Configuration

You can modify the test configuration in `test-endpoints.js`:

```javascript
const BASE_URL = 'http://localhost:3001/api';  // Change if needed
const TIMEOUT = 10000;  // Request timeout in milliseconds
```

## Troubleshooting

### Common Issues

1. **Backend not running**: Make sure the backend server is started with `npm run dev`
2. **Database connection issues**: Check your `.env.local` file has correct Supabase credentials
3. **Timeout errors**: Increase the `TIMEOUT` value if your database is slow
4. **404 errors**: Some tests expect 404 responses for invalid data - this is normal

### Debug Mode

To see more detailed error information, you can modify the test script to log full error responses:

```javascript
// In makeRequest function, add:
console.log('Full error:', error.response?.data);
```

## Adding New Tests

To add tests for new endpoints:

1. Create a new test function following the existing pattern
2. Add it to the `runAllTests()` function
3. Use the `logTest()` helper for consistent output
4. Use the `makeRequest()` helper for API calls

Example:
```javascript
async function testNewEndpoint() {
  console.log(`\n${colors.bold}${colors.blue}🔧 Testing New Endpoint${colors.reset}`);
  
  const result = await makeRequest('GET', '/new-endpoint');
  if (result.success && result.status === 200) {
    logTest('New endpoint returns 200', true);
  } else {
    logTest('New endpoint returns 200', false, `Status: ${result.status}`);
  }
}
``` 