/**
 * Observability dashboard configuration
 * Defines metrics, alerts, and visualizations for monitoring
 */

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'logs';
  query: string;
  description?: string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface DashboardRow {
  title: string;
  panels: DashboardPanel[];
}

export interface AlertRule {
  id: string;
  name: string;
  query: string;
  condition: {
    evaluator: 'gt' | 'lt' | 'eq' | 'ne';
    threshold: number;
  };
  duration: string; // e.g., "5m"
  severity: 'info' | 'warning' | 'critical';
  annotations: {
    summary: string;
    description: string;
  };
}

/**
 * Grafana dashboard configuration
 */
export const GrafanaDashboardConfig = {
  title: 'AI Shopping Assistant',
  description: 'Comprehensive monitoring for AI Shopping Assistant',
  tags: ['ai', 'shopping', 'langgraph', 'udl'],
  
  rows: [
    // Overview Row
    {
      title: 'Overview',
      panels: [
        {
          id: 'request_rate',
          title: 'Request Rate',
          type: 'graph',
          query: 'rate(ai_request_count[5m])',
          description: 'Requests per second'
        },
        {
          id: 'error_rate',
          title: 'Error Rate',
          type: 'stat',
          query: 'rate(ai_request_error_count[5m]) / rate(ai_request_count[5m]) * 100',
          description: 'Percentage of failed requests',
          thresholds: {
            warning: 5,
            critical: 10
          }
        },
        {
          id: 'active_sessions',
          title: 'Active Sessions',
          type: 'stat',
          query: 'ai_resource_active_sessions',
          description: 'Current active AI sessions'
        },
        {
          id: 'response_time_p95',
          title: 'Response Time (p95)',
          type: 'stat',
          query: 'histogram_quantile(0.95, rate(ai_request_duration_bucket[5m]))',
          description: '95th percentile response time',
          thresholds: {
            warning: 2000,
            critical: 5000
          }
        }
      ]
    },
    
    // LangGraph Performance Row
    {
      title: 'LangGraph Performance',
      panels: [
        {
          id: 'node_execution_time',
          title: 'Node Execution Time by Type',
          type: 'graph',
          query: 'histogram_quantile(0.95, sum by (node) (rate(ai_node_execution_duration_bucket[5m])))',
          description: 'P95 execution time per node type'
        },
        {
          id: 'graph_execution_duration',
          title: 'Graph Execution Duration',
          type: 'heatmap',
          query: 'ai_graph_execution_duration_bucket',
          description: 'Distribution of graph execution times'
        },
        {
          id: 'node_execution_count',
          title: 'Node Execution Count',
          type: 'graph',
          query: 'sum by (node) (rate(ai_node_execution_count[5m]))',
          description: 'Execution frequency by node type'
        }
      ]
    },
    
    // Action Performance Row
    {
      title: 'Action Performance',
      panels: [
        {
          id: 'action_success_rate',
          title: 'Action Success Rate',
          type: 'graph',
          query: 'sum by (action) (rate(ai_action_execution_count{success="true"}[5m])) / sum by (action) (rate(ai_action_execution_count[5m])) * 100',
          description: 'Success rate by action type'
        },
        {
          id: 'action_duration',
          title: 'Action Duration',
          type: 'graph',
          query: 'histogram_quantile(0.95, sum by (action) (rate(ai_action_execution_duration_bucket[5m])))',
          description: 'P95 duration by action'
        },
        {
          id: 'top_actions',
          title: 'Top Actions',
          type: 'table',
          query: 'topk(10, sum by (action) (rate(ai_action_execution_count[1h])))',
          description: 'Most frequently used actions'
        }
      ]
    },
    
    // UDL Integration Row
    {
      title: 'UDL Integration',
      panels: [
        {
          id: 'udl_call_rate',
          title: 'UDL Call Rate',
          type: 'graph',
          query: 'sum by (udl_method) (rate(ai_udl_call_count[5m]))',
          description: 'UDL method call frequency'
        },
        {
          id: 'udl_cache_hit_rate',
          title: 'UDL Cache Hit Rate',
          type: 'stat',
          query: 'sum(rate(ai_udl_call_count{cache_status="hit"}[5m])) / sum(rate(ai_udl_call_count[5m])) * 100',
          description: 'Percentage of cached UDL responses',
          thresholds: {
            warning: 70,
            critical: 50
          }
        },
        {
          id: 'udl_latency',
          title: 'UDL Call Latency',
          type: 'graph',
          query: 'histogram_quantile(0.95, sum by (udl_method) (rate(ai_udl_call_duration_bucket[5m])))',
          description: 'P95 latency by UDL method'
        }
      ]
    },
    
    // Business Metrics Row
    {
      title: 'Business Metrics',
      panels: [
        {
          id: 'cart_conversion_rate',
          title: 'Cart Conversion Rate',
          type: 'stat',
          query: 'ai_business_cart_conversion_rate',
          description: 'Percentage of carts that convert to orders',
          thresholds: {
            warning: 20,
            critical: 10
          }
        },
        {
          id: 'search_success_rate',
          title: 'Search Success Rate',
          type: 'stat',
          query: 'ai_business_search_success_rate',
          description: 'Percentage of successful searches'
        },
        {
          id: 'b2b_quotes',
          title: 'B2B Quotes Generated',
          type: 'graph',
          query: 'sum(rate(ai_business_b2b_quote_count[1h]))',
          description: 'B2B quote generation rate'
        },
        {
          id: 'mode_distribution',
          title: 'B2C vs B2B Distribution',
          type: 'graph',
          query: 'sum by (mode) (rate(ai_request_count[5m]))',
          description: 'Request distribution by mode'
        }
      ]
    },
    
    // Model Performance Row
    {
      title: 'Model Performance',
      panels: [
        {
          id: 'model_latency',
          title: 'Model Inference Latency',
          type: 'graph',
          query: 'histogram_quantile(0.95, sum by (model) (rate(ai_model_latency_bucket[5m])))',
          description: 'P95 model inference time'
        },
        {
          id: 'token_usage',
          title: 'Token Usage by Model',
          type: 'graph',
          query: 'sum by (model) (ai_model_token_usage)',
          description: 'Cumulative token usage'
        },
        {
          id: 'token_rate',
          title: 'Token Usage Rate',
          type: 'graph',
          query: 'sum by (model) (rate(ai_model_token_usage[5m]))',
          description: 'Tokens per second by model'
        }
      ]
    },
    
    // Resource Usage Row
    {
      title: 'Resource Usage',
      panels: [
        {
          id: 'memory_usage',
          title: 'Memory Usage',
          type: 'graph',
          query: 'ai_resource_memory_usage',
          description: 'Heap memory usage in MB'
        },
        {
          id: 'cpu_usage',
          title: 'CPU Usage',
          type: 'graph',
          query: 'rate(process_cpu_seconds_total[5m]) * 100',
          description: 'CPU utilization percentage'
        },
        {
          id: 'goroutines',
          title: 'Active Goroutines',
          type: 'graph',
          query: 'go_goroutines',
          description: 'Number of active goroutines'
        }
      ]
    }
  ] as DashboardRow[]
};

/**
 * Prometheus alert rules
 */
export const PrometheusAlertRules: AlertRule[] = [
  // Availability Alerts
  {
    id: 'high_error_rate',
    name: 'HighErrorRate',
    query: 'rate(ai_request_error_count[5m]) / rate(ai_request_count[5m]) > 0.1',
    condition: { evaluator: 'gt', threshold: 0 },
    duration: '5m',
    severity: 'critical',
    annotations: {
      summary: 'High error rate detected',
      description: 'Error rate is above 10% for the last 5 minutes'
    }
  },
  {
    id: 'high_response_time',
    name: 'HighResponseTime',
    query: 'histogram_quantile(0.95, rate(ai_request_duration_bucket[5m])) > 5000',
    condition: { evaluator: 'gt', threshold: 0 },
    duration: '5m',
    severity: 'warning',
    annotations: {
      summary: 'High response time detected',
      description: 'P95 response time is above 5 seconds'
    }
  },
  
  // Performance Alerts
  {
    id: 'slow_node_execution',
    name: 'SlowNodeExecution',
    query: 'histogram_quantile(0.95, rate(ai_node_execution_duration_bucket[5m])) > 2000',
    condition: { evaluator: 'gt', threshold: 0 },
    duration: '10m',
    severity: 'warning',
    annotations: {
      summary: 'Slow LangGraph node execution',
      description: 'Node execution time P95 is above 2 seconds'
    }
  },
  {
    id: 'low_cache_hit_rate',
    name: 'LowCacheHitRate',
    query: 'sum(rate(ai_udl_call_count{cache_status="hit"}[5m])) / sum(rate(ai_udl_call_count[5m])) < 0.5',
    condition: { evaluator: 'lt', threshold: 0 },
    duration: '15m',
    severity: 'info',
    annotations: {
      summary: 'Low UDL cache hit rate',
      description: 'Cache hit rate is below 50%'
    }
  },
  
  // Business Alerts
  {
    id: 'low_conversion_rate',
    name: 'LowConversionRate',
    query: 'ai_business_cart_conversion_rate < 10',
    condition: { evaluator: 'lt', threshold: 0 },
    duration: '30m',
    severity: 'warning',
    annotations: {
      summary: 'Low cart conversion rate',
      description: 'Cart conversion rate is below 10%'
    }
  },
  {
    id: 'action_failures',
    name: 'HighActionFailures',
    query: 'sum by (action) (rate(ai_action_execution_count{success="false"}[5m])) > 0.1',
    condition: { evaluator: 'gt', threshold: 0 },
    duration: '5m',
    severity: 'warning',
    annotations: {
      summary: 'High action failure rate',
      description: 'Action {{ $labels.action }} has high failure rate'
    }
  },
  
  // Resource Alerts
  {
    id: 'high_memory_usage',
    name: 'HighMemoryUsage',
    query: 'ai_resource_memory_usage > 1024',
    condition: { evaluator: 'gt', threshold: 0 },
    duration: '5m',
    severity: 'warning',
    annotations: {
      summary: 'High memory usage',
      description: 'Memory usage is above 1GB'
    }
  },
  {
    id: 'token_usage_spike',
    name: 'TokenUsageSpike',
    query: 'sum(rate(ai_model_token_usage[5m])) > 1000',
    condition: { evaluator: 'gt', threshold: 0 },
    duration: '5m',
    severity: 'info',
    annotations: {
      summary: 'High token usage detected',
      description: 'Token usage rate is above 1000 tokens/second'
    }
  }
];

/**
 * Export dashboard as JSON for Grafana import
 */
export function exportGrafanaDashboard(): string {
  const dashboard = {
    dashboard: {
      title: GrafanaDashboardConfig.title,
      description: GrafanaDashboardConfig.description,
      tags: GrafanaDashboardConfig.tags,
      timezone: 'browser',
      panels: GrafanaDashboardConfig.rows.flatMap((row, rowIndex) =>
        row.panels.map((panel, panelIndex) => ({
          id: rowIndex * 10 + panelIndex,
          title: panel.title,
          type: panel.type === 'stat' ? 'stat' : 'graph',
          gridPos: {
            h: 8,
            w: 6,
            x: (panelIndex % 4) * 6,
            y: rowIndex * 8
          },
          targets: [{
            expr: panel.query,
            refId: 'A'
          }],
          description: panel.description,
          thresholds: panel.thresholds
        }))
      )
    },
    overwrite: true
  };
  
  return JSON.stringify(dashboard, null, 2);
}

/**
 * Export Prometheus rules as YAML
 */
export function exportPrometheusRules(): string {
  const rules = {
    groups: [{
      name: 'ai_shopping_assistant',
      interval: '30s',
      rules: PrometheusAlertRules.map(rule => ({
        alert: rule.name,
        expr: rule.query,
        for: rule.duration,
        labels: {
          severity: rule.severity
        },
        annotations: rule.annotations
      }))
    }]
  };
  
  // Convert to YAML format (simplified)
  return `groups:
  - name: ai_shopping_assistant
    interval: 30s
    rules:
${rules.groups[0].rules.map(rule => `      - alert: ${rule.alert}
        expr: ${rule.expr}
        for: ${rule.for}
        labels:
          severity: ${rule.labels.severity}
        annotations:
          summary: "${rule.annotations.summary}"
          description: "${rule.annotations.description}"`).join('\n')}`;
}