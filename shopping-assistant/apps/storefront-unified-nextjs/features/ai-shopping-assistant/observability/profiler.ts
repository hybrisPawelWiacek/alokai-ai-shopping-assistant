import { performance, PerformanceObserver } from 'perf_hooks';
import { Loggers } from './logger';
import { metrics } from './metrics';

/**
 * Performance profiling utilities
 * Provides detailed performance analysis for optimization
 */

export interface ProfileResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
  children?: ProfileResult[];
}

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
}

/**
 * Performance profiler class
 */
export class PerformanceProfiler {
  private marks = new Map<string, number>();
  private measures = new Map<string, ProfileResult>();
  private activeProfiles = new Map<string, ProfileResult>();
  private memorySnapshots: MemorySnapshot[] = [];
  
  constructor(private options: {
    autoLog?: boolean;
    logThreshold?: number; // Only log operations slower than this (ms)
    captureMemory?: boolean;
    maxSnapshots?: number;
  } = {}) {
    this.options = {
      autoLog: false,
      logThreshold: 100,
      captureMemory: true,
      maxSnapshots: 1000,
      ...options
    };
  }
  
  /**
   * Start profiling an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    this.marks.set(name, startTime);
    
    const profile: ProfileResult = {
      name,
      startTime,
      duration: 0,
      endTime: 0,
      metadata,
      children: []
    };
    
    this.activeProfiles.set(name, profile);
    
    // Capture memory snapshot if enabled
    if (this.options.captureMemory) {
      this.captureMemorySnapshot();
    }
  }
  
  /**
   * End profiling an operation
   */
  end(name: string): ProfileResult | null {
    const startTime = this.marks.get(name);
    if (!startTime) {
      Loggers.ai.warn(`No start mark found for profile: ${name}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const profile = this.activeProfiles.get(name);
    if (profile) {
      profile.endTime = endTime;
      profile.duration = duration;
      this.measures.set(name, profile);
      this.activeProfiles.delete(name);
    }
    
    this.marks.delete(name);
    
    // Auto-log if enabled and above threshold
    if (this.options.autoLog && duration >= this.options.logThreshold!) {
      Loggers.ai.info(`Performance profile: ${name}`, {
        duration_ms: duration,
        ...profile?.metadata
      });
    }
    
    // Record metrics
    metrics.recordRequestDuration(duration, {
      action: name
    });
    
    return profile || { name, startTime, endTime, duration };
  }
  
  /**
   * Profile an async operation
   */
  async profile<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; profile: ProfileResult }> {
    this.start(name, metadata);
    
    try {
      const result = await operation();
      const profile = this.end(name)!;
      
      return { result, profile };
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
  
  /**
   * Profile a sync operation
   */
  profileSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): { result: T; profile: ProfileResult } {
    this.start(name, metadata);
    
    try {
      const result = operation();
      const profile = this.end(name)!;
      
      return { result, profile };
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
  
  /**
   * Add a child profile to an active parent
   */
  addChildProfile(parentName: string, childProfile: ProfileResult): void {
    const parent = this.activeProfiles.get(parentName);
    if (parent) {
      parent.children!.push(childProfile);
    }
  }
  
  /**
   * Capture memory snapshot
   */
  private captureMemorySnapshot(): void {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      rss: memUsage.rss
    };
    
    this.memorySnapshots.push(snapshot);
    
    // Limit snapshots
    if (this.memorySnapshots.length > this.options.maxSnapshots!) {
      this.memorySnapshots.shift();
    }
  }
  
  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    current: MemorySnapshot;
    peak: MemorySnapshot;
    average: MemorySnapshot;
  } | null {
    if (this.memorySnapshots.length === 0) return null;
    
    const current = this.memorySnapshots[this.memorySnapshots.length - 1];
    const peak = this.memorySnapshots.reduce((max, snapshot) => 
      snapshot.heapUsed > max.heapUsed ? snapshot : max
    );
    
    const totals = this.memorySnapshots.reduce((acc, snapshot) => ({
      heapUsed: acc.heapUsed + snapshot.heapUsed,
      heapTotal: acc.heapTotal + snapshot.heapTotal,
      external: acc.external + snapshot.external,
      arrayBuffers: acc.arrayBuffers + snapshot.arrayBuffers,
      rss: acc.rss + snapshot.rss
    }), {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      rss: 0
    });
    
    const count = this.memorySnapshots.length;
    const average: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: totals.heapUsed / count,
      heapTotal: totals.heapTotal / count,
      external: totals.external / count,
      arrayBuffers: totals.arrayBuffers / count,
      rss: totals.rss / count
    };
    
    return { current, peak, average };
  }
  
  /**
   * Get all completed profiles
   */
  getProfiles(): ProfileResult[] {
    return Array.from(this.measures.values());
  }
  
  /**
   * Get profile summary
   */
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowestOperation: ProfileResult | null;
    operationsByDuration: ProfileResult[];
  } {
    const profiles = this.getProfiles();
    
    if (profiles.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
        operationsByDuration: []
      };
    }
    
    const totalDuration = profiles.reduce((sum, p) => sum + p.duration, 0);
    const averageDuration = totalDuration / profiles.length;
    
    const operationsByDuration = [...profiles].sort((a, b) => b.duration - a.duration);
    const slowestOperation = operationsByDuration[0];
    
    return {
      totalOperations: profiles.length,
      averageDuration,
      slowestOperation,
      operationsByDuration
    };
  }
  
  /**
   * Clear all profiles and snapshots
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
    this.activeProfiles.clear();
    this.memorySnapshots = [];
  }
}

/**
 * CPU profiler using V8 profiler API
 */
export class CPUProfiler {
  private profiling = false;
  private startTime = 0;
  
  /**
   * Start CPU profiling
   */
  start(): void {
    if (this.profiling) {
      Loggers.ai.warn('CPU profiling already in progress');
      return;
    }
    
    try {
      // This would use the V8 profiler in a real implementation
      // For now, we'll use performance marks
      this.profiling = true;
      this.startTime = performance.now();
      
      Loggers.ai.info('CPU profiling started');
    } catch (error) {
      Loggers.ai.error('Failed to start CPU profiling', error);
    }
  }
  
  /**
   * Stop CPU profiling and return results
   */
  stop(): { duration: number; profile?: any } | null {
    if (!this.profiling) {
      Loggers.ai.warn('No CPU profiling in progress');
      return null;
    }
    
    try {
      const duration = performance.now() - this.startTime;
      this.profiling = false;
      
      Loggers.ai.info('CPU profiling stopped', { duration_ms: duration });
      
      // In a real implementation, this would return the V8 CPU profile
      return { duration };
    } catch (error) {
      Loggers.ai.error('Failed to stop CPU profiling', error);
      return null;
    }
  }
}

/**
 * Performance observer for monitoring specific operations
 */
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private thresholds: Map<string, number> = new Map();
  
  constructor(private options: {
    slowOperationThreshold?: number;
    onSlowOperation?: (entry: PerformanceEntry) => void;
  } = {}) {
    this.options = {
      slowOperationThreshold: 1000,
      ...options
    };
  }
  
  /**
   * Start monitoring performance
   */
  start(): void {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processEntry(entry);
      }
    });
    
    this.observer.observe({ entryTypes: ['measure', 'mark'] });
  }
  
  /**
   * Process a performance entry
   */
  private processEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'measure') {
      const threshold = this.thresholds.get(entry.name) || this.options.slowOperationThreshold!;
      
      if (entry.duration > threshold) {
        Loggers.ai.warn(`Slow operation detected: ${entry.name}`, {
          duration_ms: entry.duration,
          threshold_ms: threshold
        });
        
        if (this.options.onSlowOperation) {
          this.options.onSlowOperation(entry);
        }
      }
    }
  }
  
  /**
   * Set threshold for specific operation
   */
  setThreshold(operationName: string, thresholdMs: number): void {
    this.thresholds.set(operationName, thresholdMs);
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Decorator for automatic profiling
 */
export function Profile(name?: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const profileName = name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function(...args: any[]) {
      const profiler = new PerformanceProfiler({ autoLog: true });
      const { result } = await profiler.profile(profileName, () => originalMethod.apply(this, args));
      return result;
    };
    
    return descriptor;
  };
}

/**
 * Global profiler instance
 */
export const globalProfiler = new PerformanceProfiler({
  autoLog: true,
  logThreshold: 100,
  captureMemory: true
});

/**
 * Utility functions
 */
export const PerfUtils = {
  /**
   * Format duration for human readability
   */
  formatDuration(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  },
  
  /**
   * Format memory size
   */
  formatMemory(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)}KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)}MB`;
    return `${(bytes / 1073741824).toFixed(2)}GB`;
  },
  
  /**
   * Create a performance report
   */
  createReport(profiler: PerformanceProfiler): string {
    const summary = profiler.getSummary();
    const memStats = profiler.getMemoryStats();
    
    let report = '=== Performance Report ===\n\n';
    
    report += `Total Operations: ${summary.totalOperations}\n`;
    report += `Average Duration: ${this.formatDuration(summary.averageDuration)}\n`;
    
    if (summary.slowestOperation) {
      report += `Slowest Operation: ${summary.slowestOperation.name} (${this.formatDuration(summary.slowestOperation.duration)})\n`;
    }
    
    report += '\nTop 10 Slowest Operations:\n';
    summary.operationsByDuration.slice(0, 10).forEach((op, index) => {
      report += `${index + 1}. ${op.name}: ${this.formatDuration(op.duration)}\n`;
    });
    
    if (memStats) {
      report += '\n=== Memory Statistics ===\n';
      report += `Current Heap: ${this.formatMemory(memStats.current.heapUsed)}\n`;
      report += `Peak Heap: ${this.formatMemory(memStats.peak.heapUsed)}\n`;
      report += `Average Heap: ${this.formatMemory(memStats.average.heapUsed)}\n`;
      report += `RSS: ${this.formatMemory(memStats.current.rss)}\n`;
    }
    
    return report;
  }
};