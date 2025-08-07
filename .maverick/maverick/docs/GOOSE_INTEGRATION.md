# Maverick + Goose Integration

This document explains how to integrate Maverick's AI-native business formation platform with Goose for enhanced development workflows.

## Overview

Maverick provides an OpenAI-compatible API that gives Goose access to business-aware AI assistance. This integration combines Goose's technical capabilities with Maverick's business formation expertise, Square payment integration knowledge, and startup strategy guidance.

## Quick Setup

### 1. Add Maverick as a Provider in Goose

Add this to your Goose configuration:

```yaml
# In your goose config
providers:
  maverick:
    base_url: "http://localhost:5001/api/v1"  # or your deployed Maverick URL
    api_key: "test-key"  # optional for development
    model: "maverick-default"
```

### 2. Use Maverick in Goose Sessions

```bash
# Start a Goose session with Maverick
goose session start --provider maverick

# Or specify the model directly
goose session start --provider maverick --model maverick-business
```

## Available Models

### `maverick-default`
- **Best for:** General development with business context
- **Includes:** Full business formation knowledge, Square integration expertise, GitHub best practices
- **Use when:** You want comprehensive business-aware development assistance

### `maverick-business` 
- **Best for:** Business strategy and formation decisions
- **Includes:** Legal structure guidance, market analysis, business model advice
- **Use when:** Planning business formation, choosing legal structures, strategic decisions

### `maverick-dev`
- **Best for:** Pure technical implementation 
- **Includes:** Development best practices, GitHub workflows, technical architecture
- **Use when:** Focused on coding and technical implementation

## API Endpoints

### Chat Completions
```
POST /api/v1/chat/completions
```

OpenAI-compatible chat completions with Maverick's business context.

**Example:**
```bash
curl -X POST "http://localhost:5001/api/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "maverick-default",
    "messages": [
      {"role": "user", "content": "Help me implement a payment system for my SaaS startup"}
    ],
    "temperature": 0.7,
    "project_id": "my-saas-project",
    "include_business_context": true
  }'
```

### Models List
```
GET /api/v1/models
```

Returns available Maverick models in OpenAI format.

### Health Check
```
GET /api/v1/test
```

Test endpoint to verify API is running and functional.

## Enhanced Features

### Business Context Integration
When `include_business_context: true` (default), Maverick provides:
- Legal structure recommendations based on your code patterns
- Square payment integration suggestions
- Business model alignment with technical decisions
- Compliance and regulatory considerations

### Project Context
Pass `project_id` to maintain context across sessions:
- Remembers your project's business model and goals
- Suggests consistent architectural patterns
- Aligns recommendations with project stage and requirements

## Example Workflows

### 1. Business Formation + Development
```bash
# Plan your business structure
goose session start --provider maverick --model maverick-business
> "I'm building a SaaS tool for restaurants. What legal structure should I choose?"

# Then implement with business context
goose session start --provider maverick --model maverick-default  
> "Now help me implement the payment processing with the business structure we discussed"
```

### 2. Technical Implementation with Business Awareness
```bash
goose session start --provider maverick
> "Build a subscription billing system that works well for an LLC structure and integrates with Square"
```

### 3. Repository Analysis with Business Insights
```bash
# Goose can analyze your repo and get business-aware suggestions
goose session start --provider maverick
> "Analyze this codebase and suggest business model optimizations"
```

## Authentication (Optional)

For production deployments, Maverick supports API key authentication:

```bash
# Generate a Maverick API key (mk-...)
curl -X POST "http://localhost:5001/api/auth/generate-key"

# Use in requests
curl -X POST "http://localhost:5001/api/v1/chat/completions" \
  -H "Authorization: Bearer mk-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"model": "maverick-default", "messages": [...]}'
```

## Rate Limits

- **Development:** 50 requests per minute per IP
- **Production:** Contact for higher limits

## Deployment URLs

- **Development:** `http://localhost:5001/api/v1`
- **Production:** `https://maverick-platform.azurewebsites.net/api/v1` (when deployed)

## What Makes This Special

Unlike standard AI assistants, Maverick provides:

1. **Business Formation Expertise:** Knows the differences between LLC, Corp, S-Corp and when to use each
2. **Square Integration Knowledge:** Deep understanding of Square's APIs, payment flows, and business services
3. **Startup Strategy Context:** Understands scaling, funding, and operational considerations
4. **Legal and Compliance Awareness:** Considers regulatory requirements and business implications
5. **Multi-AI Backend:** Routes to Claude Code or Gemini CLI based on the task

## Support

For issues or questions about the Goose + Maverick integration:
- Check the API status: `GET /api/v1/test`
- Review logs for authentication or rate limit issues
- Ensure your Maverick instance is running and accessible

---

This integration brings the power of business-aware AI to your development workflow, helping you build not just great code, but great businesses.