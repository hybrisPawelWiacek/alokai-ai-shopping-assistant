import { NextRequest } from 'next/server';
import { CommerceGraphExecutor, type ExecutionContext } from '@/features/ai-shopping-assistant/graphs/graph-executor';
import { validateRequest, type ChatRequest } from './validation';
import { authenticateUser } from './auth';
import { createStreamingResponse } from './streaming';
import { handleApiError } from './error-handler';
import { rateLimiter } from './rate-limiter';
import { detectB2BContext } from './context-detection';
import { logger } from './logger';

// Initialize executor with production config
const executor = new CommerceGraphExecutor({
  modelName: process.env.OPENAI_MODEL || 'gpt-4',
  temperature: 0.7,
  enablePersistence: true,
  enableLogging: true,
  onLog: (entry) => {
    logger.log(entry.level, entry.message, entry.metadata);
  }
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | undefined;
  let threadId: string | undefined;

  try {
    // Rate limiting check
    const clientId = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimiter.check(clientId);
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = validateRequest(body);
    
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const chatRequest = validation.data as ChatRequest;

    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    userId = authResult.userId;
    threadId = chatRequest.threadId || `thread_${userId}_${Date.now()}`;

    // Detect B2B context
    const b2bContext = await detectB2BContext(authResult.userId, request);

    // Build execution context
    const context: ExecutionContext = {
      threadId,
      userId: authResult.userId,
      sessionId: chatRequest.sessionId || `session_${Date.now()}`,
      mode: b2bContext.isB2B ? 'b2b' : 'b2c',
      locale: chatRequest.locale || request.headers.get('accept-language')?.split(',')[0] || 'en-US',
      currency: chatRequest.currency || 'USD',
      customMetadata: {
        ...chatRequest.metadata,
        ...(b2bContext.isB2B && {
          companyName: b2bContext.companyName,
          accountId: b2bContext.accountId,
          creditLimit: b2bContext.creditLimit
        })
      }
    };

    // Log request
    logger.info('Chat request received', {
      userId,
      threadId,
      mode: context.mode,
      messageLength: chatRequest.message.length
    });

    // Handle streaming vs non-streaming
    if (chatRequest.stream !== false) {
      // Create streaming response
      const stream = createStreamingResponse(
        executor,
        chatRequest.message,
        context,
        {
          includeHistory: chatRequest.includeHistory !== false,
          debugMode: chatRequest.debug,
          timeout: chatRequest.timeout || 30000
        }
      );

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Thread-ID': threadId
        }
      });
    } else {
      // Non-streaming response
      const result = await executor.execute(
        chatRequest.message,
        context,
        {
          includeHistory: chatRequest.includeHistory !== false,
          timeout: chatRequest.timeout || 30000
        }
      );

      logger.info('Chat response generated', {
        userId,
        threadId,
        executionTime: Date.now() - startTime,
        toolsUsed: result.metadata.toolsInvoked
      });

      return new Response(
        JSON.stringify({
          response: result.response,
          threadId,
          metadata: {
            ...result.metadata,
            mode: context.mode
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Thread-ID': threadId
          }
        }
      );
    }
  } catch (error) {
    logger.error('Chat request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      threadId,
      duration: Date.now() - startTime
    });

    return handleApiError(error);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const health = await executor.healthCheck();
    
    return new Response(
      JSON.stringify({
        status: health.status,
        timestamp: new Date().toISOString(),
        details: health.details
      }),
      {
        status: health.status === 'healthy' ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: 'Health check failed'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}