# Technology Stack

## Core Technologies
- **Runtime**: Node.js >= 18 (ES2022 target)
- **Language**: TypeScript with strict mode enabled
- **Module System**: ES modules (type: "module")
- **Build Target**: Node16 module resolution

## Key Dependencies
- `@modelcontextprotocol/sdk`: MCP server framework
- `twilio`: Official Twilio API client
- `zod`: Runtime type validation and schema definition

## Development Dependencies
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `shx`: Cross-platform shell commands

## Build System
- **Compiler**: TypeScript compiler (tsc)
- **Output**: `./build` directory
- **Entry Point**: `build/index.js` (executable)

## Common Commands
```bash
# Build the project
npm run build

# Watch mode for development
npm run watch

# Prepare for publishing (runs build)
npm run prepare

# Test the server locally
npx -y @yiyang.1i/sms-mcp-server
```

## Environment Configuration
Required environment variables:
- `ACCOUNT_SID`: Twilio account SID
- `AUTH_TOKEN`: Twilio authentication token  
- `FROM_NUMBER`: Twilio phone number in E.164 format

## Distribution
- Published as npm package with executable binary
- Designed to run via `npx` without local installation
- Uses stdio transport for MCP communication