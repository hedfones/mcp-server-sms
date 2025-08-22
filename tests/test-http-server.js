#!/usr/bin/env node

/**
 * Test script for HTTP transport functionality
 * Tests SSE connection establishment and JSON-RPC message handling
 */

import http from 'http';
import { spawn } from 'child_process';

const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const MESSAGE_ENDPOINT = '/message';

let serverProcess = null;

// Test configuration
const tests = [
  { name: 'Server Health Check', test: testServerHealth },
  { name: 'SSE Connection Establishment', test: testSSEConnection },
  { name: 'JSON-RPC Message Handling', test: testJSONRPCMessage },
  { name: 'Invalid JSON Handling', test: testInvalidJSON },
  { name: 'Empty Request Handling', test: testEmptyRequest },
  { name: 'Method Not Allowed', test: testMethodNotAllowed },
  { name: 'Route Not Found', test: testRouteNotFound }
];

async function startTestServer() {
  console.log('🚀 Starting test server...');
  
  // Set test environment variables with valid Twilio format
  const env = {
    ...process.env,
    PORT: SERVER_PORT.toString(),
    ACCOUNT_SID: 'ACtest1234567890123456789012345678',
    AUTH_TOKEN: 'test_auth_token_1234567890123456789012345678',
    FROM_NUMBER: '+15551234567'
  };

  const buildPath = process.cwd().endsWith('/tests') ? '../build/index.js' : 'build/index.js';
  serverProcess = spawn('node', [buildPath], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Debug server output
  serverProcess.stdout.on('data', (data) => {
    console.log('Server stdout:', data.toString());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return new Promise((resolve, reject) => {
    let output = '';
    
    let resolved = false;
    serverProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log('Server stderr:', chunk);
      if (!resolved && output.includes('running on HTTP port')) {
        console.log('✅ Test server started successfully');
        resolved = true;
        clearTimeout(timeoutId);
        resolve();
      }
    });

    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      clearTimeout(timeoutId);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        clearTimeout(timeoutId);
        reject(new Error(`Server process exited with code ${code}`));
      }
    });

    // Timeout after 15 seconds
    const timeoutId = setTimeout(() => {
      console.error('❌ Server startup timeout - no output received');
      reject(new Error('Server startup timeout'));
    }, 15000);
  });
}

async function stopTestServer() {
  if (serverProcess) {
    console.log('🛑 Stopping test server...');
    serverProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
    serverProcess = null;
  }
}

async function makeRequest(options, data = null, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      // For SSE connections, we don't wait for 'end' event
      if (res.headers['content-type'] === 'text/event-stream') {
        // For SSE, resolve immediately with headers and status
        setTimeout(() => {
          req.destroy();
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }, 1000); // Give it 1 second to establish connection
        return;
      }
      
      res.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    // Add timeout
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testServerHealth() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: MESSAGE_ENDPOINT,
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream'
      }
    });

    if (response.statusCode === 200 && response.headers['content-type'] === 'text/event-stream') {
      console.log('✅ Server health check passed');
      return true;
    } else {
      console.log(`❌ Server health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server health check failed: ${error.message}`);
    return false;
  }
}

async function testSSEConnection() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: MESSAGE_ENDPOINT,
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

    const expectedHeaders = [
      'text/event-stream',
      'no-cache',
      'keep-alive'
    ];

    const contentType = response.headers['content-type'];
    const cacheControl = response.headers['cache-control'];
    const connection = response.headers['connection'];

    if (response.statusCode === 200 && 
        contentType === 'text/event-stream' &&
        cacheControl === 'no-cache' &&
        connection === 'keep-alive') {
      console.log('✅ SSE connection establishment test passed');
      return true;
    } else {
      console.log(`❌ SSE connection test failed:`);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Content-Type: ${contentType}`);
      console.log(`  Cache-Control: ${cacheControl}`);
      console.log(`  Connection: ${connection}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ SSE connection test failed: ${error.message}`);
    return false;
  }
}

async function testJSONRPCMessage() {
  try {
    const jsonRpcMessage = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    };

    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: MESSAGE_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, JSON.stringify(jsonRpcMessage));

    if (response.statusCode === 200) {
      const responseBody = JSON.parse(response.body);
      if (responseBody.status === 'received') {
        console.log('✅ JSON-RPC message handling test passed');
        return true;
      } else {
        console.log(`❌ JSON-RPC test failed: unexpected response body ${response.body}`);
        return false;
      }
    } else {
      console.log(`❌ JSON-RPC test failed: ${response.statusCode} - ${response.body}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ JSON-RPC test failed: ${error.message}`);
    return false;
  }
}

async function testInvalidJSON() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: MESSAGE_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, 'invalid json');

    if (response.statusCode === 400) {
      const responseBody = JSON.parse(response.body);
      if (responseBody.error === 'Invalid JSON') {
        console.log('✅ Invalid JSON handling test passed');
        return true;
      }
    }
    
    console.log(`❌ Invalid JSON test failed: ${response.statusCode} - ${response.body}`);
    return false;
  } catch (error) {
    console.log(`❌ Invalid JSON test failed: ${error.message}`);
    return false;
  }
}

async function testEmptyRequest() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: MESSAGE_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, '');

    if (response.statusCode === 400) {
      const responseBody = JSON.parse(response.body);
      if (responseBody.error === 'Empty request body') {
        console.log('✅ Empty request handling test passed');
        return true;
      }
    }
    
    console.log(`❌ Empty request test failed: ${response.statusCode} - ${response.body}`);
    return false;
  } catch (error) {
    console.log(`❌ Empty request test failed: ${error.message}`);
    return false;
  }
}

async function testMethodNotAllowed() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: MESSAGE_ENDPOINT,
      method: 'PUT'
    });

    if (response.statusCode === 405 && response.body === 'Method Not Allowed') {
      console.log('✅ Method not allowed test passed');
      return true;
    }
    
    console.log(`❌ Method not allowed test failed: ${response.statusCode} - ${response.body}`);
    return false;
  } catch (error) {
    console.log(`❌ Method not allowed test failed: ${error.message}`);
    return false;
  }
}

async function testRouteNotFound() {
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: '/nonexistent',
      method: 'GET'
    });

    if (response.statusCode === 404 && response.body === 'Not Found') {
      console.log('✅ Route not found test passed');
      return true;
    }
    
    console.log(`❌ Route not found test failed: ${response.statusCode} - ${response.body}`);
    return false;
  } catch (error) {
    console.log(`❌ Route not found test failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting HTTP Transport Tests\n');
  
  try {
    // Build the project first
    console.log('🔨 Building project...');
    const { spawn: syncSpawn } = await import('child_process');
    const buildProcess = syncSpawn('npm', ['run', 'build'], { 
      stdio: 'inherit', 
      cwd: process.cwd().endsWith('/tests') ? '..' : '.'
    });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build completed successfully\n');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });

    // Start the test server
    await startTestServer();
    
    // Run all tests
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
      console.log(`\n🔍 Running: ${test.name}`);
      const result = await test.test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    }
    
    // Print results
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! HTTP transport is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
  } finally {
    await stopTestServer();
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  await stopTestServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  await stopTestServer();
  process.exit(0);
});

// Run the tests
runTests().catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});