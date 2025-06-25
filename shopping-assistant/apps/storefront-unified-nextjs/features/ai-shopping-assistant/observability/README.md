# Observability Layer

*Version: v1.0*  
*Last Updated: 25 June 2025*

Comprehensive observability solution for the AI Shopping Assistant, providing distributed tracing, structured logging, metrics collection, and performance profiling.

## Features

### 1. **OpenTelemetry Tracing**
- Distributed tracing across all components
- Automatic trace context propagation
- Custom spans for AI operations
- Integration with Jaeger, Zipkin, or any OTLP-compatible backend

### 2. **Structured Logging**
- JSON-formatted logs with trace correlation
- Component-specific loggers
- Automatic context enrichment
- Log level filtering and transport system

### 3. **Metrics Collection**
- Prometheus-compatible metrics
- Business and technical metrics
- Real-time performance monitoring
- Custom dashboards and alerts

### 4. **LangGraph Instrumentation**
- Automatic node execution tracking
- Tool execution monitoring
- Model performance metrics
- State change tracking

### 5. **Performance Profiling**
- Operation timing and analysis
- Memory usage tracking
- CPU profiling capabilities
- Performance reports

## Quick Start

```typescript
import { initializeObservability } from '@/features/ai-shopping-assistant/observability';

// Initialize observability
const { shutdown } = await initializeObservability({
  serviceName: 'ai-shopping-assistant',
  environment: 'production',
  telemetry: {
    enabled: true,
    endpoint: 'http://localhost:4318/v1/traces'
  },
  metrics: {
    enabled: true,
    endpoint: 'http://localhost:4318/v1/metrics'
  },
  logging: {
    level: 'info',
    format: 'json'
  }
});

// Shutdown gracefully
process.on('SIGTERM', async () => {
  await shutdown();
});
```

## Usage Examples

### Tracing

```typescript
import { traced, createAISpan, traceUDLCall } from '@/features/ai-shopping-assistant/observability';

// Trace a function
const processRequest = traced('processRequest', async (input) => {
  // Function implementation
}, {
  attributes: { requestType: 'search' }
});

// Create custom span
const span = createAISpan('ai.operation', {
  sessionId: 'session-123',
  mode: 'b2c',
  action: 'search'
});

// Trace UDL calls
const result = await traceUDLCall('searchProducts', 
  () => sdk.unified.searchProducts(params),
  params
);
```

### Logging

```typescript
import { Loggers } from '@/features/ai-shopping-assistant/observability';

// Component-specific logging
Loggers.ai.info('Operation completed', {
  duration: 1234,
  resultCount: 10
});

Loggers.graph.debug('Node execution started', {
  node: 'detectIntent',
  sessionId: 'session-123'
});

// Error logging with stack trace
Loggers.security.error('Authentication failed', error, {
  userId: 'user-123',
  attemptCount: 3
});
```

### Metrics

```typescript
import { metrics } from '@/features/ai-shopping-assistant/observability';

// Record metrics
metrics.recordRequest({ mode: 'b2c' });
metrics.recordRequestDuration(1234, { action: 'search' });
metrics.recordActionExecution('search', 500, true, { mode: 'b2c' });
metrics.recordUDLCall('searchProducts', 200, true, { cache_status: 'hit' });

// Business metrics
metrics.recordCartConversion(true);
metrics.recordSearchResult(true);
metrics.recordB2BQuote({ mode: 'b2b' });
```

### Instrumentation

```typescript
import { instrumentNode, instrumentGraph } from '@/features/ai-shopping-assistant/observability';

// Instrument a LangGraph node
const instrumentedNode = instrumentNode(
  'detectIntent',
  'detect_intent',
  detectIntentImplementation,
  {
    enableTracing: true,
    enableMetrics: true,
    captureStateSnapshots: true
  }
);

// Instrument graph execution
const result = await instrumentGraph(
  'main-workflow',
  () => graph.execute(input),
  {
    sessionId: 'session-123',
    userId: 'user-456',
    mode: 'b2c'
  }
);
```

### Performance Profiling

```typescript
import { globalProfiler, Profile } from '@/features/ai-shopping-assistant/observability';

// Profile an operation
const { result, profile } = await globalProfiler.profile(
  'expensive-operation',
  async () => {
    // Operation implementation
  },
  { category: 'search' }
);

// Use decorator
class SearchService {
  @Profile('search-products')
  async searchProducts(query: string) {
    // Implementation
  }
}

// Get performance report
const report = PerfUtils.createReport(globalProfiler);
console.log(report);
```

## Configuration

### Environment Variables

```bash
# Telemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=ai-shopping-assistant
OTEL_SERVICE_VERSION=1.0.0

# Metrics
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### Middleware Setup

```typescript
import { observabilityMiddleware } from '@/features/ai-shopping-assistant/observability';

// Express
app.use(observabilityMiddleware);

// Next.js API routes
export default function handler(req, res) {
  observabilityMiddleware(req, res, () => {
    // Handle request
  });
}
```

## Dashboards and Alerts

### Grafana Dashboard

Import the pre-configured dashboard:

```typescript
import { exportGrafanaDashboard } from '@/features/ai-shopping-assistant/observability';

const dashboardJson = exportGrafanaDashboard();
// Import into Grafana
```

### Prometheus Alerts

Deploy alert rules:

```typescript
import { exportPrometheusRules } from '@/features/ai-shopping-assistant/observability';

const rulesYaml = exportPrometheusRules();
// Save to prometheus rules file
```

## Key Metrics

### Request Metrics
- `ai_request_count` - Total requests
- `ai_request_duration` - Request duration histogram
- `ai_request_error_count` - Error count

### LangGraph Metrics
- `ai_node_execution_count` - Node executions
- `ai_node_execution_duration` - Node duration
- `ai_graph_execution_duration` - Full graph duration

### Action Metrics
- `ai_action_execution_count` - Action executions
- `ai_action_execution_duration` - Action duration
- `ai_action_error_count` - Action errors

### UDL Metrics
- `ai_udl_call_count` - UDL API calls
- `ai_udl_call_duration` - UDL call duration
- `ai_udl_cache_hit_rate` - Cache effectiveness

### Business Metrics
- `ai_business_cart_conversion_rate` - Cart conversion
- `ai_business_search_success_rate` - Search success
- `ai_business_b2b_quote_count` - B2B quotes

## Best Practices

1. **Use Component Loggers**: Always use the appropriate component logger (e.g., `Loggers.ai`, `Loggers.udl`)

2. **Add Context**: Include relevant context in logs and metrics (sessionId, userId, mode)

3. **Profile Critical Paths**: Use profiling for operations that might be slow

4. **Monitor Business Metrics**: Track business outcomes, not just technical metrics

5. **Set Appropriate Log Levels**: Use debug for development, info for production

6. **Handle Errors Properly**: Always log errors with full context

7. **Use Trace Propagation**: Ensure traces connect across async boundaries

## Troubleshooting

### Missing Traces
- Check OTLP endpoint configuration
- Verify telemetry is enabled
- Ensure context propagation middleware is applied

### High Memory Usage
- Reduce memory snapshot frequency
- Lower metrics export interval
- Disable state snapshots in instrumentation

### Performance Impact
- Disable console export in production
- Increase metric export interval
- Use sampling for high-volume operations

## Integration with Monitoring Stack

### Recommended Stack
- **Tracing**: Jaeger or Tempo
- **Metrics**: Prometheus + Grafana
- **Logs**: Loki or Elasticsearch
- **Alerting**: Alertmanager

### Docker Compose Example

```yaml
version: '3.8'
services:
  otel-collector:
    image: otel/opentelemetry-collector:latest
    ports:
      - "4318:4318"
    volumes:
      - ./otel-config.yaml:/etc/otel-config.yaml
    command: ["--config=/etc/otel-config.yaml"]
  
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```