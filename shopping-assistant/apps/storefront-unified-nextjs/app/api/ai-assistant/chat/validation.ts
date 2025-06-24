import { z } from 'zod';

/**
 * Chat request schema
 */
const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  threadId: z.string().optional(),
  sessionId: z.string().optional(),
  stream: z.boolean().optional().default(true),
  includeHistory: z.boolean().optional().default(true),
  locale: z.string().optional(),
  currency: z.string().optional(),
  timeout: z.number().min(1000).max(60000).optional(),
  debug: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional()
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  data?: ChatRequest;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validate chat request
 */
export function validateRequest(data: unknown): ValidationResult {
  try {
    // Basic type check
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'body', message: 'Request body must be an object' }]
      };
    }

    // Validate against schema
    const parsed = chatRequestSchema.parse(data);

    // Additional business logic validation
    const errors: Array<{ field: string; message: string }> = [];

    // Check for malicious content patterns
    if (containsMaliciousPatterns(parsed.message)) {
      errors.push({
        field: 'message',
        message: 'Message contains potentially malicious content'
      });
    }

    // Validate locale format
    if (parsed.locale && !isValidLocale(parsed.locale)) {
      errors.push({
        field: 'locale',
        message: 'Invalid locale format'
      });
    }

    // Validate currency format
    if (parsed.currency && !isValidCurrency(parsed.currency)) {
      errors.push({
        field: 'currency',
        message: 'Invalid currency code'
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }

    return {
      isValid: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
  }
}

/**
 * Check for malicious patterns
 */
function containsMaliciousPatterns(message: string): boolean {
  const patterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /data:text\/html/gi
  ];

  return patterns.some(pattern => pattern.test(message));
}

/**
 * Validate locale format
 */
function isValidLocale(locale: string): boolean {
  // Basic locale validation (e.g., en-US, fr-FR)
  const localeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
  return localeRegex.test(locale);
}

/**
 * Validate currency code
 */
function isValidCurrency(currency: string): boolean {
  // ISO 4217 currency codes
  const validCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
    'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY',
    'RUB', 'INR', 'BRL', 'ZAR', 'DKK', 'PLN', 'THB', 'IDR'
  ];
  
  return validCurrencies.includes(currency);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  // Remove control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Remove zero-width characters
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return sanitized;
}