#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import twilio from "twilio";
import http from "http";

// Environment variables validation
const requiredEnvVars = ["ACCOUNT_SID", "AUTH_TOKEN", "FROM_NUMBER"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable ${envVar}`);
    console.error(`For Railway deployment, ensure ${envVar} is set in your Railway project environment variables.`);
    console.error(`Visit your Railway project dashboard to configure environment variables.`);
    process.exit(1);
  }
}

// PORT environment variable handling with Railway support and default fallback
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Validate PORT is a valid number
if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  console.error(`Error: Invalid PORT environment variable: ${process.env.PORT}`);
  console.error(`PORT must be a valid number between 1 and 65535.`);
  console.error(`Railway automatically provides a PORT variable - ensure it's not being overridden.`);
  process.exit(1);
}

// Initialize Twilio client
const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

// Create MCP server
const server = new McpServer({
    name: "twilio-sms",
    version: "1.0.0",
});

server.prompt(
  "send-greeting",
  {
    to: z.string().describe("Recipient's phone number in E.164 format (e.g., +11234567890)"),
    occasion: z.string().describe("The occasion for the greeting (e.g., birthday, holiday)")
  },
  ({ to, occasion }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please write a warm, personalized greeting for ${occasion} and send it as a text message to ${to}. Make it engaging and friendly.`
      }
    }]
  })
);

server.prompt(
  "send-haiku",
  {
    theme: z.string().describe("The theme of the haiku"),
    to: z.string().describe("Recipient's phone number in E.164 format (e.g., +11234567890)")
  },
  ({ to, theme }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Please write a warm, personalized greeting for ${theme} and send it as a text message to ${to}. Make it engaging and friendly.`
      }
    }]
  })
);


// Add send message tool
server.tool(
  "send-message",
  "Send an SMS message via Twilio",
  {
    to: z.string().describe("Recipient phone number in E.164 format (e.g., +11234567890)"),
    message: z.string().describe("Message content to send")
  },
  async ({ to, message }) => {
    try {
      // Validate phone number format
      if (!to.startsWith("+")) {
        return {
          content: [{
            type: "text",
            text: "Error: Phone number must be in E.164 format (e.g., +11234567890)"
          }],
          isError: true
        };
      }

      // Send message via Twilio
      const response = await client.messages.create({
        body: message,
        from: process.env.FROM_NUMBER,
        to: to
      });

      return {
        content: [{
          type: "text",
          text: `Message sent successfully! Message SID: ${response.sid}`
        }]
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        content: [{
          type: "text",
          text: `Error sending message: ${error instanceof Error ? error.message : "Unknown error"}`
        }],
        isError: true
      };
    }
  }
);

// Start server
async function main() {
  // Create HTTP server with request handling
  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    
    // Handle SSE endpoint for MCP communication
    if (url.pathname === '/message') {
      if (req.method === 'GET') {
        // GET request handler for SSE connection establishment
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        });

        try {
          // Create SSE transport and connect MCP server
          const transport = new SSEServerTransport('/message', res);
          
          // Add transport error handling with logging
          transport.onerror = (error) => {
            console.error('SSE transport error:', error);
          };
          
          await server.connect(transport);
          
          // Keep connection alive and handle disconnection
          req.on('close', () => {
            console.error('SSE connection closed by client');
          });
          
          req.on('error', (error) => {
            console.error('SSE request error:', error);
          });
          
        } catch (error) {
          console.error('Error establishing SSE connection:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Failed to establish SSE connection',
            details: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
        
      } else if (req.method === 'POST') {
        // POST request handler for MCP message processing
        let body = '';
        const maxBodySize = 1024 * 1024; // 1MB limit
        
        req.on('data', (chunk) => {
          body += chunk.toString();
          
          // Prevent oversized requests
          if (body.length > maxBodySize) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request body too large' }));
            req.destroy();
            return;
          }
        });
        
        req.on('error', (error) => {
          console.error('POST request error:', error);
          if (!res.headersSent) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request error' }));
          }
        });
        
        req.on('end', async () => {
          try {
            // Implement malformed request validation and error responses
            if (!body.trim()) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Empty request body' }));
              return;
            }

            // Parse and validate JSON-RPC message
            const jsonRpcMessage = JSON.parse(body);
            
            // Basic JSON-RPC validation
            if (!jsonRpcMessage.jsonrpc || !jsonRpcMessage.method || jsonRpcMessage.id === undefined) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON-RPC message format' }));
              return;
            }
            
            // Acknowledge the message (full processing handled by SSE transport)
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'received' }));
            
          } catch (error) {
            console.error('Error processing POST request:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Invalid JSON',
              details: error instanceof Error ? error.message : 'Unknown error'
            }));
          }
        });
        
      } else {
        // Method not allowed
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
      }
    } else {
      // Route not found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  // Configure server to bind to :: (IPv6) address for Railway compatibility
  httpServer.listen(PORT, "::", () => {
    console.error(`Twilio SMS MCP Server running on HTTP port ${PORT} (IPv6)`);
    console.error(`Server is ready for Railway deployment. Access via your Railway app URL.`);
    console.error(`MCP endpoint available at: /message`);
  });

  // Handle IPv6 binding failures gracefully
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Error: Port ${PORT} is already in use`);
      console.error(`On Railway, this usually indicates a deployment configuration issue.`);
      console.error(`Check your Railway service logs and ensure no other processes are using this port.`);
    } else if (error.code === 'EADDRNOTAVAIL') {
      console.error(`Error: IPv6 address not available, falling back to IPv4`);
      console.error(`Railway supports IPv6, but falling back to IPv4 for compatibility.`);
      // Fallback to IPv4 if IPv6 fails
      httpServer.listen(PORT, '0.0.0.0', () => {
        console.error(`Twilio SMS MCP Server running on HTTP port ${PORT} (IPv4 fallback)`);
        console.error(`Server is ready for Railway deployment. Access via your Railway app URL.`);
      });
    } else {
      console.error(`HTTP server error: ${error.message}`);
      console.error(`For Railway deployment issues, check your service logs in the Railway dashboard.`);
    }
  });
}

main().catch((error) => {
  console.error("Fatal error starting server:", error);
  console.error("For Railway deployment, check your environment variables and service configuration.");
  console.error("Ensure all required Twilio credentials are set in your Railway project settings.");
  process.exit(1);
});