import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RateLimiter, createTieredRateLimiter } from '../rate-limiter';

describe('Rate Limiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10
    });
  });

  afterEach(() => {
    rateLimiter.destroy();
    jest.useRealTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.check('user-123');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9 - i);
      }
    });

    it('should block requests over limit', async () => {
      // Use up all requests
      for (let i = 0; i < 10; i++) {
        await rateLimiter.check('user-123');
      }

      // Next request should be blocked
      const result = await rateLimiter.check('user-123');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should reset after window expires', async () => {
      // Use up all requests
      for (let i = 0; i < 10; i++) {
        await rateLimiter.check('user-123');
      }

      // Advance time past window
      jest.advanceTimersByTime(61000);

      // Should allow requests again
      const result = await rateLimiter.check('user-123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track different users separately', async () => {
      // Use requests for user-123
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check('user-123');
      }

      // user-456 should have full quota
      const result = await rateLimiter.check('user-456');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('Key Generator', () => {
    it('should use custom key generator', async () => {
      const customLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyGenerator: (id) => `custom:${id}`
      });

      try {
        const result1 = await customLimiter.check('user-123');
        const result2 = await customLimiter.check('user-123');

        expect(result1.remaining).toBe(4);
        expect(result2.remaining).toBe(3);
      } finally {
        customLimiter.destroy();
      }
    });
  });

  describe('Reset Functionality', () => {
    it('should reset rate limit for user', async () => {
      // Use some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check('user-123');
      }

      // Reset
      await rateLimiter.reset('user-123');

      // Should have full quota again
      const result = await rateLimiter.check('user-123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired entries', async () => {
      // Create entries for multiple users
      await rateLimiter.check('user-1');
      await rateLimiter.check('user-2');
      await rateLimiter.check('user-3');

      // Advance time to trigger cleanup
      jest.advanceTimersByTime(120000); // 2 minutes

      // New requests should start fresh
      const result = await rateLimiter.check('user-1');
      expect(result.remaining).toBe(9);
    });
  });

  describe('Tiered Rate Limiting', () => {
    it('should apply different limits for different tiers', async () => {
      const limiters = createTieredRateLimiter();

      try {
        // Anonymous tier (10 requests/min)
        for (let i = 0; i < 10; i++) {
          const result = await limiters.anonymous.check('anon-user');
          expect(result.allowed).toBe(true);
        }
        const anonBlocked = await limiters.anonymous.check('anon-user');
        expect(anonBlocked.allowed).toBe(false);

        // Authenticated tier (60 requests/min)
        for (let i = 0; i < 60; i++) {
          const result = await limiters.authenticated.check('auth-user');
          expect(result.allowed).toBe(true);
        }
        const authBlocked = await limiters.authenticated.check('auth-user');
        expect(authBlocked.allowed).toBe(false);

        // Business tier (300 requests/min)
        for (let i = 0; i < 100; i++) {
          const result = await limiters.business.check('b2b-user');
          expect(result.allowed).toBe(true);
        }
        // Should still have quota left
        const b2bResult = await limiters.business.check('b2b-user');
        expect(b2bResult.allowed).toBe(true);
        expect(b2bResult.remaining).toBe(198);
      } finally {
        Object.values(limiters).forEach(l => l.destroy());
      }
    });
  });
});