# Claude Code Microservice Architecture

## Overview

Instead of embedding WebSocket/Claude Code directly in the main app, create a separate microservice that exposes Claude Code functionality via standard APIs.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Maverick      │    │  Claude Code    │    │   Claude CLI    │
│   Web App       │◄──►│  API Service    │◄──►│   (Process)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
  Standard HTTP          REST/WebSocket         File System
  Next.js App            Microservice           Access
```

## Benefits

1. **Clean Separation**: Main app doesn't need WebSocket complexity
2. **OpenAI Compatible**: Can mimic OpenAI/Ollama API format
3. **Scalable**: Can run on separate infrastructure
4. **Development Focus**: Local development vs production deployment

## Implementation Options

### Option 1: Docker Container
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json .
RUN npm install claude-cli
EXPOSE 8080
CMD ["node", "claude-code-server.js"]
```

### Option 2: Express API Server
```javascript
// claude-code-server.js
const express = require('express')
const { WebSocketServer } = require('ws')
const { spawn } = require('child_process')

const app = express()
const port = process.env.PORT || 8080

// OpenAI-compatible endpoint
app.post('/v1/chat/completions', async (req, res) => {
  // Proxy to Claude Code with file system access
  const claudeProcess = spawn('claude', ['--session', sessionId])
  // Stream response back in OpenAI format
})

// WebSocket for real-time coding
const wss = new WebSocketServer({ port: 8081 })
wss.on('connection', (ws) => {
  // Handle Claude Code WebSocket sessions
})
```

### Option 3: Railway/Fly.io Deployment
- Deploy as separate service on Railway or Fly.io  
- Expose REST API and WebSocket endpoints
- Main Maverick app calls this service when needed

## Environment Strategy

### Local Development (.env.local)
```env
CLAUDE_CODE_ENABLED=true
CLAUDE_CODE_API_URL=http://localhost:8080
USE_WEBSOCKET_SERVER=true
```

### Production (.env.production) 
```env
CLAUDE_CODE_ENABLED=false
# Use OpenRouter/OpenAI instead
OPENROUTER_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

## API Design

### REST Endpoints
```
POST /v1/chat/completions    # OpenAI compatible
POST /v1/code/session        # Start coding session  
GET  /v1/code/session/:id    # Get session status
POST /v1/code/execute        # Execute code
GET  /v1/health             # Health check
```

### WebSocket Events
```javascript
// Client -> Server
{
  "type": "code_request",
  "code": "write a function to...",
  "context": { "files": [...] }
}

// Server -> Client  
{
  "type": "code_response", 
  "content": "Here's the function...",
  "files_changed": [...]
}
```

## Next Steps

1. **Phase 1**: Get main app deployed without WebSocket complexity
2. **Phase 2**: Build Claude Code microservice separately  
3. **Phase 3**: Integrate microservice for enhanced local development
4. **Phase 4**: Optional production Claude Code for power users

This approach lets you:
- Deploy Maverick immediately with API-based AI
- Keep powerful local development experience
- Add advanced features incrementally
- Scale components independently