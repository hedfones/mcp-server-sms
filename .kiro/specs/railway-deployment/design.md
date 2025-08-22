# Design Document

## Overview

This design transforms the existing stdio-based MCP server into an HTTP-based server suitable for Railway deployment. The server will use SSE (Server-Sent Events) transport from the MCP SDK to handle HTTP connections while maintaining all existing SMS functionality through Twilio.

## Architecture

### Current Architecture
- **Transport**: StdioServerTransport (local process communication)
- **Deployment**: Local execution via npx
- **Communication**: Standard input/output streams

### New Architecture
- **Transport**: SSEServerTransport (HTTP-based communication)
- **Deployment**: Railway cloud platform
- **Communication**: HTTP POST requests and Server-Sent Events
- **Server**: Node.js HTTP server listening on Railway-provided PORT
- **Binding**: IPv6 (::) to support Railway's infrastructure

### Key Changes
1. Replace StdioServerTransport with SSEServerTransport
2. Add HTTP server using Node.js built-in `http` module
3. Configure server to bind to IPv6 address (::)
4. Add Railway configuration file (railway.toml)
5. Update package.json scripts for Railway deployment

## Components and Interfaces

### HTTP Server Component
```typescript
// New HTTP server setup
const server = http.createServer()
const transport = new SSEServerTransport("/message", response)
```

**Responsibilities:**
- Handle incoming HTTP requests
- Route GET requests to SSE connection establishment
- Route POST requests to message handling
- Bind to Railway's PORT environment variable
- Support IPv6 connections

### SSE Transport Integration
```typescript
// SSE transport replaces stdio transport
const transport = new SSEServerTransport("/message", response)
await mcpServer.connect(transport)
```

**Responsibilities:**
- Establish SSE connection for real-time communication
- Handle incoming JSON-RPC messages via HTTP POST
- Send responses via Server-Sent Events
- Maintain session management

### Railway Configuration
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node build/index.js"
```

**Responsibilities:**
- Define build process using Nixpacks
- Specify Node.js start command
- Configure deployment settings

## Data Models

### Environment Variables
The server requires the same environment variables as before:
- `ACCOUNT_SID`: Twilio account identifier
- `AUTH_TOKEN`: Twilio authentication token  
- `FROM_NUMBER`: Twilio phone number in E.164 format
- `PORT`: Railway-provided port (new requirement)

### HTTP Request/Response Models
```typescript
// GET /message - SSE connection establishment
// Response: text/event-stream with MCP protocol messages

// POST /message - Client message sending  
// Request body: JSON-RPC message
// Response: 200 OK or error status
```

### Session Management
```typescript
interface SessionData {
  sessionId: string;
  transport: SSEServerTransport;
  mcpServer: McpServer;
}
```

## Error Handling

### Environment Variable Validation
- Validate all required environment variables at startup
- Exit with clear error messages if variables are missing
- Default PORT to 3000 if not provided (for local testing)

### HTTP Error Handling
```typescript
// Handle malformed requests
if (!isValidJSONRPC(body)) {
  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Invalid JSON-RPC message' }));
  return;
}

// Handle transport errors
transport.onerror = (error) => {
  console.error('Transport error:', error);
  // Attempt to reconnect or graceful shutdown
};
```

### Railway-Specific Error Handling
- Handle IPv6 binding failures gracefully
- Provide clear error messages for deployment issues
- Log errors to stderr for Railway log collection

## Testing Strategy

### Local Testing
```bash
# Test with local HTTP server
PORT=3000 npm start

# Test SSE connection
curl -N -H "Accept: text/event-stream" http://localhost:3000/message

# Test message sending
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' \
  http://localhost:3000/message
```

### Railway Testing
1. **Deployment Test**: Verify successful Railway deployment
2. **Health Check**: Confirm server responds to HTTP requests
3. **MCP Protocol Test**: Validate JSON-RPC message handling
4. **SMS Integration Test**: Confirm Twilio functionality works remotely
5. **IPv6 Connectivity Test**: Verify server accepts IPv6 connections

### Integration Testing
```typescript
// Test MCP tool functionality over HTTP
const response = await fetch('https://app.railway.app/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'send-message',
      arguments: { to: '+1234567890', message: 'Test message' }
    },
    id: 1
  })
});
```

## Implementation Considerations

### Backward Compatibility
- Maintain existing tool definitions and prompts
- Keep same Twilio integration logic
- Preserve error handling behavior
- Support both local (stdio) and remote (HTTP) modes via environment detection

### Performance
- SSE connections are persistent, reducing connection overhead
- HTTP POST requests are stateless and efficient
- Railway auto-scaling handles traffic spikes
- IPv6 support provides better routing performance

### Security
- Railway provides HTTPS termination automatically
- Environment variables are securely managed by Railway
- No authentication required as MCP handles security at protocol level
- Input validation prevents malformed requests

### Monitoring
- Railway provides built-in logging and metrics
- Console.error outputs are captured in Railway logs
- Health checks can be configured for automatic restarts
- Deployment status is visible in Railway dashboard