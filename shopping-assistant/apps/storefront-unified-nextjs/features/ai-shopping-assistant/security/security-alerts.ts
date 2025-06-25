import { getAuditLogger, AuditEventType, AuditSeverity } from './audit-logger';
import { EventEmitter } from 'events';

/**
 * Security alert types
 */
export enum SecurityAlertType {
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  BULK_ATTACK = 'BULK_ATTACK',
  RATE_LIMIT_ABUSE = 'RATE_LIMIT_ABUSE',
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  UNAUTHORIZED_ACCESS_PATTERN = 'UNAUTHORIZED_ACCESS_PATTERN',
  ACCOUNT_TAKEOVER_ATTEMPT = 'ACCOUNT_TAKEOVER_ATTEMPT',
  SUSPICIOUS_BULK_OPERATION = 'SUSPICIOUS_BULK_OPERATION',
  CREDIT_FRAUD_PATTERN = 'CREDIT_FRAUD_PATTERN'
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Security alert
 */
export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  severity: AlertSeverity;
  timestamp: number;
  source: {
    userId?: string;
    accountId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
  };
  details: {
    description: string;
    evidence: Record<string, any>;
    affectedResources?: string[];
    recommendedActions?: string[];
  };
  metadata: {
    pattern?: string;
    score?: number;
    correlationId?: string;
    relatedAlerts?: string[];
  };
}

/**
 * Alert handler interface
 */
export interface AlertHandler {
  name: string;
  handle(alert: SecurityAlert): Promise<void>;
}

/**
 * Alert configuration
 */
export interface SecurityAlertConfig {
  enableEmailAlerts?: boolean;
  enableWebhooks?: boolean;
  webhookUrl?: string;
  emailRecipients?: string[];
  alertThreshold?: {
    rateLimit?: number;
    authFailures?: number;
    maliciousPayloads?: number;
  };
  aggregationWindowMinutes?: number;
}

/**
 * Pattern detection for security threats
 */
interface ThreatPattern {
  eventTypes: AuditEventType[];
  threshold: number;
  windowMinutes: number;
  severity: AlertSeverity;
  alertType: SecurityAlertType;
}

/**
 * Security alert service
 */
export class SecurityAlertService extends EventEmitter {
  private readonly config: Required<SecurityAlertConfig>;
  private readonly auditLogger = getAuditLogger();
  private readonly handlers: AlertHandler[] = [];
  private readonly eventCounters = new Map<string, { count: number; timestamp: number }>();
  
  // Threat patterns to monitor
  private readonly threatPatterns: ThreatPattern[] = [
    {
      eventTypes: [AuditEventType.AUTH_FAILURE],
      threshold: 5,
      windowMinutes: 5,
      severity: AlertSeverity.HIGH,
      alertType: SecurityAlertType.CREDENTIAL_STUFFING
    },
    {
      eventTypes: [AuditEventType.RATE_LIMIT_EXCEEDED],
      threshold: 10,
      windowMinutes: 5,
      severity: AlertSeverity.MEDIUM,
      alertType: SecurityAlertType.RATE_LIMIT_ABUSE
    },
    {
      eventTypes: [AuditEventType.MALICIOUS_PAYLOAD_DETECTED],
      threshold: 3,
      windowMinutes: 10,
      severity: AlertSeverity.CRITICAL,
      alertType: SecurityAlertType.BULK_ATTACK
    },
    {
      eventTypes: [AuditEventType.CREDIT_LIMIT_EXCEEDED],
      threshold: 5,
      windowMinutes: 30,
      severity: AlertSeverity.HIGH,
      alertType: SecurityAlertType.CREDIT_FRAUD_PATTERN
    },
    {
      eventTypes: [AuditEventType.UNAUTHORIZED_ACCESS],
      threshold: 3,
      windowMinutes: 15,
      severity: AlertSeverity.HIGH,
      alertType: SecurityAlertType.UNAUTHORIZED_ACCESS_PATTERN
    }
  ];

  constructor(config: SecurityAlertConfig = {}) {
    super();
    
    this.config = {
      enableEmailAlerts: config.enableEmailAlerts ?? false,
      enableWebhooks: config.enableWebhooks ?? false,
      webhookUrl: config.webhookUrl || '',
      emailRecipients: config.emailRecipients || [],
      alertThreshold: {
        rateLimit: config.alertThreshold?.rateLimit || 10,
        authFailures: config.alertThreshold?.authFailures || 5,
        maliciousPayloads: config.alertThreshold?.maliciousPayloads || 3
      },
      aggregationWindowMinutes: config.aggregationWindowMinutes || 5
    };

    this.initializeHandlers();
    this.startMonitoring();
  }

  /**
   * Register an alert handler
   */
  registerHandler(handler: AlertHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Create and dispatch a security alert
   */
  async createAlert(
    type: SecurityAlertType,
    severity: AlertSeverity,
    source: SecurityAlert['source'],
    details: SecurityAlert['details'],
    metadata?: SecurityAlert['metadata']
  ): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      timestamp: Date.now(),
      source,
      details,
      metadata: metadata || {}
    };

    // Emit event for real-time handling
    this.emit('alert', alert);

    // Process through handlers
    await this.processAlert(alert);

    // Log the alert
    await this.auditLogger.logSecurityEvent(
      AuditEventType.UNAUTHORIZED_ACCESS,
      {
        userId: source.userId,
        ipAddress: source.ipAddress,
        action: 'security.alert',
        threatDetails: {
          alertType: type,
          severity,
          ...details
        },
        blocked: severity === AlertSeverity.CRITICAL
      }
    );

    return alert.id;
  }

  /**
   * Monitor audit events for patterns
   */
  async monitorEvent(event: {
    eventType: AuditEventType;
    userId?: string;
    ipAddress?: string;
    accountId?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    // Check each threat pattern
    for (const pattern of this.threatPatterns) {
      if (pattern.eventTypes.includes(event.eventType)) {
        const key = this.getEventKey(event, pattern);
        const counter = this.eventCounters.get(key) || { count: 0, timestamp: Date.now() };
        
        // Reset counter if window expired
        const windowExpired = Date.now() - counter.timestamp > pattern.windowMinutes * 60 * 1000;
        if (windowExpired) {
          counter.count = 0;
          counter.timestamp = Date.now();
        }
        
        counter.count++;
        this.eventCounters.set(key, counter);
        
        // Check if threshold exceeded
        if (counter.count >= pattern.threshold) {
          await this.createAlert(
            pattern.alertType,
            pattern.severity,
            {
              userId: event.userId,
              ipAddress: event.ipAddress,
              accountId: event.accountId
            },
            {
              description: `Detected ${counter.count} ${event.eventType} events in ${pattern.windowMinutes} minutes`,
              evidence: {
                eventType: event.eventType,
                count: counter.count,
                window: `${pattern.windowMinutes} minutes`,
                lastEvent: event.details
              },
              recommendedActions: this.getRecommendedActions(pattern.alertType)
            },
            {
              pattern: pattern.eventTypes.join(','),
              score: counter.count / pattern.threshold
            }
          );
          
          // Reset counter after alert
          this.eventCounters.delete(key);
        }
      }
    }
  }

  /**
   * Analyze patterns for suspicious activity
   */
  async analyzePatterns(
    userId: string,
    timeWindowMinutes: number = 60
  ): Promise<{
    suspicious: boolean;
    patterns: string[];
    riskScore: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - timeWindowMinutes * 60 * 1000);
    
    // Query recent events
    const events = await this.auditLogger.queryLogs({
      userId,
      startDate,
      endDate
    });
    
    const patterns: string[] = [];
    let riskScore = 0;
    
    // Check for authentication anomalies
    const authFailures = events.filter(e => e.eventType === AuditEventType.AUTH_FAILURE).length;
    if (authFailures > 3) {
      patterns.push('Multiple authentication failures');
      riskScore += authFailures * 10;
    }
    
    // Check for rate limit abuse
    const rateLimits = events.filter(e => e.eventType === AuditEventType.RATE_LIMIT_EXCEEDED).length;
    if (rateLimits > 5) {
      patterns.push('Rate limit abuse');
      riskScore += rateLimits * 5;
    }
    
    // Check for malicious payloads
    const malicious = events.filter(e => e.eventType === AuditEventType.MALICIOUS_PAYLOAD_DETECTED).length;
    if (malicious > 0) {
      patterns.push('Malicious payload attempts');
      riskScore += malicious * 20;
    }
    
    // Check for unusual bulk operations
    const bulkOps = events.filter(e => e.eventType.startsWith('BULK_')).length;
    if (bulkOps > 10) {
      patterns.push('Excessive bulk operations');
      riskScore += bulkOps * 3;
    }
    
    return {
      suspicious: riskScore > 50,
      patterns,
      riskScore: Math.min(riskScore, 100)
    };
  }

  /**
   * Process alert through handlers
   */
  private async processAlert(alert: SecurityAlert): Promise<void> {
    // Process through all registered handlers
    const promises = this.handlers.map(handler => 
      handler.handle(alert).catch(error => {
        console.error(`Alert handler ${handler.name} failed:`, error);
      })
    );
    
    await Promise.all(promises);
  }

  /**
   * Initialize default handlers
   */
  private initializeHandlers(): void {
    // Console handler (always active)
    this.registerHandler({
      name: 'ConsoleHandler',
      handle: async (alert) => {
        console.error('[SECURITY ALERT]', {
          type: alert.type,
          severity: alert.severity,
          source: alert.source,
          description: alert.details.description
        });
      }
    });
    
    // Webhook handler
    if (this.config.enableWebhooks && this.config.webhookUrl) {
      this.registerHandler({
        name: 'WebhookHandler',
        handle: async (alert) => {
          try {
            const response = await fetch(this.config.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Alert-Type': alert.type,
                'X-Alert-Severity': alert.severity
              },
              body: JSON.stringify(alert)
            });
            
            if (!response.ok) {
              throw new Error(`Webhook failed: ${response.status}`);
            }
          } catch (error) {
            console.error('Failed to send webhook alert:', error);
          }
        }
      });
    }
    
    // Email handler (simplified - in production would use email service)
    if (this.config.enableEmailAlerts && this.config.emailRecipients.length > 0) {
      this.registerHandler({
        name: 'EmailHandler',
        handle: async (alert) => {
          // In production, integrate with email service
          console.log('Email alert would be sent to:', this.config.emailRecipients, {
            subject: `[${alert.severity}] Security Alert: ${alert.type}`,
            body: JSON.stringify(alert.details, null, 2)
          });
        }
      });
    }
  }

  /**
   * Start monitoring for patterns
   */
  private startMonitoring(): void {
    // Clean up old counters periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, counter] of this.eventCounters) {
        if (now - counter.timestamp > 60 * 60 * 1000) { // 1 hour
          this.eventCounters.delete(key);
        }
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Get event key for pattern matching
   */
  private getEventKey(event: any, pattern: ThreatPattern): string {
    // Group by user or IP for pattern detection
    const identifier = event.userId || event.ipAddress || 'unknown';
    return `${pattern.eventTypes.join('-')}-${identifier}`;
  }

  /**
   * Get recommended actions for alert type
   */
  private getRecommendedActions(alertType: SecurityAlertType): string[] {
    const actions: Record<SecurityAlertType, string[]> = {
      [SecurityAlertType.MALWARE_DETECTED]: [
        'Block the source IP address',
        'Quarantine uploaded files',
        'Review recent uploads from this user',
        'Enable enhanced file scanning'
      ],
      [SecurityAlertType.BULK_ATTACK]: [
        'Temporarily disable bulk operations',
        'Increase rate limiting',
        'Review account permissions',
        'Enable CAPTCHA for bulk uploads'
      ],
      [SecurityAlertType.RATE_LIMIT_ABUSE]: [
        'Increase rate limit restrictions',
        'Consider IP blocking',
        'Review API usage patterns',
        'Contact user for verification'
      ],
      [SecurityAlertType.CREDENTIAL_STUFFING]: [
        'Force password reset',
        'Enable MFA requirement',
        'Block source IP range',
        'Review account access logs'
      ],
      [SecurityAlertType.SQL_INJECTION_ATTEMPT]: [
        'Review input validation',
        'Check for vulnerabilities',
        'Block malicious patterns',
        'Audit database queries'
      ],
      [SecurityAlertType.XSS_ATTEMPT]: [
        'Enhance output encoding',
        'Review CSP headers',
        'Block malicious scripts',
        'Audit user inputs'
      ],
      [SecurityAlertType.UNAUTHORIZED_ACCESS_PATTERN]: [
        'Review permissions',
        'Audit access logs',
        'Enable stricter authentication',
        'Monitor user activity'
      ],
      [SecurityAlertType.ACCOUNT_TAKEOVER_ATTEMPT]: [
        'Lock affected accounts',
        'Force re-authentication',
        'Review session management',
        'Contact account owners'
      ],
      [SecurityAlertType.SUSPICIOUS_BULK_OPERATION]: [
        'Review bulk operation limits',
        'Verify business justification',
        'Check for automated scripts',
        'Enable manual approval'
      ],
      [SecurityAlertType.CREDIT_FRAUD_PATTERN]: [
        'Review credit limits',
        'Enable manual approval for large orders',
        'Verify payment methods',
        'Contact finance team'
      ]
    };
    
    return actions[alertType] || ['Investigate the incident', 'Review security policies'];
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}

// Singleton instance
let alertService: SecurityAlertService | null = null;

/**
 * Get or create security alert service instance
 */
export function getSecurityAlertService(config?: SecurityAlertConfig): SecurityAlertService {
  if (!alertService) {
    alertService = new SecurityAlertService(config);
  }
  return alertService;
}