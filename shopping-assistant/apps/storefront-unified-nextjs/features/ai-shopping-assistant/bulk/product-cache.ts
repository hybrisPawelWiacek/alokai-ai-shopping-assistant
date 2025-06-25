import type { ProductAvailability } from './bulk-processor';

/**
 * Cache entry for product data
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in ms
  maxSize: number; // Maximum cache entries
  enableMetrics: boolean;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300000, // 5 minutes
  maxSize: 1000,
  enableMetrics: true
};

/**
 * Product cache for bulk operations
 * Implements LRU cache with TTL
 */
export class ProductCache {
  private cache = new Map<string, CacheEntry<ProductAvailability>>();
  private accessOrder: string[] = [];
  private metrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0
  };

  constructor(private config: CacheConfig = DEFAULT_CACHE_CONFIG) {}

  /**
   * Get product from cache
   */
  get(sku: string): ProductAvailability | null {
    const entry = this.cache.get(sku);
    
    if (!entry) {
      if (this.config.enableMetrics) this.metrics.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(sku);
      this.removeFromAccessOrder(sku);
      if (this.config.enableMetrics) this.metrics.expirations++;
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(sku);
    entry.hits++;
    if (this.config.enableMetrics) this.metrics.hits++;

    return entry.value;
  }

  /**
   * Set product in cache
   */
  set(sku: string, product: ProductAvailability): void {
    // Check cache size limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(sku)) {
      this.evictLRU();
    }

    this.cache.set(sku, {
      value: product,
      timestamp: Date.now(),
      hits: 0
    });

    this.updateAccessOrder(sku);
  }

  /**
   * Batch get multiple products
   */
  batchGet(skus: string[]): Map<string, ProductAvailability | null> {
    const results = new Map<string, ProductAvailability | null>();
    
    for (const sku of skus) {
      results.set(sku, this.get(sku));
    }

    return results;
  }

  /**
   * Batch set multiple products
   */
  batchSet(products: Map<string, ProductAvailability>): void {
    for (const [sku, product] of products) {
      this.set(sku, product);
    }
  }

  /**
   * Invalidate specific SKU
   */
  invalidate(sku: string): void {
    this.cache.delete(sku);
    this.removeFromAccessOrder(sku);
  }

  /**
   * Invalidate multiple SKUs
   */
  batchInvalidate(skus: string[]): void {
    for (const sku of skus) {
      this.invalidate(sku);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    metrics: typeof this.metrics;
    oldestEntry?: { sku: string; age: number };
    mostAccessed?: { sku: string; hits: number };
  } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? this.metrics.hits / total : 0;

    let oldestEntry: { sku: string; age: number } | undefined;
    let mostAccessed: { sku: string; hits: number } | undefined;

    for (const [sku, entry] of this.cache) {
      const age = Date.now() - entry.timestamp;
      
      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = { sku, age };
      }

      if (!mostAccessed || entry.hits > mostAccessed.hits) {
        mostAccessed = { sku, hits: entry.hits };
      }
    }

    return {
      size: this.cache.size,
      hitRate,
      metrics: { ...this.metrics },
      oldestEntry,
      mostAccessed
    };
  }

  /**
   * Warm cache with frequently accessed products
   */
  async warmCache(
    skus: string[],
    fetcher: (sku: string) => Promise<ProductAvailability>
  ): Promise<void> {
    const chunks = this.chunkArray(skus, 10); // Process in chunks of 10
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (sku) => {
          try {
            const product = await fetcher(sku);
            this.set(sku, product);
          } catch (error) {
            // Skip failed items during warm-up
            console.warn(`Failed to warm cache for SKU ${sku}:`, error);
          }
        })
      );
    }
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(sku: string): void {
    this.removeFromAccessOrder(sku);
    this.accessOrder.push(sku);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(sku: string): void {
    const index = this.accessOrder.indexOf(sku);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lru = this.accessOrder.shift();
    if (lru) {
      this.cache.delete(lru);
      if (this.config.enableMetrics) this.metrics.evictions++;
    }
  }

  /**
   * Chunk array helper
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Singleton instance for global cache
 */
let globalCache: ProductCache | null = null;

export function getProductCache(config?: CacheConfig): ProductCache {
  if (!globalCache) {
    globalCache = new ProductCache(config);
  }
  return globalCache;
}

/**
 * Cache-aware product fetcher
 */
export class CachedProductFetcher {
  private cache: ProductCache;

  constructor(
    private fetcher: (sku: string) => Promise<ProductAvailability>,
    cacheConfig?: CacheConfig
  ) {
    this.cache = new ProductCache(cacheConfig);
  }

  /**
   * Fetch product with cache
   */
  async fetch(sku: string): Promise<ProductAvailability> {
    // Check cache first
    const cached = this.cache.get(sku);
    if (cached) {
      return cached;
    }

    // Fetch from source
    const product = await this.fetcher(sku);
    
    // Cache the result
    this.cache.set(sku, product);
    
    return product;
  }

  /**
   * Batch fetch with cache
   */
  async batchFetch(skus: string[]): Promise<Map<string, ProductAvailability>> {
    const results = new Map<string, ProductAvailability>();
    const cacheMisses: string[] = [];

    // Check cache for all SKUs
    for (const sku of skus) {
      const cached = this.cache.get(sku);
      if (cached) {
        results.set(sku, cached);
      } else {
        cacheMisses.push(sku);
      }
    }

    // Fetch missing items in parallel
    if (cacheMisses.length > 0) {
      const fetchPromises = cacheMisses.map(async (sku) => {
        try {
          const product = await this.fetcher(sku);
          this.cache.set(sku, product);
          results.set(sku, product);
        } catch (error) {
          console.error(`Failed to fetch SKU ${sku}:`, error);
        }
      });

      await Promise.all(fetchPromises);
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}