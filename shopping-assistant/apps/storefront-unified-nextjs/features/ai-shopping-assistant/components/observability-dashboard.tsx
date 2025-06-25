'use client';

import { useState, useEffect, useRef } from 'react';
import type { CommerceState } from '../state';
import { getNodeAverageTime } from '../state';
import { PerfUtils } from '../observability/profiler';
import { SfButton, SfTabs } from '@storefront-ui/react';
import { logger } from '../observability';

export interface ObservabilityDashboardProps {
  state: CommerceState;
  toolRegistryStats?: {
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    toolCacheSize: number;
    schemaCacheSize: number;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  component: string;
  message: string;
  context?: Record<string, any>;
}

interface TraceSpan {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  status: 'ok' | 'error';
  attributes?: Record<string, any>;
}

export function ObservabilityDashboard({ 
  state, 
  toolRegistryStats,
  isOpen = true,
  onClose 
}: ObservabilityDashboardProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Capture logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    const captureLog = (level: LogEntry['level'], ...args: any[]) => {
      try {
        const message = args.join(' ');
        const parsed = JSON.parse(message);
        if (parsed.timestamp && parsed.level && parsed.component) {
          setLogs(prev => [...prev.slice(-100), parsed as LogEntry]);
        }
      } catch {
        // Not a structured log
      }
    };

    console.log = (...args) => {
      captureLog('info', ...args);
      originalConsoleLog(...args);
    };

    console.error = (...args) => {
      captureLog('error', ...args);
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      captureLog('warn', ...args);
      originalConsoleWarn(...args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Simulate trace collection from state
  useEffect(() => {
    if (state.performance.nodeExecutionTimes) {
      const newTraces: TraceSpan[] = [];
      let startTime = 0;
      
      Object.entries(state.performance.nodeExecutionTimes).forEach(([node, times]) => {
        times.forEach((duration, index) => {
          newTraces.push({
            id: `${node}-${index}`,
            name: `ai.node.${node}`,
            startTime,
            duration,
            status: state.error ? 'error' : 'ok',
            attributes: {
              sessionId: state.context.sessionId,
              correlationId: state.context.correlationId,
              mode: state.mode
            }
          });
          startTime += duration;
        });
      });
      
      setTraces(newTraces);
    }
  }, [state]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (refreshInterval) {
      const timer = setInterval(() => {
        setLastRefresh(Date.now());
      }, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [refreshInterval]);

  if (!isOpen || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { performance } = state;
  const nodes = Object.keys(performance.nodeExecutionTimes);
  
  // Calculate metrics
  const totalAvgTime = nodes.reduce((sum, node) => {
    return sum + getNodeAverageTime(state, node);
  }, 0);

  const slowestNode = nodes.reduce((slowest, node) => {
    const avgTime = getNodeAverageTime(state, node);
    const slowestTime = getNodeAverageTime(state, slowest);
    return avgTime > slowestTime ? node : slowest;
  }, nodes[0] || '');

  // Filter logs
  const filteredLogs = logs.filter(log => 
    logFilter === 'all' || log.level === logFilter
  );

  const tabs = [
    { label: 'Performance', value: 'performance' },
    { label: 'Traces', value: 'traces' },
    { label: 'Logs', value: 'logs' },
    { label: 'Metrics', value: 'metrics' },
    { label: 'Sessions', value: 'sessions' }
  ];

  return (
    <div className="fixed bottom-4 right-4 w-[600px] h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Assistant Observability
        </h3>
        <div className="flex items-center space-x-2">
          {state.context.correlationId && (
            <span className="text-xs text-gray-500 font-mono">
              {state.context.correlationId.slice(0, 8)}...
            </span>
          )}
          <SfButton
            size="sm"
            variant="tertiary"
            square
            onClick={onClose}
            className="!p-1"
          >
            ✕
          </SfButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4 px-4">
          {tabs.map((tab, index) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === index
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Performance Tab */}
        {activeTab === 0 && (
          <div>
            {/* Overall Performance */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Response Time
                </span>
                <span className={`text-sm font-bold ${totalAvgTime < 250 ? 'text-green-600' : totalAvgTime < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {PerfUtils.formatDuration(totalAvgTime)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${totalAvgTime < 250 ? 'bg-green-500' : totalAvgTime < 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min((totalAvgTime / 500) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Target: &lt;250ms | Session: {state.context.sessionId?.slice(0, 8)}
              </div>
            </div>

            {/* Node Execution Times */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Node Execution Times
              </h4>
              <div className="space-y-2">
                {nodes.map(node => {
                  const avgTime = getNodeAverageTime(state, node);
                  const execCount = performance.nodeExecutionTimes[node]?.length || 0;
                  const isSlowNote = node === slowestNode && nodes.length > 1;

                  return (
                    <div key={node} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {node}
                        {isSlowNote && <span className="text-xs text-red-500 ml-1">(slowest)</span>}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">×{execCount}</span>
                        <span className={`font-mono ${avgTime > 100 ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300'}`}>
                          {PerfUtils.formatDuration(avgTime)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cache Performance */}
            {toolRegistryStats && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cache Performance
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400 text-xs">Tool Cache Hit Rate</div>
                    <div className={`font-bold ${toolRegistryStats.hitRate > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {(toolRegistryStats.hitRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400 text-xs">State Cache Hit Rate</div>
                    <div className="font-bold text-gray-700 dark:text-gray-300">
                      {performance.cacheHits > 0 ? 
                        ((performance.cacheHits / (performance.cacheHits + performance.cacheMisses)) * 100).toFixed(1) : 
                        '0'}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traces Tab */}
        {activeTab === 1 && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trace Timeline
              </h4>
              <div className="space-y-2">
                {traces.map((span, index) => (
                  <div key={span.id} className="relative">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-32 text-gray-600 dark:text-gray-400 truncate">
                        {span.name}
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-6 relative">
                        <div
                          className={`absolute h-full rounded ${span.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{
                            left: `${(span.startTime / (traces[traces.length - 1]?.startTime + traces[traces.length - 1]?.duration || 1)) * 100}%`,
                            width: `${(span.duration / (traces[traces.length - 1]?.startTime + traces[traces.length - 1]?.duration || 1)) * 100}%`
                          }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-mono">
                            {span.duration}ms
                          </span>
                        </div>
                      </div>
                    </div>
                    {span.attributes && (
                      <div className="ml-36 text-xs text-gray-500 mt-1">
                        {Object.entries(span.attributes).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 2 && (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Live Logs
              </h4>
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="text-xs px-2 py-1 border border-gray-300 rounded"
              >
                <option value="all">All</option>
                <option value="error">Error</option>
                <option value="warn">Warn</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="space-y-1 font-mono text-xs">
              {filteredLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`p-1 rounded ${
                    log.level === 'error' ? 'bg-red-50 text-red-800' :
                    log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
                    log.level === 'debug' ? 'bg-gray-50 text-gray-600' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  <span className="font-semibold">[{log.component}]</span>
                  <span className="ml-2">{log.message}</span>
                  {log.context?.correlationId && (
                    <span className="ml-2 text-gray-500">
                      [{log.context.correlationId.slice(0, 8)}]
                    </span>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 3 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Business Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Mode</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {state.mode.toUpperCase()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Trust Score</div>
                <div className={`text-lg font-bold ${state.security.trustScore > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {state.security.trustScore}/100
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Cart Items</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {state.cart.items.length}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Cart Value</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {state.context.currency} {state.cart.total || 0}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Actions Available</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {state.availableActions.enabled.length}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Intent</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {state.context.detectedIntent || 'unknown'}
                </div>
              </div>
            </div>

            {/* Security Status */}
            {state.security.threatLevel !== 'none' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="text-sm font-medium text-red-800 mb-2">Security Alerts</h5>
                <div className="text-xs text-red-700">
                  <div>Threat Level: {state.security.threatLevel}</div>
                  <div>Patterns: {state.security.detectedPatterns.join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 4 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Session Information
            </h4>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Session ID</div>
                <div className="font-mono text-sm text-gray-900 dark:text-white">
                  {state.context.sessionId}
                </div>
              </div>
              {state.context.correlationId && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Correlation ID</div>
                  <div className="font-mono text-sm text-gray-900 dark:text-white">
                    {state.context.correlationId}
                  </div>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Customer Type</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {state.context.customerId ? 'Registered' : 'Guest'}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Messages</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {state.messages.length} messages
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">Locale</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {state.context.locale} / {state.context.currency}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with refresh controls */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Last refresh: {new Date(lastRefresh).toLocaleTimeString()}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setRefreshInterval(null)}
              className={`px-2 py-1 rounded text-xs ${refreshInterval === null ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              Off
            </button>
            <button
              onClick={() => setRefreshInterval(1000)}
              className={`px-2 py-1 rounded text-xs ${refreshInterval === 1000 ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              1s
            </button>
            <button
              onClick={() => setRefreshInterval(5000)}
              className={`px-2 py-1 rounded text-xs ${refreshInterval === 5000 ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              5s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}