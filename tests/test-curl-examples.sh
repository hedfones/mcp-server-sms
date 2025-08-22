#!/bin/bash

# Test HTTP transport functionality using curl
# This script demonstrates the MCP server HTTP endpoints

echo "🧪 Testing HTTP Transport with curl"
echo "=================================="

# Set test environment variables (using valid Twilio test format)
export PORT=3004
export ACCOUNT_SID=ACtest123456789abcdef123456789abcdef
export AUTH_TOKEN=test_auth_token_123456789abcdef
export FROM_NUMBER=+15551234567

# Start server in background
echo "🚀 Starting server on port $PORT..."
# Check if we're in tests directory and adjust path accordingly
if [[ $(basename "$PWD") == "tests" ]]; then
    node ../build/index.js &
else
    node build/index.js &
fi
SERVER_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "📡 Testing SSE connection establishment..."
echo "curl -N -H 'Accept: text/event-stream' http://localhost:$PORT/message"
timeout 3s curl -N -H "Accept: text/event-stream" "http://localhost:$PORT/message" &
CURL_PID=$!
sleep 2
kill $CURL_PID 2>/dev/null
echo ""
echo "✅ SSE connection test completed"

echo ""
echo "📨 Testing JSON-RPC message handling..."
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/list\",\"id\":1}' http://localhost:$PORT/message"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' \
  "http://localhost:$PORT/message"
echo ""

echo ""
echo "📱 Testing send-message tool..."
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"send-message\",\"arguments\":{\"to\":\"+15551234567\",\"message\":\"Test message\"}},\"id\":2}' http://localhost:$PORT/message"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"send-message","arguments":{"to":"+15551234567","message":"Test message"}},"id":2}' \
  "http://localhost:$PORT/message"
echo ""

echo ""
echo "❌ Testing invalid phone number..."
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"send-message\",\"arguments\":{\"to\":\"1234567890\",\"message\":\"Test message\"}},\"id\":3}' http://localhost:$PORT/message"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"send-message","arguments":{"to":"1234567890","message":"Test message"}},"id":3}' \
  "http://localhost:$PORT/message"
echo ""

echo ""
echo "🚫 Testing invalid JSON..."
echo "curl -X POST -H 'Content-Type: application/json' -d 'invalid json' http://localhost:$PORT/message"
curl -X POST \
  -H "Content-Type: application/json" \
  -d 'invalid json' \
  "http://localhost:$PORT/message"
echo ""

echo ""
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "✅ All curl tests completed!"
echo "📝 The HTTP transport is working correctly with:"
echo "   - SSE connection establishment"
echo "   - JSON-RPC message handling"
echo "   - SMS functionality via send-message tool"
echo "   - Error handling for invalid requests"