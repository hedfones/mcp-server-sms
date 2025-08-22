---
inclusion: always
---

# Project Structure & Architecture

## File Organization
- **Single Entry Point**: All code lives in `src/index.ts` - do not split into multiple files
- **Build Output**: TypeScript compiles to `build/index.js` (executable with shebang)
- **Tests**: Located in `tests/` directory with shell scripts and Node.js test files
- **Assets**: Demo materials in `assets/` directory

## MCP Server Implementation Pattern
Follow this exact initialization sequence in `src/index.ts`:
1. Environment validation (ACCOUNT_SID, AUTH_TOKEN, FROM_NUMBER)
2. Twilio client initialization
3. MCP server creation with name/version
4. Prompt registration (greeting, notification, haiku templates)
5. Tool registration (send-message only)
6. Stdio transport setup and connection

## Code Style Requirements
- **ES Modules**: Use `import/export`, not CommonJS
- **Strict TypeScript**: Enable all strict mode options
- **Zod Validation**: Use Zod schemas for runtime type checking
- **Error Handling**: Always wrap Twilio calls in try/catch, return `{isError: true}` format
- **Phone Numbers**: Validate E.164 format before API calls
- **Logging**: Use `console.error()` for server logs, structured responses for users

## Architecture Constraints
- **Monolithic Design**: Keep all server logic in single file for simplicity
- **Fail Fast**: Validate environment and inputs at startup/request time
- **MCP Compliance**: Follow MCP protocol exactly for tool definitions and responses
- **Executable Package**: Must work with `npx` without local installation

## Build & Distribution
- Compile to `build/` directory only
- Package.json `files` array includes only `build/`
- Main entry point: `build/index.js`
- Use `shx` for cross-platform shell commands in npm scripts