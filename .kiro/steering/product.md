# Product Overview

This is a Model Context Protocol (MCP) server that enables Claude and other AI assistants to send SMS and MMS messages using Twilio. The server acts as a bridge between AI assistants and the Twilio messaging API.

## Key Features
- Send SMS messages through Twilio API
- Pre-built prompts for common messaging scenarios (greetings, haikus)
- Secure credential handling via environment variables
- E.164 phone number format validation
- Error handling and user-friendly error messages

## Target Users
- Developers integrating SMS capabilities into AI workflows
- Users of Claude Desktop who want SMS functionality
- Anyone needing programmatic SMS sending through AI assistants

## Distribution
Published as an npm package `@yiyang.1i/sms-mcp-server` that can be run via npx without installation.