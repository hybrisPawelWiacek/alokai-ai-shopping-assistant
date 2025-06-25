# AI Shopping Assistant API

*Version: v1.0*  
*Last Updated: 25 June 2025*

## Overview

The AI Shopping Assistant API provides intelligent shopping assistance powered by LangGraph.js. It supports both B2C and B2B modes, streaming responses, and rich UI component integration.

## Endpoints

### POST /api/ai-shopping-assistant
Main chat endpoint for processing user messages.

### GET /api/ai-shopping-assistant/health
Health check endpoint for monitoring service status.

## Authentication

The API supports multiple authentication methods:

1. **API Key**: Pass `x-api-key` header
2. **JWT Token**: Pass `Authorization: Bearer <token>` header
3. **Anonymous** (development only)

## Rate Limiting

- Default: 60 requests per minute per client
- Configurable via environment variables:
  - `AI_RATE_LIMIT`: Max requests (default: 60)
  - `AI_RATE_WINDOW`: Window in seconds (default: 60)

## Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# Authentication
VALID_API_KEYS=key1,key2,key3
JWT_SECRET=your-jwt-secret

# Rate Limiting
AI_RATE_LIMIT=60
AI_RATE_WINDOW=60

# CORS
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

## Request Example

```typescript
const response = await fetch('/api/ai-shopping-assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    message: 'Show me blue running shoes under $100',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    stream: true
  })
});
```

## Streaming Response

When `stream: true`, the API returns Server-Sent Events:

```typescript
const eventSource = new EventSource('/api/ai-shopping-assistant');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'metadata':
      // Initial metadata
      break;
    case 'content':
      // Streaming text chunks
      break;
    case 'actions':
      // Actions performed
      break;
    case 'ui':
      // UI components to render
      break;
    case 'done':
      // Stream complete
      break;
  }
};
```

## Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `400`: Bad request (validation error)
- `401`: Authentication required
- `403`: Origin not allowed
- `429`: Rate limit exceeded
- `500`: Internal server error

Error responses follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

## Security

- All responses include security headers
- CORS is configured based on `ALLOWED_ORIGINS`
- Input validation with Zod schemas
- Output sanitization for prompt injection protection

## Monitoring

- Structured logging with correlation IDs
- OpenTelemetry tracing
- Prometheus metrics
- Health check endpoint

## OpenAPI Documentation

See `openapi.yaml` for complete API specification.