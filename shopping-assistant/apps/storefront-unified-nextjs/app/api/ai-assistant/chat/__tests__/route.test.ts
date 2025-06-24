import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, OPTIONS, GET } from '../route';

// Mock dependencies
jest.mock('@/features/ai-shopping-assistant/graphs/graph-executor', () => ({
  CommerceGraphExecutor: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      response: 'I can help you find products.',
      state: { mode: 'b2c' },
      metadata: {
        executionTime: 150,
        toolsInvoked: ['searchProducts']
      }
    }),
    executeStreaming: jest.fn().mockImplementation(async function* () {
      yield { type: 'text', content: 'I can help ' };
      yield { type: 'text', content: 'you find products.' };
      yield { type: 'end', state: { mode: 'b2c', messages: [] } };
    }),
    healthCheck: jest.fn().mockResolvedValue({
      status: 'healthy',
      details: { executionTime: 50 }
    })
  }))
}));

jest.mock('../auth', () => ({
  authenticateUser: jest.fn().mockResolvedValue({
    isAuthenticated: true,
    userId: 'user-123',
    role: 'customer'
  })
}));

jest.mock('../context-detection', () => ({
  detectB2BContext: jest.fn().mockResolvedValue({
    isB2B: false
  })
}));

jest.mock('../rate-limiter', () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({
      allowed: true,
      limit: 30,
      remaining: 29,
      reset: new Date()
    })
  }
}));

describe('AI Assistant API Route', () => {
  let mockRequest: (body: any, headers?: Record<string, string>) => NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = (body: any, headers: Record<string, string> = {}) => {
      return new NextRequest('http://localhost:3000/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body)
      });
    };
  });

  describe('POST /api/ai-assistant/chat', () => {
    it('should handle valid chat request', async () => {
      const request = mockRequest({
        message: 'Find me a laptop',
        stream: false
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('I can help you find products.');
      expect(data.threadId).toBeDefined();
      expect(data.metadata.mode).toBe('b2c');
    });

    it('should handle streaming request', async () => {
      const request = mockRequest({
        message: 'Find me a laptop',
        stream: true
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('X-Thread-ID')).toBeDefined();
    });

    it('should validate request body', async () => {
      const request = mockRequest({
        // Missing required 'message' field
        stream: false
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should enforce rate limiting', async () => {
      const rateLimiter = require('../rate-limiter').rateLimiter;
      rateLimiter.check.mockResolvedValueOnce({
        allowed: false,
        limit: 30,
        remaining: 0,
        reset: new Date(),
        retryAfter: 45
      });

      const request = mockRequest({
        message: 'Test message'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(response.headers.get('Retry-After')).toBe('45');
    });

    it('should handle authentication failure', async () => {
      const authenticateUser = require('../auth').authenticateUser;
      authenticateUser.mockResolvedValueOnce({
        isAuthenticated: false
      });

      const request = mockRequest({
        message: 'Test message'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should detect B2B context', async () => {
      const detectB2BContext = require('../context-detection').detectB2BContext;
      detectB2BContext.mockResolvedValueOnce({
        isB2B: true,
        companyName: 'Acme Corp',
        accountId: 'acc-123'
      });

      const request = mockRequest({
        message: 'I need bulk pricing',
        stream: false
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(detectB2BContext).toHaveBeenCalled();
    });

    it('should handle custom metadata', async () => {
      const request = mockRequest({
        message: 'Find products',
        stream: false,
        locale: 'fr-FR',
        currency: 'EUR',
        metadata: {
          source: 'mobile-app',
          version: '2.0'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should handle errors gracefully', async () => {
      const CommerceGraphExecutor = require('@/features/ai-shopping-assistant/graphs/graph-executor').CommerceGraphExecutor;
      CommerceGraphExecutor.mockImplementationOnce(() => ({
        execute: jest.fn().mockRejectedValue(new Error('Execution failed'))
      }));

      const request = mockRequest({
        message: 'Test error handling',
        stream: false
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.type).toBe('INTERNAL_ERROR');
    });
  });

  describe('OPTIONS /api/ai-assistant/chat', () => {
    it('should handle CORS preflight', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai-assistant/chat', {
        method: 'OPTIONS'
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });

  describe('GET /api/ai-assistant/chat', () => {
    it('should return health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/ai-assistant/chat', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle unhealthy status', async () => {
      const CommerceGraphExecutor = require('@/features/ai-shopping-assistant/graphs/graph-executor').CommerceGraphExecutor;
      CommerceGraphExecutor.mockImplementationOnce(() => ({
        healthCheck: jest.fn().mockResolvedValue({
          status: 'unhealthy',
          details: { error: 'Service degraded' }
        })
      }));

      const request = new NextRequest('http://localhost:3000/api/ai-assistant/chat', {
        method: 'GET'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
    });
  });
});