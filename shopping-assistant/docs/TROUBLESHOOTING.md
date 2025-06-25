# AI Shopping Assistant Troubleshooting Guide

*Version: v1.0*  
*Last Updated: 25 June 2025*

## Table of Contents
1. [Common Issues](#common-issues)
2. [Debugging Tools](#debugging-tools)
3. [Performance Issues](#performance-issues)
4. [Integration Problems](#integration-problems)
5. [Error Messages](#error-messages)
6. [UDL-Related Issues](#udl-related-issues)
7. [Advanced Debugging](#advanced-debugging)
8. [FAQ](#faq)

## Common Issues

### 1. Assistant Not Responding
**Symptoms:**
- No response after sending message
- Loading indicator stuck
- No error messages displayed

**Solutions:**
```typescript
// Check 1: Verify API endpoint is accessible
curl -X POST http://localhost:3000/api/ai-shopping-assistant \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "sessionId": "test-123"}'

// Check 2: Verify middleware is running
curl http://localhost:4000/health

// Check 3: Check browser console for errors
// Look for CORS issues, network errors, or JavaScript exceptions

// Check 4: Verify environment variables
console.log({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  middlewareUrl: process.env.NEXT_PUBLIC_MIDDLEWARE_URL
});
```

**Debug Code:**
```typescript
// Add debug logging to hook
const sendMessage = async (message: string) => {
  console.log('[AI Assistant] Sending message:', message);
  
  try {
    const response = await fetch('/api/ai-shopping-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    });
    
    console.log('[AI Assistant] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[AI Assistant] Error response:', error);
    }
  } catch (error) {
    console.error('[AI Assistant] Network error:', error);
  }
};
```

### 2. Streaming Not Working
**Symptoms:**
- Messages appear all at once instead of streaming
- SSE connection fails
- Chunked responses not processed

**Solutions:**
```typescript
// Check 1: Verify SSE headers
// API route should return these headers:
{
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
}

// Check 2: Test SSE directly
const eventSource = new EventSource('/api/ai-shopping-assistant/stream');
eventSource.onmessage = (event) => {
  console.log('SSE message:', event.data);
};
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};

// Check 3: Verify proxy configuration
// Next.js config should not buffer SSE responses
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*',
        // Important for SSE
        has: [{ type: 'header', key: 'accept', value: '.*text/event-stream.*' }]
      }
    ];
  }
};
```

### 3. Authentication Failures
**Symptoms:**
- 401 Unauthorized errors
- Session not persisting
- "Please log in" messages

**Solutions:**
```typescript
// Check 1: Verify session creation
const session = await createSession();
console.log('Session created:', session);

// Check 2: Check session storage
const storedSession = localStorage.getItem('ai-assistant-session');
console.log('Stored session:', storedSession);

// Check 3: Verify authentication headers
const headers = {
  'Authorization': `Bearer ${session.token}`,
  'X-Session-ID': session.id
};

// Check 4: Test authentication endpoint
const authTest = await fetch('/api/auth/verify', { headers });
console.log('Auth test result:', await authTest.json());
```

## Debugging Tools

### 1. Debug Mode Configuration
```typescript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  window.__AI_ASSISTANT_DEBUG__ = true;
  
  // Override console methods to add prefix
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog('[AI Assistant]', ...args);
  };
}

// Create debug logger
class DebugLogger {
  private enabled = process.env.NODE_ENV === 'development';
  
  log(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    
    console.log(`[${category}]`, message, data || '');
    
    // Also send to debug panel
    window.postMessage({
      type: 'ai-assistant-debug',
      category,
      message,
      data,
      timestamp: Date.now()
    }, '*');
  }
}

export const debug = new DebugLogger();
```

### 2. Network Inspector
```typescript
// Intercept and log all AI Assistant API calls
class NetworkInspector {
  private requests: NetworkRequest[] = [];
  
  intercept() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      if (url.includes('ai-shopping-assistant')) {
        const request: NetworkRequest = {
          id: Date.now(),
          url,
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body,
          timestamp: Date.now()
        };
        
        this.requests.push(request);
        
        try {
          const response = await originalFetch(...args);
          
          request.response = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            duration: Date.now() - request.timestamp
          };
          
          this.logRequest(request);
          
          return response;
        } catch (error) {
          request.error = error;
          this.logRequest(request);
          throw error;
        }
      }
      
      return originalFetch(...args);
    };
  }
  
  private logRequest(request: NetworkRequest) {
    console.group(`[Network] ${request.method} ${request.url}`);
    console.log('Request:', request);
    console.log('Duration:', request.response?.duration, 'ms');
    console.groupEnd();
  }
  
  getRequests() {
    return this.requests;
  }
}

// Enable in development
if (process.env.NODE_ENV === 'development') {
  new NetworkInspector().intercept();
}
```

### 3. State Inspector
```typescript
// Debug component for inspecting AI Assistant state
export function AIAssistantDebugPanel() {
  const { state, messages, isLoading, error } = useShoppingAssistant();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-0 right-0 w-96 bg-black text-white p-4 text-xs">
      <h3 className="font-bold mb-2">AI Assistant Debug</h3>
      
      <div className="mb-2">
        <strong>State:</strong>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
      
      <div className="mb-2">
        <strong>Messages:</strong> {messages.length}
      </div>
      
      <div className="mb-2">
        <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </div>
      
      {error && (
        <div className="mb-2 text-red-400">
          <strong>Error:</strong> {error.message}
        </div>
      )}
      
      <button
        onClick={() => console.log('Full state:', { state, messages })}
        className="bg-blue-500 px-2 py-1 rounded"
      >
        Log Full State
      </button>
    </div>
  );
}
```

## Performance Issues

### 1. Slow Response Times
**Symptoms:**
- Responses take >3 seconds
- UI feels sluggish
- Timeouts occurring

**Diagnosis:**
```typescript
// Add performance tracking
class PerformanceTracker {
  private marks = new Map<string, number>();
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark: string) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    
    if (start && end) {
      const duration = end - start;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      
      // Alert if slow
      if (duration > 1000) {
        console.warn(`[Performance] Slow operation detected: ${name}`);
      }
    }
  }
}

// Usage in API route
const perf = new PerformanceTracker();

perf.mark('request-start');
await authenticateRequest(req);
perf.mark('auth-complete');

await processWithLangGraph(message);
perf.mark('langgraph-complete');

perf.measure('Authentication', 'request-start', 'auth-complete');
perf.measure('LangGraph Processing', 'auth-complete', 'langgraph-complete');
perf.measure('Total Request', 'request-start', 'langgraph-complete');
```

**Solutions:**
```typescript
// 1. Enable caching
const cache = new Map();

async function getCachedOrFetch(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    debug.log('Cache', `Hit for key: ${key}`);
    return cache.get(key);
  }
  
  const result = await fetcher();
  cache.set(key, result);
  
  // Expire after 5 minutes
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return result;
}

// 2. Optimize UDL queries
const products = await sdk.unified.searchProducts({
  search: query,
  // Limit fields to improve performance
  fields: ['id', 'name', 'price', 'images[0]'],
  // Reasonable page size
  pageSize: 10
});

// 3. Use streaming for faster perceived performance
// Start streaming UI updates before all data is ready
for await (const update of processInChunks(data)) {
  yield update;
}
```

### 2. Memory Leaks
**Symptoms:**
- Browser tab becomes slow over time
- Memory usage keeps increasing
- Page crashes after extended use

**Detection:**
```typescript
// Memory leak detector
class MemoryMonitor {
  private baseline: number = 0;
  private measurements: number[] = [];
  
  start() {
    if (!performance.memory) {
      console.warn('Memory API not available');
      return;
    }
    
    this.baseline = performance.memory.usedJSHeapSize;
    
    setInterval(() => {
      const current = performance.memory.usedJSHeapSize;
      const delta = current - this.baseline;
      
      this.measurements.push(delta);
      
      // Keep only last 100 measurements
      if (this.measurements.length > 100) {
        this.measurements.shift();
      }
      
      // Check for steady increase
      if (this.isLeaking()) {
        console.warn('[Memory] Possible leak detected', {
          baseline: this.formatBytes(this.baseline),
          current: this.formatBytes(current),
          increase: this.formatBytes(delta)
        });
      }
    }, 10000); // Check every 10 seconds
  }
  
  private isLeaking(): boolean {
    if (this.measurements.length < 10) return false;
    
    // Check if memory is steadily increasing
    let increases = 0;
    for (let i = 1; i < this.measurements.length; i++) {
      if (this.measurements[i] > this.measurements[i - 1]) {
        increases++;
      }
    }
    
    return increases > this.measurements.length * 0.8;
  }
  
  private formatBytes(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }
}
```

**Common Causes & Fixes:**
```typescript
// 1. Event listener leaks
useEffect(() => {
  const handler = (e: Event) => console.log(e);
  window.addEventListener('resize', handler);
  
  // Always cleanup!
  return () => window.removeEventListener('resize', handler);
}, []);

// 2. Closure leaks
// Bad: Holds reference to large data
const [messages, setMessages] = useState<Message[]>([]);

const addMessage = (message: Message) => {
  setMessages(prev => [...prev, message]); // Unbounded growth
};

// Good: Limit message history
const addMessage = (message: Message) => {
  setMessages(prev => {
    const updated = [...prev, message];
    // Keep only last 100 messages
    return updated.slice(-100);
  });
};

// 3. Timer leaks
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);
  
  // Always cleanup!
  return () => clearInterval(timer);
}, []);
```

## Integration Problems

### 1. UDL Method Not Found
**Symptoms:**
- "Method unified.xxx does not exist" errors
- TypeScript errors on SDK methods
- Runtime failures when calling UDL

**Solutions:**
```typescript
// Check 1: Verify UDL method exists
console.log('Available UDL methods:', Object.keys(sdk.unified));

// Check 2: Ensure proper SDK initialization
const sdk = getSdk();
if (!sdk.unified) {
  console.error('UDL not initialized properly');
}

// Check 3: Check for custom extensions
if (!sdk.customExtension?.methodName) {
  console.error('Custom extension not registered');
}

// Check 4: Verify middleware configuration
// In middleware/integrations/sapcc/extensions/unified.ts
export const unifiedApiExtension = createUnifiedExtension({
  normalizers: {
    addCustomFields: [
      {
        normalizeProduct(context, input) {
          return {
            customField: input.customField
          };
        }
      }
    ]
  },
  config: {
    // Custom methods configuration
  }
});
```

### 2. Type Mismatches
**Symptoms:**
- TypeScript compilation errors
- "Type 'X' is not assignable to type 'Y'"
- Runtime type validation failures

**Solutions:**
```typescript
// 1. Ensure types extend from UDL
import type { SfProduct } from '@vsf-enterprise/unified-api-sapcc/udl';

interface ExtendedProduct extends SfProduct {
  customField?: string;
}

// 2. Use proper type guards
function isProduct(item: any): item is SfProduct {
  return item && typeof item.id === 'string' && typeof item.name === 'string';
}

// 3. Validate at runtime
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.object({
    value: z.number(),
    currency: z.string()
  })
});

const validated = ProductSchema.parse(unknownData);
```

### 3. CORS Issues
**Symptoms:**
- "CORS policy" errors in console
- Requests blocked by browser
- Preflight requests failing

**Solutions:**
```typescript
// 1. Configure CORS in API route
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// 2. Configure middleware CORS
// In middleware/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Proxy configuration for development
// In next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/middleware/:path*',
        destination: 'http://localhost:4000/:path*'
      }
    ];
  }
};
```

## Error Messages

### Common Error Reference
```typescript
const ERROR_SOLUTIONS = {
  'ERR_NETWORK': {
    message: 'Network request failed',
    causes: ['Server down', 'CORS issue', 'Network connectivity'],
    solutions: [
      'Check if middleware is running',
      'Verify CORS configuration',
      'Check network connection'
    ]
  },
  
  'ERR_AUTH_FAILED': {
    message: 'Authentication failed',
    causes: ['Invalid token', 'Expired session', 'Missing credentials'],
    solutions: [
      'Clear session and re-authenticate',
      'Check token expiration',
      'Verify API keys'
    ]
  },
  
  'ERR_RATE_LIMIT': {
    message: 'Rate limit exceeded',
    causes: ['Too many requests', 'DDoS protection triggered'],
    solutions: [
      'Implement request throttling',
      'Add caching layer',
      'Contact support for limit increase'
    ]
  },
  
  'ERR_INVALID_INPUT': {
    message: 'Invalid input provided',
    causes: ['Malformed JSON', 'Missing required fields', 'Type mismatch'],
    solutions: [
      'Validate input against schema',
      'Check request payload format',
      'Review API documentation'
    ]
  },
  
  'ERR_UDL_METHOD_NOT_FOUND': {
    message: 'UDL method does not exist',
    causes: ['Method not implemented', 'Wrong method name', 'Missing extension'],
    solutions: [
      'Check available UDL methods',
      'Verify method spelling',
      'Implement custom extension if needed'
    ]
  }
};

// Error handler with solutions
function handleError(error: any) {
  const errorCode = error.code || 'UNKNOWN';
  const solution = ERROR_SOLUTIONS[errorCode];
  
  if (solution) {
    console.error(`[Error] ${solution.message}`);
    console.error('Possible causes:', solution.causes);
    console.error('Try these solutions:', solution.solutions);
  } else {
    console.error('[Error] Unknown error:', error);
  }
}
```

## UDL-Related Issues

### 1. Mock vs Real UDL Conflicts
**Symptoms:**
- Different behavior in development vs production
- Mock data structure doesn't match real UDL
- Type errors when switching from mocks

**Solutions:**
```typescript
// 1. Ensure mocks match UDL structure exactly
const mockProduct: SfProduct = {
  id: '123',
  sku: 'SKU123',
  name: 'Test Product',
  slug: 'test-product',
  price: {
    value: 99.99,
    currency: 'USD',
    isDiscounted: false,
    regularPrice: 99.99,
    discountedPrice: 99.99
  },
  // All required UDL fields must be present
  primaryImage: { url: 'image.jpg', alt: 'Product' },
  gallery: [],
  rating: { average: 4.5, count: 10 },
  // Optional fields as needed
};

// 2. Create UDL-compliant mock factory
class UDLMockFactory {
  createProduct(overrides?: Partial<SfProduct>): SfProduct {
    const base: SfProduct = {
      // All required fields with proper types
      id: faker.datatype.uuid(),
      sku: faker.random.alphaNumeric(10),
      name: faker.commerce.productName(),
      // ... etc
    };
    
    return { ...base, ...overrides };
  }
}

// 3. Add migration path comments
// TODO: Replace with real UDL when available
const products = USE_MOCKS 
  ? mockFactory.createProducts(10)
  : await sdk.unified.searchProducts({ search: query });
```

### 2. Custom Extension Not Working
**Symptoms:**
- customExtension methods undefined
- "Method not implemented" errors
- Custom B2B features not accessible

**Solutions:**
```typescript
// 1. Define custom extension in middleware
// apps/storefront-middleware/api/custom-methods/custom.ts
export async function myCustomMethod(
  context: IntegrationContext,
  args: MyArgs
): Promise<MyResponse> {
  // Implementation using context.api
  const result = await context.api.someBackendMethod(args);
  
  // Normalize to UDL format
  const { normalizeProduct } = getNormalizers(context);
  return normalizeProduct(result);
}

// 2. Register in middleware configuration
// apps/storefront-middleware/integrations/sapcc/config.ts
export const customMethods = {
  myCustomMethod,
  // Other custom methods
};

// 3. Use in frontend
const result = await sdk.customExtension.myCustomMethod({ 
  // args 
});
```

## Issues Discovered During Verification (June 2025)

### 1. SDK Namespace Changes
**Issue:** "Cannot find module 'sdk.commerce'"
**Root Cause:** Old PoC used incorrect SDK namespace
**Solution:**
```typescript
// ❌ WRONG (old pattern)
import { sdk } from '@/sdk';
const products = await sdk.commerce.searchProducts();

// ✅ CORRECT (UDL pattern)
import { getSdk } from '@/sdk';
const sdk = getSdk();
const products = await sdk.unified.searchProducts({ search: query });
```

### 2. Mock Function Naming Conflicts
**Issue:** "performSearch is not a function"
**Root Cause:** Mock functions don't match UDL method names
**Solution:**
```typescript
// ❌ WRONG (mock function)
const results = await performSearch(query);

// ✅ CORRECT (UDL method)
const results = await sdk.unified.searchProducts({ search: query });
```

### 3. Type Mismatches with UDL
**Issue:** "Type 'Product' is not assignable to type 'SfProduct'"
**Root Cause:** Custom types instead of UDL types
**Solution:**
```typescript
// ❌ WRONG (custom type)
interface Product {
  id: string;
  title: string;
  cost: number;
}

// ✅ CORRECT (UDL type)
import type { SfProduct } from '@vsf-enterprise/unified-api-sapcc/udl';
// Use SfProduct throughout
```

### 4. Missing Error Handling for API Failures
**Issue:** Application crashes when backend is unavailable
**Root Cause:** No graceful degradation
**Solution:**
```typescript
try {
  const products = await sdk.unified.searchProducts({ search: query });
  return products;
} catch (error) {
  logger.error('Search failed, using fallback', error);
  // Return cached or default results
  return getCachedResults(query) || [];
}
```

### 5. Token Explosion in Conversations
**Issue:** OpenAI API errors after long conversations
**Root Cause:** Full history sent with each request
**Solution:**
```typescript
// Implement sliding window
const MAX_CONTEXT_MESSAGES = 10;
const contextMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
```

### 6. Performance Bottlenecks
**Issue:** 800-1200ms response times
**Root Cause:** Multiple issues identified
**Solutions Applied:**
- Moved LLM calls to server-side (saved 300ms)
- Implemented LRU cache (40% reduction)
- Parallel UDL calls (saved 150ms)
- Streaming responses (better perceived performance)

### 7. B2B Custom Extension Integration
**Issue:** "sdk.customExtension.getBulkPricing is not a function"
**Root Cause:** Custom methods not registered in middleware
**Solution:**
```typescript
// 1. Create method in middleware
// apps/storefront-middleware/api/custom-methods/b2b/bulk-pricing.ts
export async function getBulkPricing(context, args) {
  // Implementation
}

// 2. Export from index
// apps/storefront-middleware/api/custom-methods/index.ts
export { getBulkPricing } from './b2b/bulk-pricing';

// 3. Use in frontend
const pricing = await sdk.customExtension.getBulkPricing({ items });
```

### 8. Environment Variable Confusion
**Issue:** "OpenAI API key is not configured"
**Root Cause:** Using NEXT_PUBLIC_ prefix for server-side variables
**Solution:**
```bash
# ❌ WRONG (exposes key to client)
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxx

# ✅ CORRECT (server-side only)
OPENAI_API_KEY=sk-xxx
```

### 9. Streaming Client Reconnection
**Issue:** SSE connection drops and doesn't recover
**Root Cause:** No automatic reconnection logic
**Solution:** Implemented in StreamingClient class with exponential backoff

### 10. Security Validation Gaps
**Issue:** Prompt injection attempts partially successful
**Root Cause:** Validation only at input, not output
**Solution:** Added Judge pattern at multiple layers:
- Input validation
- Tool selection validation
- Output filtering
- Business rule enforcement

## Advanced Debugging

### 1. LangGraph State Inspection
```typescript
// Debug LangGraph execution
class LangGraphDebugger {
  async traceExecution(graph: CompiledGraph, input: any) {
    const events: GraphEvent[] = [];
    
    // Intercept graph execution
    const stream = graph.stream(input, {
      callbacks: {
        onNodeStart: (node: string, input: any) => {
          events.push({
            type: 'node_start',
            node,
            input,
            timestamp: Date.now()
          });
        },
        onNodeEnd: (node: string, output: any) => {
          events.push({
            type: 'node_end',
            node,
            output,
            timestamp: Date.now()
          });
        },
        onError: (error: any) => {
          events.push({
            type: 'error',
            error,
            timestamp: Date.now()
          });
        }
      }
    });
    
    // Process stream
    for await (const chunk of stream) {
      console.log('[LangGraph] Stream chunk:', chunk);
    }
    
    // Analyze execution
    this.analyzeEvents(events);
  }
  
  private analyzeEvents(events: GraphEvent[]) {
    console.group('[LangGraph] Execution Analysis');
    
    // Node execution times
    const nodeTimes = new Map<string, number>();
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      
      if (event.type === 'node_start') {
        const endEvent = events.find(
          e => e.type === 'node_end' && 
               e.node === event.node && 
               e.timestamp > event.timestamp
        );
        
        if (endEvent) {
          const duration = endEvent.timestamp - event.timestamp;
          nodeTimes.set(event.node, duration);
        }
      }
    }
    
    // Log execution times
    nodeTimes.forEach((time, node) => {
      console.log(`${node}: ${time}ms`);
    });
    
    console.groupEnd();
  }
}
```

### 2. Request Replay Tool
```typescript
// Replay failed requests for debugging
class RequestReplay {
  private requests: SavedRequest[] = [];
  
  saveRequest(req: Request, error?: Error) {
    this.requests.push({
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body: req.body,
      timestamp: Date.now(),
      error: error?.message
    });
  }
  
  async replay(requestId: number) {
    const saved = this.requests[requestId];
    if (!saved) {
      console.error('Request not found');
      return;
    }
    
    console.log('[Replay] Replaying request:', saved);
    
    try {
      const response = await fetch(saved.url, {
        method: saved.method,
        headers: saved.headers,
        body: saved.body
      });
      
      console.log('[Replay] Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text()
      });
    } catch (error) {
      console.error('[Replay] Error:', error);
    }
  }
  
  listRequests() {
    this.requests.forEach((req, index) => {
      console.log(`${index}: ${req.method} ${req.url} - ${req.error || 'Success'}`);
    });
  }
}

// Global instance for debugging
window.__requestReplay = new RequestReplay();
```

## FAQ

### Q: Why is the assistant responding with generic answers?
**A:** Check if the UDL integration is working properly. Generic responses often indicate the assistant can't access real product data.

### Q: How do I test B2B features locally?
**A:** Set the mode to B2B in the UI or pass `mode: 'b2b'` in the API request. Ensure B2B custom extensions are configured in middleware.

### Q: Why are products not showing in search results?
**A:** Verify:
1. UDL search method is properly called
2. Search index is populated
3. No filtering is removing all results
4. Mock data is properly structured if using mocks

### Q: How do I enable debug logging in production?
**A:** Set the `AI_ASSISTANT_DEBUG` environment variable or add `?debug=true` to the URL. Note: Ensure this is properly secured.

### Q: What's the difference between streaming and non-streaming modes?
**A:** Streaming provides real-time updates as the assistant processes, while non-streaming waits for the complete response. Streaming is better for UX but requires SSE support.

### Q: How do I add a new action to the assistant?
**A:** 
1. Define the action in configuration
2. Implement the execute method using UDL
3. Register in the action registry
4. Add UI components if needed

### Q: Why is the assistant slow on first request?
**A:** Cold start issues. The LLM model and middleware may need initialization time. Consider implementing a warmup routine.

### Q: How do I troubleshoot CORS errors?
**A:** Check:
1. API CORS headers match frontend origin
2. Credentials are properly configured
3. Preflight requests are handled
4. Proxy configuration in development