---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies
- **Runtime**: Node.js >= 18 with ES2022 target
- **Language**: TypeScript with strict mode (all strict options enabled)
- **Module System**: ES modules only (`type: "module"` in package.json)
- **Build Target**: Node16 module resolution

## Critical Dependencies
- `@modelcontextprotocol/sdk`: MCP server framework - use for server creation and tool registration
- `twilio`: Official Twilio API client - initialize with ACCOUNT_SID and AUTH_TOKEN
- `zod`: Runtime validation - use for all input validation and schema definitions

## Code Style Requirements
- **Import Style**: Use ES6 imports (`import/export`), never CommonJS (`require`)
- **Type Safety**: All functions must have explicit return types
- **Validation**: Use Zod schemas for runtime type checking on all external inputs
- **Error Handling**: Always wrap Twilio API calls in try/catch blocks
- **Phone Numbers**: Validate E.164 format (+1234567890) before any Twilio calls
- **Logging**: Use `console.error()` for server logs, structured JSON for user responses

## Build & Development
```bash
# Build TypeScript to executable
npm run build

# Development with auto-rebuild
npm run watch

# Test locally (requires env vars)
npx -y @yiyang.1i/sms-mcp-server
```

## Environment Variables (Required)
- `ACCOUNT_SID`: Twilio account identifier
- `AUTH_TOKEN`: Twilio authentication token
- `FROM_NUMBER`: Twilio phone number in E.164 format

## Distribution Model
- Single executable package published to npm
- Must work via `npx` without local installation
- Uses stdio transport for MCP communication
- Entry point: `build/index.js` with shebang for direct execution