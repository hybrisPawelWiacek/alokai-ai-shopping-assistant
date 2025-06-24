import type { BaseMessage } from '@langchain/core/messages';
import type { CommerceState } from '../state';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'prompt_injection' | 'price_manipulation' | 'data_exfiltration' | 'business_rule' | 'rate_limit' | 'other';
  sanitizedInput?: string;
  metadata?: Record<string, any>;
}

export interface SecurityContext {
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
  validationHistory: ValidationResult[];
  blockedAttempts: number;
  lastValidation?: Date;
  trustScore: number; // 0-100
}

export abstract class SecurityJudge {
  protected context: SecurityContext;

  constructor(initialContext?: Partial<SecurityContext>) {
    this.context = {
      threatLevel: 'none',
      detectedPatterns: [],
      validationHistory: [],
      blockedAttempts: 0,
      trustScore: 100,
      ...initialContext
    };
  }

  /**
   * Main validation method that coordinates all security checks
   */
  async validate(
    input: string | BaseMessage,
    state: CommerceState,
    validationType: 'input' | 'output' = 'input'
  ): Promise<ValidationResult> {
    const content = typeof input === 'string' ? input : input.content as string;
    
    // Run all validators in parallel for performance
    const validationPromises = [
      this.validatePromptInjection(content, state),
      this.validateBusinessRules(content, state),
      this.validateDataExfiltration(content, state),
      this.validateRateLimit(state),
      this.runCustomValidations(content, state, validationType)
    ];

    const results = await Promise.all(validationPromises);
    
    // Find the most severe validation failure
    const failedValidation = results
      .filter(r => !r.isValid)
      .sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity))[0];

    if (failedValidation) {
      this.updateSecurityContext(failedValidation, state);
      return failedValidation;
    }

    // All validations passed
    const successResult: ValidationResult = {
      isValid: true,
      severity: 'low',
      category: 'other',
      sanitizedInput: this.sanitizeInput(content)
    };

    this.updateSecurityContext(successResult, state);
    return successResult;
  }

  /**
   * Abstract methods that must be implemented by specific judges
   */
  protected abstract validatePromptInjection(content: string, state: CommerceState): Promise<ValidationResult>;
  protected abstract validateBusinessRules(content: string, state: CommerceState): Promise<ValidationResult>;
  protected abstract validateDataExfiltration(content: string, state: CommerceState): Promise<ValidationResult>;
  protected abstract runCustomValidations(
    content: string, 
    state: CommerceState, 
    validationType: 'input' | 'output'
  ): Promise<ValidationResult>;

  /**
   * Rate limiting check
   */
  protected async validateRateLimit(state: CommerceState): Promise<ValidationResult> {
    const recentMessages = state.messages.filter(msg => {
      const msgTime = new Date(msg.additional_kwargs?.timestamp || 0).getTime();
      return Date.now() - msgTime < 60000; // Last minute
    });

    const messageCount = recentMessages.length;
    const threshold = state.mode === 'b2b' ? 30 : 20; // B2B gets higher limit

    if (messageCount > threshold) {
      return {
        isValid: false,
        reason: `Rate limit exceeded: ${messageCount} messages in the last minute`,
        severity: 'medium',
        category: 'rate_limit',
        metadata: { messageCount, threshold }
      };
    }

    return {
      isValid: true,
      severity: 'low',
      category: 'rate_limit'
    };
  }

  /**
   * Sanitize input to remove potentially harmful content
   */
  protected sanitizeInput(content: string): string {
    // Remove potential script tags
    let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove SQL-like patterns
    sanitized = sanitized.replace(/(\b(DROP|DELETE|UPDATE|INSERT|EXEC|UNION)\s+(TABLE|FROM|INTO|SELECT)\b)/gi, '');
    
    // Remove excessive special characters that might be used for injection
    sanitized = sanitized.replace(/[^\w\s\-.,!?@#$%&*()\[\]{}"':;\/\\+=<>]/g, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }

  /**
   * Update security context based on validation results
   */
  protected updateSecurityContext(result: ValidationResult, state: CommerceState): void {
    // Add to validation history
    this.context.validationHistory.push(result);
    
    // Keep only last 100 validations
    if (this.context.validationHistory.length > 100) {
      this.context.validationHistory = this.context.validationHistory.slice(-100);
    }

    // Update blocked attempts
    if (!result.isValid) {
      this.context.blockedAttempts++;
      this.context.detectedPatterns.push(result.category);
    }

    // Update threat level
    this.context.threatLevel = this.calculateThreatLevel();
    
    // Update trust score
    this.context.trustScore = this.calculateTrustScore();
    
    // Set last validation time
    this.context.lastValidation = new Date();
  }

  /**
   * Calculate overall threat level based on recent activity
   */
  protected calculateThreatLevel(): SecurityContext['threatLevel'] {
    const recentFailures = this.context.validationHistory
      .slice(-10)
      .filter(v => !v.isValid);

    if (recentFailures.length === 0) return 'none';
    if (recentFailures.length <= 2) return 'low';
    if (recentFailures.length <= 5) return 'medium';
    if (recentFailures.length <= 8) return 'high';
    return 'critical';
  }

  /**
   * Calculate trust score based on validation history
   */
  protected calculateTrustScore(): number {
    const recentValidations = this.context.validationHistory.slice(-20);
    if (recentValidations.length === 0) return 100;

    const successCount = recentValidations.filter(v => v.isValid).length;
    const successRate = successCount / recentValidations.length;
    
    // Factor in severity of failures
    const severityPenalty = recentValidations
      .filter(v => !v.isValid)
      .reduce((penalty, v) => penalty + this.getSeverityScore(v.severity), 0);

    const score = Math.max(0, Math.min(100, successRate * 100 - severityPenalty));
    return Math.round(score);
  }

  /**
   * Get numeric score for severity
   */
  protected getSeverityScore(severity: ValidationResult['severity']): number {
    const scores = { low: 1, medium: 5, high: 10, critical: 20 };
    return scores[severity];
  }

  /**
   * Get current security context
   */
  getContext(): SecurityContext {
    return { ...this.context };
  }

  /**
   * Check if the system should block further processing
   */
  shouldBlock(): boolean {
    return this.context.threatLevel === 'critical' || this.context.trustScore < 20;
  }

  /**
   * Reset security context (use with caution)
   */
  reset(): void {
    this.context = {
      threatLevel: 'none',
      detectedPatterns: [],
      validationHistory: [],
      blockedAttempts: 0,
      trustScore: 100
    };
  }
}

/**
 * Commerce-specific implementation of SecurityJudge
 */
export class CommerceSecurityJudge extends SecurityJudge {
  private readonly suspiciousPatterns = {
    promptInjection: [
      /ignore\s+(previous|all)\s+(instructions?|prompts?)/i,
      /you\s+are\s+now\s+[a-zA-Z\s]+/i,
      /forget\s+everything/i,
      /system\s*:\s*[^"]/i,
      /\[INST\]|\[\/INST\]/,
      /###\s*(system|instruction)/i,
      /role\s*:\s*system/i,
      /<\|im_start\|>|<\|im_end\|>/,
      /act\s+as\s+if\s+you/i,
      /pretend\s+to\s+be/i
    ],
    priceManipulation: [
      /price.*0\s*(dollar|cent|euro|pound)?s?/i,
      /discount.*100\s*%/i,
      /free\s+shipping\s+on\s+everything/i,
      /override\s+price/i,
      /set\s+price\s+to/i,
      /change\s+.*\s+to\s+\$?0/i,
      /hack.*price/i,
      /exploit.*discount/i
    ],
    dataExfiltration: [
      /show\s+me\s+all\s+customers?/i,
      /list\s+all\s+orders?/i,
      /export\s+database/i,
      /dump\s+(table|data|users?)/i,
      /internal\s+api/i,
      /admin\s+panel/i,
      /configuration\s+file/i,
      /environment\s+variable/i,
      /api\s+key/i,
      /password|credential/i
    ],
    sqlInjection: [
      /(\b(SELECT|UPDATE|DELETE|INSERT|DROP|CREATE|ALTER|EXEC)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
      /('|")\s*(OR|AND)\s*('|")\s*=/i,
      /UNION\s+SELECT/i,
      /;\s*DROP\s+TABLE/i,
      /--\s*$/,
      /\/\*.*\*\//
    ]
  };

  protected async validatePromptInjection(content: string, state: CommerceState): Promise<ValidationResult> {
    for (const pattern of this.suspiciousPatterns.promptInjection) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason: 'Potential prompt injection detected',
          severity: 'high',
          category: 'prompt_injection',
          metadata: { pattern: pattern.toString() }
        };
      }
    }

    // Check for SQL injection patterns too
    for (const pattern of this.suspiciousPatterns.sqlInjection) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason: 'SQL injection pattern detected',
          severity: 'critical',
          category: 'prompt_injection',
          metadata: { pattern: pattern.toString() }
        };
      }
    }

    return { isValid: true, severity: 'low', category: 'prompt_injection' };
  }

  protected async validateBusinessRules(content: string, state: CommerceState): Promise<ValidationResult> {
    // Check for price manipulation attempts
    for (const pattern of this.suspiciousPatterns.priceManipulation) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason: 'Price manipulation attempt detected',
          severity: 'critical',
          category: 'price_manipulation',
          metadata: { pattern: pattern.toString() }
        };
      }
    }

    // Check quantity limits
    const quantities = content.match(/\b(\d+)\s*(units?|items?|pieces?|products?)\b/gi);
    if (quantities) {
      for (const match of quantities) {
        const quantity = parseInt(match.match(/\d+/)?.[0] || '0');
        const maxQuantity = state.mode === 'b2b' ? 10000 : 100;
        
        if (quantity > maxQuantity) {
          return {
            isValid: false,
            reason: `Quantity ${quantity} exceeds maximum allowed (${maxQuantity})`,
            severity: 'medium',
            category: 'business_rule',
            metadata: { quantity, maxQuantity }
          };
        }
      }
    }

    // Validate B2B-only operations
    const b2bOnlyPatterns = [
      /purchase\s+order/i,
      /net\s+\d+\s+terms/i,
      /tax\s+exempt/i,
      /wholesale\s+account/i
    ];

    if (state.mode === 'b2c') {
      for (const pattern of b2bOnlyPatterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            reason: 'B2B operation requested in B2C mode',
            severity: 'medium',
            category: 'business_rule',
            metadata: { requestedOperation: pattern.toString() }
          };
        }
      }
    }

    return { isValid: true, severity: 'low', category: 'business_rule' };
  }

  protected async validateDataExfiltration(content: string, state: CommerceState): Promise<ValidationResult> {
    for (const pattern of this.suspiciousPatterns.dataExfiltration) {
      if (pattern.test(content)) {
        return {
          isValid: false,
          reason: 'Potential data exfiltration attempt',
          severity: 'critical',
          category: 'data_exfiltration',
          metadata: { pattern: pattern.toString() }
        };
      }
    }

    return { isValid: true, severity: 'low', category: 'data_exfiltration' };
  }

  protected async runCustomValidations(
    content: string, 
    state: CommerceState, 
    validationType: 'input' | 'output'
  ): Promise<ValidationResult> {
    if (validationType === 'output') {
      // Check for sensitive data in outputs
      const sensitivePatterns = [
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /api[_-]?key\s*[:=]\s*[\w-]+/i, // API keys
        /password\s*[:=]\s*\S+/i // Passwords
      ];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            reason: 'Sensitive data detected in output',
            severity: 'critical',
            category: 'data_exfiltration',
            metadata: { validationType: 'output' }
          };
        }
      }
    }

    // Check message length
    if (content.length > 5000) {
      return {
        isValid: false,
        reason: 'Message exceeds maximum length',
        severity: 'low',
        category: 'other',
        metadata: { length: content.length, maxLength: 5000 }
      };
    }

    return { isValid: true, severity: 'low', category: 'other' };
  }

  /**
   * Perform output filtering to ensure safe responses
   */
  async filterOutput(content: string, state: CommerceState): Promise<string> {
    let filtered = content;

    // Remove any potential system prompts that leaked
    filtered = filtered.replace(/\[SYSTEM\].*?\[\/SYSTEM\]/gs, '');
    filtered = filtered.replace(/###\s*System:.*?###/gs, '');

    // Remove any markdown that might contain hidden instructions
    filtered = filtered.replace(/<!--.*?-->/gs, '');

    // Ensure prices are reasonable
    filtered = filtered.replace(/\$0\.0+\b/g, '[PRICE REMOVED]');
    filtered = filtered.replace(/free\s+forever/gi, '[OFFER REMOVED]');

    // Remove any leaked internal information
    const internalPatterns = [
      /internal\s+use\s+only/i,
      /confidential/i,
      /do\s+not\s+share/i,
      /api[_-]?endpoint/i
    ];

    for (const pattern of internalPatterns) {
      filtered = filtered.replace(pattern, '[REDACTED]');
    }

    return filtered;
  }
}