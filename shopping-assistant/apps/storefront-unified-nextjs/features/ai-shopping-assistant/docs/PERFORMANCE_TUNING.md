# AI Shopping Assistant Performance Tuning Guide

## Table of Contents
1. [Performance Targets](#performance-targets)
2. [Measurement Points](#measurement-points)
3. [Optimization Strategies](#optimization-strategies)
4. [Caching Configuration](#caching-configuration)
5. [UDL Optimization](#udl-optimization)
6. [LLM Optimization](#llm-optimization)
7. [Frontend Optimization](#frontend-optimization)
8. [Monitoring & Debugging](#monitoring--debugging)

## Performance Targets

### Response Time Goals
- **P50 (Median)**: <200ms
- **P95**: <250ms
- **P99**: <500ms
- **Streaming Start**: <100ms

### Component-Level Targets
```typescript
interface PerformanceTargets {
  udlQuery: 50,           // UDL data access
  llmResponse: 100,       // LLM processing
  actionExecution: 50,    // Action logic
  responseFormatting: 25, // UI formatting
  total: 225              // End-to-end
}
```

## Measurement Points

### 1. Request Lifecycle Metrics
```typescript
// Instrument key points in the request lifecycle
const metrics = {
  requestReceived: Date.now(),
  authCompleted: 0,
  graphStarted: 0,
  intentDetected: 0,
  toolsExecuted: 0,
  responseGenerated: 0,
  streamingStarted: 0,
  streamingCompleted: 0
};

// Log performance at each stage
logger.performance('auth', metrics.authCompleted - metrics.requestReceived);
```

### 2. Node Execution Tracking
```typescript
// Track individual node performance
const nodeMetrics = new Map<string, NodeMetrics>();

function trackNode(nodeName: string, fn: () => Promise<any>) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    nodeMetrics.set(nodeName, {
      count: (nodeMetrics.get(nodeName)?.count || 0) + 1,
      totalTime: (nodeMetrics.get(nodeName)?.totalTime || 0) + duration,
      avgTime: duration
    });
    
    return result;
  } catch (error) {
    // Track errors
    throw error;
  }
}
```

### 3. UDL Query Performance
```typescript
// Monitor UDL query performance
async function trackUDLQuery(method: string, params: any) {
  const start = performance.now();
  const result = await sdk.unified[method](params);
  const duration = performance.now() - start;
  
  metrics.recordUDLQuery({
    method,
    duration,
    resultCount: Array.isArray(result) ? result.length : 1
  });
  
  // Alert if slow
  if (duration > 100) {
    logger.warn(`Slow UDL query: ${method} took ${duration}ms`);
  }
  
  return result;
}
```

## Optimization Strategies

### 1. Parallel Data Fetching
```typescript
// Bad: Sequential queries
const products = await sdk.unified.searchProducts({ query });
const inventory = await sdk.unified.checkInventory(products.map(p => p.id));
const prices = await sdk.unified.getPricing(products.map(p => p.id));

// Good: Parallel queries
const [products, categories] = await Promise.all([
  sdk.unified.searchProducts({ query }),
  sdk.unified.getCategories()
]);

// Then parallel dependent queries
const [inventory, prices] = await Promise.all([
  sdk.unified.checkInventory(products.map(p => p.id)),
  sdk.unified.getPricing(products.map(p => p.id))
]);
```

### 2. Response Streaming
```typescript
// Stream responses as soon as available
class StreamingOptimizer {
  async streamResponse(messages: AsyncGenerator<Message>) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Start streaming immediately
    (async () => {
      for await (const message of messages) {
        const chunk = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
        await writer.write(chunk);
      }
      await writer.close();
    })();
    
    return stream.readable;
  }
}
```

### 3. Query Optimization
```typescript
// Optimize search queries
class SearchOptimizer {
  optimizeSearchParams(params: SearchParams): OptimizedParams {
    return {
      ...params,
      // Limit fields returned
      fields: ['id', 'name', 'price', 'image'],
      // Reasonable page size
      pageSize: Math.min(params.pageSize || 20, 20),
      // Include only needed relations
      include: params.include?.filter(i => REQUIRED_INCLUDES.has(i))
    };
  }
}
```

### 4. Lazy Loading
```typescript
// Load detailed data only when needed
class LazyLoader {
  async getProductWithDetails(productId: string) {
    // First, get basic info from cache or quick query
    const basic = await this.getBasicProduct(productId);
    
    // Return proxy that loads details on demand
    return new Proxy(basic, {
      get: async (target, prop) => {
        if (prop === 'details' && !target.details) {
          target.details = await sdk.unified.getProductDetails({ id: productId });
        }
        return target[prop];
      }
    });
  }
}
```

## Caching Configuration

### 1. Multi-Level Cache Strategy
```typescript
class CacheManager {
  private l1Cache = new Map(); // In-memory (10MB)
  private l2Cache: Redis;       // Redis (100MB)
  private l3Cache: CDN;         // CDN edge cache
  
  async get(key: string): Promise<any> {
    // Check L1 first (fastest)
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }
    
    // Check L2
    const l2Result = await this.l2Cache.get(key);
    if (l2Result) {
      this.l1Cache.set(key, l2Result); // Promote to L1
      return l2Result;
    }
    
    // Check L3
    const l3Result = await this.l3Cache.get(key);
    if (l3Result) {
      await this.l2Cache.set(key, l3Result); // Promote to L2
      this.l1Cache.set(key, l3Result);       // Promote to L1
      return l3Result;
    }
    
    return null;
  }
}
```

### 2. Cache Key Strategy
```typescript
// Intelligent cache key generation
class CacheKeyGenerator {
  generateKey(action: string, params: any, context: Context): string {
    const normalized = this.normalizeParams(params);
    const contextKey = this.getContextKey(context);
    
    return `${action}:${contextKey}:${hash(normalized)}`;
  }
  
  private normalizeParams(params: any): any {
    // Sort object keys for consistent hashing
    return Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
  }
  
  private getContextKey(context: Context): string {
    // Include relevant context (mode, locale, customer group)
    return `${context.mode}-${context.locale}-${context.customerGroup}`;
  }
}
```

### 3. Cache Warming
```typescript
// Proactive cache warming for common queries
class CacheWarmer {
  async warmCache() {
    const commonQueries = [
      { action: 'search', params: { category: 'bestsellers' } },
      { action: 'search', params: { category: 'new-arrivals' } },
      { action: 'getCategories', params: {} }
    ];
    
    await Promise.all(
      commonQueries.map(({ action, params }) =>
        this.executeAndCache(action, params)
      )
    );
  }
  
  scheduleWarming() {
    // Warm cache during low traffic
    cron.schedule('0 3 * * *', () => this.warmCache());
  }
}
```

## UDL Optimization

### 1. Field Selection
```typescript
// Only request needed fields
const products = await sdk.unified.searchProducts({
  query: 'laptop',
  fields: ['id', 'name', 'price', 'images[0]'], // Minimal fields
  expand: [] // No expansions unless needed
});
```

### 2. Batch Operations
```typescript
// Batch multiple operations
class UDLBatcher {
  private batch: BatchOperation[] = [];
  private timer: NodeJS.Timeout;
  
  async add(operation: BatchOperation): Promise<any> {
    this.batch.push(operation);
    
    if (this.batch.length >= 10) {
      return this.flush();
    }
    
    // Debounce
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 50);
  }
  
  private async flush() {
    const operations = [...this.batch];
    this.batch = [];
    
    const results = await sdk.unified.batch(operations);
    return results;
  }
}
```

### 3. Connection Pooling
```typescript
// Configure optimal connection pooling
const connectionConfig = {
  min: 5,        // Minimum connections
  max: 20,       // Maximum connections
  idle: 10000,   // Idle timeout
  acquire: 30000 // Acquire timeout
};
```

## LLM Optimization

### 1. Prompt Optimization
```typescript
// Optimize prompts for speed
class PromptOptimizer {
  optimizePrompt(prompt: string): string {
    return prompt
      .replace(/\s+/g, ' ')           // Remove extra whitespace
      .substring(0, MAX_PROMPT_LENGTH) // Limit length
      .trim();
  }
  
  // Use smaller models for simple tasks
  selectModel(task: TaskType): ModelType {
    switch (task) {
      case 'intent_detection':
        return 'gpt-3.5-turbo'; // Faster for simple classification
      case 'response_generation':
        return 'gpt-4'; // Better for complex responses
      default:
        return 'gpt-3.5-turbo';
    }
  }
}
```

### 2. Response Streaming
```typescript
// Stream LLM responses
async function* streamLLMResponse(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    temperature: 0.7,
    max_tokens: 150 // Limit response length
  });
  
  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}
```

### 3. Context Window Management
```typescript
// Manage context efficiently
class ContextManager {
  trimContext(messages: Message[], maxTokens: number = 2000): Message[] {
    let tokenCount = 0;
    const trimmed: Message[] = [];
    
    // Keep most recent messages
    for (let i = messages.length - 1; i >= 0; i--) {
      const tokens = this.estimateTokens(messages[i].content);
      if (tokenCount + tokens > maxTokens) break;
      
      trimmed.unshift(messages[i]);
      tokenCount += tokens;
    }
    
    return trimmed;
  }
  
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
```

## Frontend Optimization

### 1. Component Lazy Loading
```typescript
// Lazy load heavy components
const ProductComparison = lazy(() => 
  import('./components/ProductComparison')
);

const BulkUploadModal = lazy(() =>
  import('./components/B2B/BulkUploadModal')
);
```

### 2. Virtual Scrolling
```typescript
// Use virtual scrolling for long lists
import { VariableSizeList } from 'react-window';

function MessageList({ messages }: { messages: Message[] }) {
  const getItemSize = (index: number) => {
    // Calculate height based on content
    return estimateMessageHeight(messages[index]);
  };
  
  return (
    <VariableSizeList
      height={600}
      itemCount={messages.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MessageBubble message={messages[index]} />
        </div>
      )}
    </VariableSizeList>
  );
}
```

### 3. Debouncing & Throttling
```typescript
// Debounce user input
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    searchProducts(query);
  }, 300),
  []
);

// Throttle scroll events
const throttledScroll = useMemo(
  () => throttle(() => {
    checkAutoScroll();
  }, 100),
  []
);
```

### 4. Image Optimization
```typescript
// Optimize product images
function ProductImage({ src, alt }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      quality={85}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}
```

## Monitoring & Debugging

### 1. Performance Dashboard
```typescript
// Real-time performance monitoring
class PerformanceDashboard {
  private metrics: MetricsCollector;
  
  getSnapshot(): PerformanceSnapshot {
    return {
      avgResponseTime: this.metrics.getAverage('response_time'),
      p95ResponseTime: this.metrics.getPercentile('response_time', 95),
      cacheHitRate: this.metrics.getCacheHitRate(),
      errorRate: this.metrics.getErrorRate(),
      activeRequests: this.metrics.getActiveRequests(),
      slowQueries: this.metrics.getSlowQueries()
    };
  }
  
  generateReport(): string {
    const snapshot = this.getSnapshot();
    return `
Performance Report (${new Date().toISOString()})
================================================
Average Response Time: ${snapshot.avgResponseTime}ms
P95 Response Time: ${snapshot.p95ResponseTime}ms
Cache Hit Rate: ${snapshot.cacheHitRate}%
Error Rate: ${snapshot.errorRate}%
Active Requests: ${snapshot.activeRequests}

Slow Queries:
${snapshot.slowQueries.map(q => `- ${q.method}: ${q.duration}ms`).join('\n')}
    `;
  }
}
```

### 2. Performance Profiling
```typescript
// Profile specific operations
class Profiler {
  async profile<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    const startTime = performance.now();
    
    try {
      const result = await fn();
      
      const duration = performance.now() - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);
      
      this.logProfile({
        name,
        duration,
        memory: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external
        },
        cpu: {
          user: endCpu.user / 1000, // Convert to ms
          system: endCpu.system / 1000
        }
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }
}
```

### 3. Bottleneck Detection
```typescript
// Identify performance bottlenecks
class BottleneckDetector {
  private thresholds = {
    udlQuery: 100,
    llmResponse: 200,
    totalResponse: 250
  };
  
  analyze(metrics: RequestMetrics): BottleneckReport {
    const bottlenecks: Bottleneck[] = [];
    
    if (metrics.udlDuration > this.thresholds.udlQuery) {
      bottlenecks.push({
        component: 'UDL',
        duration: metrics.udlDuration,
        suggestion: 'Consider caching or query optimization'
      });
    }
    
    if (metrics.llmDuration > this.thresholds.llmResponse) {
      bottlenecks.push({
        component: 'LLM',
        duration: metrics.llmDuration,
        suggestion: 'Use smaller model or optimize prompts'
      });
    }
    
    return {
      hasBottlenecks: bottlenecks.length > 0,
      bottlenecks,
      totalDuration: metrics.totalDuration
    };
  }
}
```

## Performance Checklist

### Before Deployment
- [ ] All UDL queries use field selection
- [ ] Parallel fetching implemented where possible
- [ ] Caching configured for common queries
- [ ] Response streaming enabled
- [ ] Frontend lazy loading implemented
- [ ] Image optimization configured
- [ ] Performance monitoring active

### Regular Monitoring
- [ ] Check P95 response times daily
- [ ] Review slow query logs weekly
- [ ] Analyze cache hit rates
- [ ] Monitor error rates
- [ ] Check memory usage trends
- [ ] Review CPU utilization

### Optimization Opportunities
- [ ] Identify most frequent queries for caching
- [ ] Find sequential operations to parallelize
- [ ] Reduce payload sizes
- [ ] Optimize database indices
- [ ] Consider edge caching
- [ ] Implement request coalescing