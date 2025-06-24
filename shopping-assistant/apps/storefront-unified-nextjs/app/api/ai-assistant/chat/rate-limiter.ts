/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
}

/**
 * In-memory rate limiter (for demo - use Redis in production)
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (data.resetAt < now) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if request is allowed
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyGenerator?.(identifier) || identifier;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get or create request data
    let requestData = this.requests.get(key);
    
    if (!requestData || requestData.resetAt < now) {
      // Create new window
      requestData = {
        count: 0,
        resetAt: now + this.config.windowMs
      };
      this.requests.set(key, requestData);
    }

    // Increment request count
    requestData.count++;

    // Check if limit exceeded
    const allowed = requestData.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - requestData.count);
    const reset = new Date(requestData.resetAt);
    
    const result: RateLimitResult = {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      reset
    };

    if (!allowed) {
      result.retryAfter = Math.ceil((requestData.resetAt - now) / 1000);
    }

    return result;
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = this.config.keyGenerator?.(identifier) || identifier;
    this.requests.delete(key);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * Create rate limiter with different tiers
 */
export function createTieredRateLimiter(): {
  anonymous: RateLimiter;
  authenticated: RateLimiter;
  business: RateLimiter;
} {
  return {
    // Anonymous users: 10 requests per minute
    anonymous: new RateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 10,
      keyGenerator: (id) => `anon:${id}`
    }),
    
    // Authenticated users: 60 requests per minute
    authenticated: new RateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 60,
      keyGenerator: (id) => `auth:${id}`
    }),
    
    // Business users: 300 requests per minute
    business: new RateLimiter({
      windowMs: 60 * 1000,
      maxRequests: 300,
      keyGenerator: (id) => `b2b:${id}`
    })
  };
}

// Create default rate limiter instance
export const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30 // 30 requests per minute default
});

/**
 * Middleware for rate limiting
 */
export async function rateLimitMiddleware(
  request: Request,
  clientId: string,
  tier: 'anonymous' | 'authenticated' | 'business' = 'authenticated'
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const limiters = createTieredRateLimiter();
  const limiter = limiters[tier];
  
  try {
    const result = await limiter.check(clientId);
    
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': result.reset.toISOString()
    };
    
    if (!result.allowed && result.retryAfter) {
      headers['Retry-After'] = String(result.retryAfter);
    }
    
    return {
      allowed: result.allowed,
      headers
    };
  } finally {
    // Clean up limiters
    Object.values(limiters).forEach(l => l.destroy());
  }
}