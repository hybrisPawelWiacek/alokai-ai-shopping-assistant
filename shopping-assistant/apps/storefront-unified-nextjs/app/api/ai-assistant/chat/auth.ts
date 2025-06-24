import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Authentication result
 */
export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  role?: 'customer' | 'business' | 'admin';
  permissions?: string[];
}

/**
 * Session data structure
 */
interface SessionData {
  userId: string;
  role: 'customer' | 'business' | 'admin';
  permissions?: string[];
  expiresAt: number;
}

/**
 * Authenticate user from request
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Check multiple auth sources
    const sessionData = await getSessionData(request);
    
    if (!sessionData) {
      // For demo/development, allow anonymous access with limitations
      if (process.env.NODE_ENV === 'development' || process.env.ALLOW_ANONYMOUS === 'true') {
        return {
          isAuthenticated: true,
          userId: `anonymous_${Date.now()}`,
          role: 'customer',
          permissions: ['chat.read', 'chat.write']
        };
      }
      return { isAuthenticated: false };
    }

    // Check session expiration
    if (sessionData.expiresAt < Date.now()) {
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      userId: sessionData.userId,
      role: sessionData.role,
      permissions: sessionData.permissions || []
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { isAuthenticated: false };
  }
}

/**
 * Get session data from various sources
 */
async function getSessionData(request: NextRequest): Promise<SessionData | null> {
  // 1. Check Authorization header (for API access)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return parseSessionToken(token);
  }

  // 2. Check cookies
  const cookieStore = cookies();
  
  // Check auth-token cookie
  const authCookie = cookieStore.get('auth-token');
  if (authCookie?.value) {
    return parseSessionToken(authCookie.value);
  }

  // 3. Check session cookie (for SSR)
  const sessionCookie = cookieStore.get('session');
  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.userId) {
        return {
          userId: session.userId,
          role: session.role || 'customer',
          permissions: session.permissions,
          expiresAt: session.expiresAt || Date.now() + 86400000 // 24 hours
        };
      }
    } catch {
      // Invalid session format
    }
  }

  // 4. Check for API key (for service-to-service)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && isValidApiKey(apiKey)) {
    return {
      userId: `service_${apiKey.substring(0, 8)}`,
      role: 'admin',
      permissions: ['all'],
      expiresAt: Date.now() + 3600000 // 1 hour
    };
  }

  return null;
}

/**
 * Parse session token (simple base64 encoding for demo)
 */
function parseSessionToken(token: string): SessionData | null {
  try {
    // In production, this would verify a JWT or validate against a session store
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    
    if (data.userId && data.expiresAt) {
      return {
        userId: data.userId,
        role: data.role || 'customer',
        permissions: data.permissions,
        expiresAt: data.expiresAt
      };
    }
  } catch {
    // Invalid token
  }
  
  return null;
}

/**
 * Validate API key
 */
function isValidApiKey(apiKey: string): boolean {
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  return validApiKeys.includes(apiKey);
}

/**
 * Check if user has required permission
 */
export function hasPermission(auth: AuthResult, permission: string): boolean {
  if (!auth.isAuthenticated) {
    return false;
  }

  // Admin has all permissions
  if (auth.role === 'admin') {
    return true;
  }

  // Check specific permissions
  return auth.permissions?.includes(permission) || false;
}

/**
 * Get user context for logging
 */
export function getUserContext(auth: AuthResult): Record<string, any> {
  if (!auth.isAuthenticated) {
    return { anonymous: true };
  }

  return {
    userId: auth.userId,
    role: auth.role,
    permissions: auth.permissions
  };
}