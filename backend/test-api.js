// test-api.js - A script to test API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Testing ${method} ${url}...`);
    const response = await fetch(`${BASE_URL}${url}`, options);
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.log('Non-JSON response:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      data = { text: text.substring(0, 100) + (text.length > 100 ? '...' : '') };
    }
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    console.log('-----------------------------------');
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error testing ${url}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  // Test health endpoint
  await testEndpoint('/api/health');
  
  // Test get suppliers
  await testEndpoint('/api/suppliers');
  
  // Test create supplier with valid data
  await testEndpoint('/api/suppliers', 'POST', {
    name: 'Test Supplier',
    phone: '1234567890',
    email: 'test@example.com',
    amount: 0,
    status: 'active'
  });
  
  // Test create supplier with invalid status
  await testEndpoint('/api/suppliers', 'POST', {
    name: 'Invalid Status Supplier',
    phone: '0987654321',
    email: 'invalid@example.com',
    amount: 0,
    status: 'invalid-status' // This should be corrected by our validation
  });
}

runTests().catch(console.error);