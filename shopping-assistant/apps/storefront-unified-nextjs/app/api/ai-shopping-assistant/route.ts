import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSdk } from '@/sdk';
import { CommerceAgentGraphV2 } from '@/features/ai-shopping-assistant/graphs/commerce-graph-v2';
import { ActionRegistryV2 } from '@/features/ai-shopping-assistant/actions/registry-v2';
import { ConfigurationManager } from '@/features/ai-shopping-assistant/config';
import { Loggers, metrics, traced } from '@/features/ai-shopping-assistant/observability';
import { withErrorHandling, ValidationError, RateLimitError } from '@/features/ai-shopping-assistant/errors';
import { HumanMessage } from '@langchain/core/messages';
import type { CommerceState } from '@/features/ai-shopping-assistant/state';
import { authenticate, checkRateLimit as checkRateLimitMiddleware, validateOrigin, addSecurityHeaders, logRequest } from './middleware';

const logger = Loggers.api;

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().uuid().optional(),
  mode: z.enum(['b2c', 'b2b']).optional(),
  context: z.object({
    cartId: z.string().optional(),
    customerId: z.string().optional(),
    locale: z.string().optional(),
    currency: z.string().optional(),
  }).optional(),
  stream: z.boolean().optional().default(true),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Response schemas
const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

const ChatResponseSchema = z.object({
  message: z.string(),
  actions: z.array(z.object({
    type: z.string(),
    data: z.any(),
  })).optional(),
  ui: z.object({
    component: z.string(),
    data: z.any(),
  }).optional(),
  metadata: z.object({
    sessionId: z.string(),
    mode: z.enum(['b2c', 'b2b']),
    processingTime: z.number(),
    version: z.string(),
  }),
});

// Initialize components
let graph: CommerceAgentGraphV2 | null = null;
let registry: ActionRegistryV2 | null = null;
let configManager: ConfigurationManager | null = null;

/**
 * Initialize the AI Shopping Assistant components
 */
async function initializeComponents() {
  if (!graph) {
    logger.info('Initializing AI Shopping Assistant components');
    
    // Initialize configuration manager
    configManager = ConfigurationManager.getInstance();
    await configManager.initialize();
    
    // Initialize action registry with SDK
    const sdk = getSdk();
    registry = new ActionRegistryV2(configManager, { sdk });
    await registry.initialize();
    
    // Initialize graph with registry
    graph = new CommerceAgentGraphV2(registry, {
      modelName: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.7,
      enableLogging: true,
      logger: (entry) => logger.debug('Graph log', entry),
    });
    
    logger.info('AI Shopping Assistant components initialized successfully');
  }
}

/**
 * Main chat endpoint handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  return traced('api.chat', async () => {
    try {
      // Validate origin
      if (!validateOrigin(request)) {
        return NextResponse.json(
          { error: 'Origin not allowed', code: 'CORS_ERROR' },
          { status: 403 }
        );
      }
      
      // Authenticate request
      const authResult = await authenticate(request);
      if (!authResult.valid) {
        return NextResponse.json(
          { error: authResult.error || 'Authentication required', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
      
      // Parse and validate request
      const body = await request.json();
      const validatedRequest = ChatRequestSchema.parse(body);
      
      // Log request
      logRequest(request, authResult.userId || 'anonymous', {
        requestId,
        sessionId: validatedRequest.sessionId,
        mode: validatedRequest.mode,
      });
      
      // Initialize components if needed
      await initializeComponents();
      
      // Check rate limits
      const clientId = authResult.userId || validatedRequest.sessionId || request.headers.get('x-forwarded-for') || 'anonymous';
      const rateLimitResult = await checkRateLimitMiddleware(clientId);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { 
            error: 'Too many requests', 
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimitResult.retryAfter 
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(rateLimitResult.retryAfter || 60),
            }
          }
        );
      }
      
      // Process with error handling
      const result = await withErrorHandling(
        async () => processMessage(validatedRequest, requestId),
        { sessionId: validatedRequest.sessionId || requestId }
      );
      
      // Track metrics
      const processingTime = Date.now() - startTime;
      metrics.recordChatProcessingTime(processingTime, { 
        mode: result.mode || 'b2c',
        environment: process.env.NODE_ENV 
      });
      metrics.recordChatRequest({ 
        status: 'success',
        mode: result.mode || 'b2c',
        environment: process.env.NODE_ENV 
      });
      
      // Return response
      if (validatedRequest.stream) {
        return createStreamingResponse(result, requestId, processingTime);
      } else {
        const response = NextResponse.json({
          ...result,
          metadata: {
            sessionId: validatedRequest.sessionId || requestId,
            mode: result.mode || 'b2c',
            processingTime,
            version: '1.0.0',
          },
        });
        return addSecurityHeaders(response);
      }
      
    } catch (error) {
      logger.error('Chat request failed', { error, requestId });
      metrics.recordChatRequest({ 
        status: 'error',
        environment: process.env.NODE_ENV 
      });
      
      // Handle different error types
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }
      
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
          { status: 429 }
        );
      }
      
      // Generic error response
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  });
}

/**
 * Process a chat message through the graph
 */
async function processMessage(
  request: ChatRequest,
  requestId: string
): Promise<any> {
  if (!graph) {
    throw new Error('Graph not initialized');
  }
  
  // Create initial state
  const initialState: Partial<CommerceState> = {
    messages: [new HumanMessage(request.message)],
    mode: request.mode,
    context: {
      ...request.context,
      sessionId: request.sessionId || requestId,
      requestId,
    },
  };
  
  // Run the graph
  const result = await graph.compile().invoke(initialState, {
    configurable: {
      sessionId: request.sessionId || requestId,
    },
  });
  
  // Extract the response
  const lastMessage = result.messages[result.messages.length - 1];
  const response = {
    message: lastMessage.content,
    actions: result.actionResults,
    ui: result.uiComponents,
    mode: result.mode,
  };
  
  return response;
}

/**
 * Create a streaming response
 */
function createStreamingResponse(
  result: any,
  requestId: string,
  processingTime: number
): Response {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial metadata
        const metadata = {
          type: 'metadata',
          data: {
            sessionId: requestId,
            mode: result.mode || 'b2c',
            version: '1.0.0',
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));
        
        // Stream the message content
        const message = result.message;
        for (let i = 0; i < message.length; i += 10) {
          const chunk = message.slice(i, i + 10);
          const data = {
            type: 'content',
            data: { text: chunk },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          
          // Small delay for streaming effect
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Send actions if any
        if (result.actions?.length > 0) {
          const actionsData = {
            type: 'actions',
            data: result.actions,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(actionsData)}\n\n`));
        }
        
        // Send UI components if any
        if (result.ui) {
          const uiData = {
            type: 'ui',
            data: result.ui,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(uiData)}\n\n`));
        }
        
        // Send completion
        const completion = {
          type: 'done',
          data: { processingTime },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(completion)}\n\n`));
        
      } catch (error) {
        logger.error('Streaming error', { error, requestId });
        const errorData = {
          type: 'error',
          data: { message: 'Streaming error occurred' },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}