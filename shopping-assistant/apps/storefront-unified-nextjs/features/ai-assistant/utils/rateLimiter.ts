interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  timestamp: number;
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded. Please try again later.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  const requests = new Map<string, RequestRecord>();

  const isRateLimited = (key: string): boolean => {
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [storedKey, record] of requests.entries()) {
      if (record.timestamp < windowStart) {
        requests.delete(storedKey);
      }
    }

    const record = requests.get(key);
    if (!record) {
      requests.set(key, { count: 1, timestamp: now });
      return false;
    }

    if (record.timestamp < windowStart) {
      requests.set(key, { count: 1, timestamp: now });
      return false;
    }

    if (record.count >= options.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  };

  const checkRateLimit = (key: string) => {
    if (isRateLimited(key)) {
      throw new RateLimitError();
    }
  };

  return { checkRateLimit };
};
