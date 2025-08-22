# HTTP Transport Tests

This directory contains comprehensive tests for the HTTP transport functionality of the Twilio SMS MCP Server.

## Test Files

### `test-http-server.js`
**Purpose**: Tests basic HTTP server functionality and MCP protocol handling
**Coverage**:
- Server health check
- SSE connection establishment 
- JSON-RPC message handling over HTTP POST
- Invalid JSON handling
- Empty request handling
- Method not allowed responses
- Route not found responses

**Usage**:
```bash
node tests/test-http-server.js
```

### `test-sms-http.js`
**Purpose**: Tests SMS functionality over HTTP transport
**Coverage**:
- Send-message tool via HTTP POST request
- Valid SMS request handling
- Invalid phone number format validation
- Missing parameter validation
- Empty message handling
- Twilio error handling

**Usage**:
```bash
node tests/test-sms-http.js
```

### `test-twilio-integration.js`
**Purpose**: Tests actual Twilio API integration and error responses
**Coverage**:
- Twilio authentication error handling
- Phone number validation with various formats
- API error response handling

**Usage**:
```bash
node tests/test-twilio-integration.js
```

### `test-curl-examples.sh`
**Purpose**: Demonstrates HTTP transport functionality using curl commands
**Coverage**:
- SSE connection establishment via curl
- JSON-RPC message handling via curl POST
- SMS functionality demonstration
- Error handling examples

**Usage**:
```bash
chmod +x tests/test-curl-examples.sh
./tests/test-curl-examples.sh
```

## Requirements Covered

These tests verify the following requirements from the Railway deployment specification:

- **Requirement 1.1**: HTTP server starts correctly and binds to the specified port
- **Requirement 1.3**: SSE connection establishment works properly
- **Requirement 3.1**: JSON-RPC message handling over HTTP POST
- **Requirement 3.2**: MCP protocol compatibility over HTTP transport
- **Requirement 3.4**: SMS functionality works correctly over HTTP

## Running All Tests

To run all tests sequentially:

```bash
# Run basic HTTP server tests
node tests/test-http-server.js

# Run SMS functionality tests  
node tests/test-sms-http.js

# Run Twilio integration tests
node tests/test-twilio-integration.js

# Run curl examples
./tests/test-curl-examples.sh
```

## Test Environment

All tests use mock Twilio credentials and test ports to avoid conflicts:
- `test-http-server.js`: Port 3001
- `test-sms-http.js`: Port 3002  
- `test-twilio-integration.js`: Port 3003
- `test-curl-examples.sh`: Port 3004

## Expected Results

All tests should pass with 100% success rate when the HTTP transport is working correctly. The tests verify both successful operations and proper error handling for various edge cases.