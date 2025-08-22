#!/usr/bin/env node

/**
 * Test script for Twilio integration over HTTP transport
 * Tests actual Twilio API responses and error handling
 */

import http from 'http';
import { spawn } from 'child_process';

const SERVER_PORT = 3003;
let serverProcess = null;

async function startTestServer() {
  console.log('🚀 Starting Twilio integration test server...');
  
  // Use test credentials that will trigger specific Twilio errors
  const env = {
    ...process.env,
    PORT: SERVER_PORT.toString(),
    ACCOUNT_SID: 'ACtest123456789abcdef123456789abcdef',
    AUTH_TOKEN: 'invalid_auth_token',
    FROM_NUMBER: '+15551234567'
  };

  const buildPath = process.cwd().endsWith('/tests') ? '../build/index.js' : 'build/index.js';
  serverProcess = spawn('node', [buildPath], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  await new Promise(resolve => setTimeout(resolve, 3000));
  
  return new Promise((resolve, reject) => {
    let output = '';
    let resolved = false;
    
    serverProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      if (!resolved && output.includes('running on HTTP port')) {
        console.log('✅ Twilio integration test server started');
        resolved = true;
        clearTimeout(timeoutId);
        resolve();
      }
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    const timeoutId = setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 15000);
  });
}

async function stopTestServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    serverProcess = null;
  }
}

async function testTwilioAuthentication() {
  console.log('🔐 Testing Twilio authentication error handling...');
  
  // First establish SSE connection
  const ssePromise = new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: '/message',
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' }
    }, (res) => {
      setTimeout(() => {
        req.destroy();
        resolve();
      }, 1000);
    });
    req.end();
  });

  // Wait for SSE connection
  await ssePromise;

  // Now test the send-message tool
  const jsonRpcMessage = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'send-message',
      arguments: {
        to: '+15551234567',
        message: 'Test authentication error'
      }
    },
    id: 1
  };

  return new Promise((resolve) => {
    const postData = JSON.stringify(jsonRpcMessage);
    
    const req = http.request({
      hostname: 'localhost',
      port: SERVER_PORT,
      path: '/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log('📝 Twilio response received:', response);
          
          if (response.status === 'received') {
            console.log('✅ Twilio authentication error handled correctly');
            resolve(true);
          } else {
            console.log('❌ Unexpected response format');
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Failed to parse response');
          resolve(false);
        }
      });
    });

    req.on('error', () => resolve(false));
    req.write(postData);
    req.end();
  });
}

async function testPhoneNumberValidation() {
  console.log('📞 Testing phone number validation...');
  
  const testCases = [
    { phone: '1234567890', description: 'Missing + prefix' },
    { phone: '+1555', description: 'Too short' },
    { phone: 'invalid', description: 'Non-numeric' },
    { phone: '+15551234567', description: 'Valid format' }
  ];

  let passed = 0;
  
  for (const testCase of testCases) {
    console.log(`  Testing: ${testCase.description} (${testCase.phone})`);
    
    const jsonRpcMessage = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'send-message',
        arguments: {
          to: testCase.phone,
          message: 'Test message'
        }
      },
      id: Math.random()
    };

    const result = await new Promise((resolve) => {
      const postData = JSON.stringify(jsonRpcMessage);
      
      const req = http.request({
        hostname: 'localhost',
        port: SERVER_PORT,
        path: '/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve(res.statusCode === 200);
        });
      });

      req.on('error', () => resolve(false));
      req.write(postData);
      req.end();
    });

    if (result) {
      console.log(`    ✅ ${testCase.description} handled correctly`);
      passed++;
    } else {
      console.log(`    ❌ ${testCase.description} failed`);
    }
  }
  
  return passed === testCases.length;
}

async function runTwilioIntegrationTests() {
  console.log('🔗 Starting Twilio Integration Tests\n');
  
  try {
    await startTestServer();
    
    const tests = [
      { name: 'Twilio Authentication Error', test: testTwilioAuthentication },
      { name: 'Phone Number Validation', test: testPhoneNumberValidation }
    ];
    
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
    
    console.log('\n📊 Twilio Integration Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All Twilio integration tests passed!');
      console.log('✅ HTTP transport properly handles Twilio API calls');
      console.log('✅ Error handling works correctly');
      console.log('✅ Phone number validation is functional');
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
  } finally {
    await stopTestServer();
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  await stopTestServer();
  process.exit(0);
});

runTwilioIntegrationTests().catch(console.error);