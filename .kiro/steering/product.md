---
inclusion: always
---

# SMS MCP Server Product Guidelines

## Core Purpose
This MCP server bridges AI assistants with Twilio's SMS API, enabling programmatic text messaging through natural language interactions. The server follows MCP protocol standards and provides a secure, validated interface for SMS operations.

## Key Capabilities
- **SMS Messaging**: Send text messages via Twilio API with proper validation
- **Prompt Templates**: Pre-built prompts for common scenarios (greetings, notifications, haikus)
- **Security**: Environment-based credential management with validation
- **Phone Validation**: Strict E.164 format enforcement before API calls
- **Error Handling**: Structured error responses with user-friendly messages

## Architecture Principles
- **Single Responsibility**: One tool (`send-message`) with clear, focused functionality
- **Fail Fast**: Validate environment and inputs before processing
- **MCP Compliance**: Follow MCP protocol for tool definitions and responses
- **Executable Package**: Designed for npx execution without local installation

## User Experience Guidelines
- **Clear Tool Descriptions**: Provide comprehensive parameter documentation
- **Helpful Examples**: Include practical use cases in prompts and documentation
- **Error Clarity**: Return actionable error messages, not technical stack traces
- **Phone Format**: Always guide users toward E.164 format (+1234567890)

## Development Constraints
- **Environment Dependencies**: Require ACCOUNT_SID, AUTH_TOKEN, FROM_NUMBER
- **Phone Number Validation**: Validate format before Twilio API calls
- **Error Boundaries**: Catch and transform Twilio errors into MCP-friendly responses
- **Logging**: Use console.error for server logs, structured responses for users

## Distribution Model
Published as `@yiyang.1i/sms-mcp-server` for immediate npx execution, targeting developers who need SMS integration in AI workflows without complex setup.