'use client';

import { useState, useEffect } from 'react';
import type { CommerceState, PerformanceMetrics } from '../state';
import { getNodeAverageTime } from '../state';
import { PerfUtils } from '../observability/profiler';
import { SfButton } from '@storefront-ui/react';

export interface PerformanceDashboardProps {
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

export function PerformanceDashboard({ 
  state, 
  toolRegistryStats,
  isOpen = true,
  onClose 
}: PerformanceDashboardProps): JSX.Element | null {
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

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
  
  // Calculate total average time
  const totalAvgTime = nodes.reduce((sum, node) => {
    return sum + getNodeAverageTime(state, node);
  }, 0);

  // Find slowest node
  const slowestNode = nodes.reduce((slowest, node) => {
    const avgTime = getNodeAverageTime(state, node);
    const slowestTime = getNodeAverageTime(state, slowest);
    return avgTime > slowestTime ? node : slowest;
  }, nodes[0] || '');

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Monitor
        </h3>
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
          Target: &lt;250ms
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
            Tool Registry Cache
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="text-gray-600 dark:text-gray-400 text-xs">Hit Rate</div>
              <div className={`font-bold ${toolRegistryStats.hitRate > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                {(toolRegistryStats.hitRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="text-gray-600 dark:text-gray-400 text-xs">Cache Size</div>
              <div className="font-bold text-gray-700 dark:text-gray-300">
                {toolRegistryStats.toolCacheSize} tools
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="text-gray-600 dark:text-gray-400 text-xs">Hits</div>
              <div className="font-bold text-green-600">
                {toolRegistryStats.cacheHits}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="text-gray-600 dark:text-gray-400 text-xs">Misses</div>
              <div className="font-bold text-yellow-600">
                {toolRegistryStats.cacheMisses}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-600 dark:text-gray-400 text-xs">Tool Executions</div>
          <div className="font-bold text-gray-700 dark:text-gray-300">
            {performance.toolExecutionCount}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
          <div className="text-gray-600 dark:text-gray-400 text-xs">State Cache</div>
          <div className="font-bold text-gray-700 dark:text-gray-300">
            {performance.cacheHits}/{performance.cacheHits + performance.cacheMisses}
          </div>
        </div>
      </div>

      {/* Auto-refresh controls */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Auto-refresh</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setRefreshInterval(null)}
              className={`px-2 py-1 rounded ${refreshInterval === null ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              Off
            </button>
            <button
              onClick={() => setRefreshInterval(1000)}
              className={`px-2 py-1 rounded ${refreshInterval === 1000 ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              1s
            </button>
            <button
              onClick={() => setRefreshInterval(5000)}
              className={`px-2 py-1 rounded ${refreshInterval === 5000 ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              5s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}