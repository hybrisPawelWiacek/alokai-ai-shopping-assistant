import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Loggers } from '@/features/ai-shopping-assistant/observability';

const logger = Loggers.api;

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Authentication middleware
 * Validates API keys or JWT tokens
 */
export async function authenticate(request: NextRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    // Validate API key (in production, check against database)
    const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
    if (validApiKeys.includes(apiKey)) {
      logger.info('API key authentication successful');
      return { valid: true, userId: `api-${apiKey.substring(0, 8)}` };
    }
    return { valid: false, error: 'Invalid API key' };
  }

  // Check for JWT token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // TODO: Implement JWT validation
      // For now, accept any Bearer token in development
      if (process.env.NODE_ENV === 'development') {
        return { valid: true, userId: 'dev-user' };
      }
      
      // In production, validate JWT properly
      return { valid: false, error: 'JWT validation not implemented' };
    } catch (error) {
      logger.error('JWT validation failed', { error });
      return { valid: false, error: 'Invalid token' };
    }
  }

  // Allow unauthenticated requests in development
  if (process.env.NODE_ENV === 'development') {
    return { valid: true, userId: 'anonymous' };
  }

  return { valid: false, error: 'Authentication required' };
}

/**
 * Rate limiting middleware
 * Implements token bucket algorithm
 */
export async function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    // New window
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    // Clean up old entries
    if (rateLimitStore.size > 10000) {
      cleanupRateLimitStore(now);
    }
    
    return { allowed: true };
  }

  if (clientData.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    logger.warn('Rate limit exceeded', { clientId, retryAfter });
    return { allowed: false, retryAfter };
  }

  // Increment counter
  clientData.count++;
  return { allowed: true };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore(now: number): void {
  for (const [clientId, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(clientId);
    }
  }
}

/**
 * Validate request origin for CORS
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow requests without origin (e.g., Postman)

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  
  // Allow all origins in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check against allowed origins
  if (allowedOrigins.length === 0) {
    // If no origins specified, allow the app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return appUrl ? origin === appUrl : false;
  }

  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    if (allowed.includes('*')) {
      // Handle wildcard domains (e.g., *.example.com)
      const regex = new RegExp('^' + allowed.replace('*', '.*') + '$');
      return regex.test(origin);
    }
    return origin === allowed;
  });
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers are handled separately in OPTIONS handler
  
  return response;
}

/**
 * Log request details for monitoring
 */
export function logRequest(request: NextRequest, userId: string, metadata: any = {}): void {
  logger.info('AI Assistant API request', {
    method: request.method,
    url: request.url,
    userId,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    ...metadata,
  });
}