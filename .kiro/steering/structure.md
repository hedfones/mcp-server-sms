# Project Structure

## Root Directory
```
├── src/           # Source TypeScript files
├── build/         # Compiled JavaScript output (generated)
├── assets/        # Static assets (demo GIFs, images)
├── .kiro/         # Kiro configuration and steering
├── package.json   # Project metadata and dependencies
├── tsconfig.json  # TypeScript configuration
├── README.md      # Project documentation
└── LICENSE        # MIT license file
```

## Source Organization
- **Single Entry Point**: `src/index.ts` contains the entire MCP server implementation
- **Executable**: Uses shebang `#!/usr/bin/env node` for direct execution
- **Modular Design**: Server setup, tool definitions, and prompts in one file

## Key Architectural Patterns

### MCP Server Structure
1. **Environment Validation**: Check required env vars at startup
2. **Client Initialization**: Set up Twilio client with credentials
3. **Server Creation**: Initialize MCP server with name/version
4. **Prompt Registration**: Define reusable prompt templates
5. **Tool Registration**: Define available tools (send-message)
6. **Transport Setup**: Use stdio transport for communication

### Error Handling
- Validate environment variables at startup (fail fast)
- Validate phone number format before API calls
- Wrap Twilio API calls in try/catch blocks
- Return structured error responses with `isError: true`

### Code Conventions
- Use ES modules and modern JavaScript features
- Strict TypeScript configuration
- Zod schemas for runtime validation
- Descriptive parameter documentation for MCP tools
- Console.error for server-side logging (not user-facing)

## Build Artifacts
- Compiled files go to `build/` directory
- Main executable: `build/index.js`
- Files array in package.json includes only `build/` for publishing