import type { CommerceState } from '../state';
import type { ValidationResult } from './judge';

/**
 * Specialized validator for prompt injection attempts
 */
export class PromptInjectionValidator {
  private static readonly INJECTION_PATTERNS = {
    // System prompt overrides
    systemOverride: [
      /you\s+are\s+now\s+a\s+(\w+\s*)+assistant/i,
      /forget\s+your\s+instructions/i,
      /ignore\s+previous\s+context/i,
      /new\s+instructions?\s*:/i,
      /\bsystem\s*prompt\s*:/i,
      /<<SYS>>.*<<\/SYS>>/s,
      /\[SYSTEM\].*\[\/SYSTEM\]/s
    ],
    // Role playing attempts
    rolePlay: [
      /pretend\s+you\s+are/i,
      /act\s+as\s+if/i,
      /roleplay\s+as/i,
      /you\s+are\s+playing/i,
      /simulate\s+being/i
    ],
    // Instruction injection
    instructionInjection: [
      /###\s*Instruction/i,
      /\[INST\]/,
      /<instruction>/i,
      /:::\s*instruction/i,
      /\|\s*instruction\s*\|/i
    ],
    // Context manipulation
    contextManipulation: [
      /previous\s+conversation\s+was/i,
      /actually\s+you\s+said/i,
      /remember\s+when\s+you/i,
      /in\s+our\s+last\s+chat/i,
      /you\s+already\s+agreed/i
    ]
  };

  static validate(content: string, state: CommerceState): ValidationResult {
    // Check each pattern category
    for (const [category, patterns] of Object.entries(this.INJECTION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            reason: `Prompt injection detected: ${category}`,
            severity: 'high',
            category: 'prompt_injection',
            metadata: {
              detectedPattern: pattern.source,
              category,
              content: content.substring(0, 100) // Log first 100 chars
            }
          };
        }
      }
    }

    // Check for encoded attempts
    if (this.hasEncodedContent(content)) {
      return {
        isValid: false,
        reason: 'Encoded content detected - possible injection attempt',
        severity: 'high',
        category: 'prompt_injection',
        metadata: { encodingDetected: true }
      };
    }

    // Check for excessive special characters
    const specialCharRatio = this.getSpecialCharacterRatio(content);
    if (specialCharRatio > 0.3) {
      return {
        isValid: false,
        reason: 'Excessive special characters detected',
        severity: 'medium',
        category: 'prompt_injection',
        metadata: { specialCharRatio }
      };
    }

    return { isValid: true, severity: 'low', category: 'prompt_injection' };
  }

  private static hasEncodedContent(content: string): boolean {
    // Check for base64
    const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
    const words = content.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 20 && base64Pattern.test(word)) {
        return true;
      }
    }

    // Check for URL encoding
    if (/%[0-9A-Fa-f]{2}/.test(content) && content.match(/%[0-9A-Fa-f]{2}/g)!.length > 5) {
      return true;
    }

    // Check for unicode escapes
    if (/\\u[0-9A-Fa-f]{4}/.test(content) && content.match(/\\u[0-9A-Fa-f]{4}/g)!.length > 3) {
      return true;
    }

    return false;
  }

  private static getSpecialCharacterRatio(content: string): number {
    const specialChars = content.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || [];
    return specialChars.length / content.length;
  }
}

/**
 * Validator for price manipulation attempts
 */
export class PriceManipulationValidator {
  private static readonly MANIPULATION_PATTERNS = {
    // Direct price manipulation
    directManipulation: [
      /set\s+price\s+to\s+\$?0/i,
      /change\s+.*\s+price\s+.*\s+0/i,
      /make\s+it\s+free/i,
      /price\s*=\s*0/i,
      /override\s+pricing/i
    ],
    // Discount manipulation
    discountManipulation: [
      /apply\s+100%?\s+discount/i,
      /discount\s*=\s*100/i,
      /unlimited\s+discount/i,
      /max\s+discount/i,
      /bypass\s+discount\s+limit/i
    ],
    // Coupon exploitation
    couponExploits: [
      /generate\s+coupon/i,
      /create\s+.*\s+coupon\s+code/i,
      /admin\s+coupon/i,
      /test\s+coupon/i,
      /ADMIN|TEST|DEBUG|STAFF/
    ],
    // System exploitation
    systemExploits: [
      /admin\s+mode/i,
      /debug\s+mode/i,
      /developer\s+access/i,
      /backdoor/i,
      /exploit/i
    ]
  };

  static validate(content: string, state: CommerceState): ValidationResult {
    // Check manipulation patterns
    for (const [category, patterns] of Object.entries(this.MANIPULATION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            reason: `Price manipulation attempt: ${category}`,
            severity: 'critical',
            category: 'price_manipulation',
            metadata: {
              detectedPattern: pattern.source,
              category,
              cartValue: state.cart.total
            }
          };
        }
      }
    }

    // Check for suspicious price mentions
    const priceMatches = content.match(/\$?\d+\.?\d*\s*(dollar|cent|euro|pound)?s?/gi) || [];
    for (const match of priceMatches) {
      const value = parseFloat(match.replace(/[^0-9.]/g, ''));
      if (value === 0 || value < 0.01) {
        return {
          isValid: false,
          reason: 'Suspicious price value detected',
          severity: 'high',
          category: 'price_manipulation',
          metadata: { suspiciousValue: value }
        };
      }
    }

    // Check for percentage manipulation
    const percentMatches = content.match(/\d+\s*%/g) || [];
    for (const match of percentMatches) {
      const value = parseInt(match);
      if (value > 90) {
        return {
          isValid: false,
          reason: 'Suspicious discount percentage',
          severity: 'medium',
          category: 'price_manipulation',
          metadata: { percentage: value }
        };
      }
    }

    return { isValid: true, severity: 'low', category: 'price_manipulation' };
  }
}

/**
 * Validator for business rule violations
 */
export class BusinessRuleValidator {
  private static readonly RULES = {
    // Quantity limits
    quantityLimits: {
      b2c: { min: 1, max: 100 },
      b2b: { min: 1, max: 10000 }
    },
    // Order value limits
    orderLimits: {
      b2c: { min: 1, max: 50000 },
      b2b: { min: 100, max: 1000000 }
    },
    // Restricted operations by mode
    restrictedOperations: {
      b2c: [
        'purchase_order',
        'net_terms',
        'tax_exemption',
        'bulk_pricing',
        'wholesale_account'
      ],
      b2b: [
        'save_for_later',
        'wishlist',
        'gift_card'
      ]
    }
  };

  static validate(content: string, state: CommerceState): ValidationResult {
    const mode = state.mode;

    // Check quantity violations
    const quantityResult = this.validateQuantities(content, mode);
    if (!quantityResult.isValid) return quantityResult;

    // Check restricted operations
    const operationResult = this.validateOperations(content, mode);
    if (!operationResult.isValid) return operationResult;

    // Check cart value limits
    const cartResult = this.validateCartValue(state);
    if (!cartResult.isValid) return cartResult;

    // Check product availability
    const availabilityResult = this.validateProductAvailability(content, state);
    if (!availabilityResult.isValid) return availabilityResult;

    return { isValid: true, severity: 'low', category: 'business_rule' };
  }

  private static validateQuantities(content: string, mode: 'b2c' | 'b2b'): ValidationResult {
    const limits = this.RULES.quantityLimits[mode];
    const quantityMatches = content.match(/\b(\d+)\s*(units?|items?|pieces?|products?|boxes?|cases?)\b/gi) || [];

    for (const match of quantityMatches) {
      const quantity = parseInt(match.match(/\d+/)?.[0] || '0');
      
      if (quantity > limits.max) {
        return {
          isValid: false,
          reason: `Quantity ${quantity} exceeds maximum limit of ${limits.max} for ${mode}`,
          severity: 'medium',
          category: 'business_rule',
          metadata: { quantity, limit: limits.max, mode }
        };
      }

      if (quantity < limits.min) {
        return {
          isValid: false,
          reason: `Quantity ${quantity} below minimum of ${limits.min}`,
          severity: 'low',
          category: 'business_rule',
          metadata: { quantity, limit: limits.min }
        };
      }
    }

    return { isValid: true, severity: 'low', category: 'business_rule' };
  }

  private static validateOperations(content: string, mode: 'b2c' | 'b2b'): ValidationResult {
    const restricted = this.RULES.restrictedOperations[mode];
    const contentLower = content.toLowerCase();

    for (const operation of restricted) {
      const pattern = operation.replace(/_/g, '\\s+');
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      
      if (regex.test(contentLower)) {
        return {
          isValid: false,
          reason: `Operation "${operation}" not available in ${mode} mode`,
          severity: 'medium',
          category: 'business_rule',
          metadata: { operation, mode }
        };
      }
    }

    return { isValid: true, severity: 'low', category: 'business_rule' };
  }

  private static validateCartValue(state: CommerceState): ValidationResult {
    const limits = this.RULES.orderLimits[state.mode];
    const cartValue = state.cart.total || 0;

    if (cartValue > limits.max) {
      return {
        isValid: false,
        reason: `Cart value ${cartValue} exceeds maximum of ${limits.max}`,
        severity: 'medium',
        category: 'business_rule',
        metadata: { cartValue, limit: limits.max }
      };
    }

    // Only check minimum for checkout attempts
    if (state.context.detectedIntent === 'checkout' && cartValue < limits.min) {
      return {
        isValid: false,
        reason: `Minimum order value is ${limits.min}`,
        severity: 'low',
        category: 'business_rule',
        metadata: { cartValue, limit: limits.min }
      };
    }

    return { isValid: true, severity: 'low', category: 'business_rule' };
  }

  private static validateProductAvailability(content: string, state: CommerceState): ValidationResult {
    // Check for out of stock manipulation
    if (/force\s+in\s+stock|override\s+availability|ignore\s+stock/i.test(content)) {
      return {
        isValid: false,
        reason: 'Attempt to override product availability',
        severity: 'high',
        category: 'business_rule',
        metadata: { attemptType: 'availability_override' }
      };
    }

    return { isValid: true, severity: 'low', category: 'business_rule' };
  }
}

/**
 * Aggregated security validator
 */
export class SecurityValidator {
  static async validateInput(content: string, state: CommerceState): Promise<ValidationResult> {
    // Run all validators
    const validators = [
      PromptInjectionValidator.validate(content, state),
      PriceManipulationValidator.validate(content, state),
      BusinessRuleValidator.validate(content, state)
    ];

    // Find the most severe failure
    const failures = validators.filter(result => !result.isValid);
    if (failures.length > 0) {
      return failures.sort((a, b) => 
        this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
      )[0];
    }

    return { isValid: true, severity: 'low', category: 'other' };
  }

  private static getSeverityScore(severity: ValidationResult['severity']): number {
    const scores = { low: 1, medium: 5, high: 10, critical: 20 };
    return scores[severity];
  }
}