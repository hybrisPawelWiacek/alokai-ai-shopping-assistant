/**
 * Error reporting and user feedback system
 * Provides user-friendly error messages and reporting capabilities
 */

import { Loggers } from '../observability/logger';
import { metrics } from '../observability/metrics';
import {
  AIAssistantError,
  ErrorCategory,
  ErrorSeverity,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  NotFoundError,
  BusinessRuleError
} from './types';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';

/**
 * Error message template
 */
export interface ErrorMessageTemplate {
  userMessage: string;
  technicalMessage?: string;
  suggestedActions?: string[];
  retryable: boolean;
  showDetails: boolean;
}

/**
 * Error report for logging/monitoring
 */
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: AIAssistantError;
  userMessage: string;
  context: Record<string, any>;
  stackTrace?: string;
  reported: boolean;
}

/**
 * Error reporter configuration
 */
export interface ErrorReporterConfig {
  enableUserMessages?: boolean;
  enableTechnicalDetails?: boolean;
  enableSuggestedActions?: boolean;
  maxReportsPerSession?: number;
  reportingEndpoint?: string;
  customTemplates?: Map<string, ErrorMessageTemplate>;
}

/**
 * Error reporting and user feedback manager
 */
export class ErrorReporter {
  private errorReports: ErrorReport[] = [];
  private defaultTemplates: Map<ErrorCategory, ErrorMessageTemplate>;
  
  constructor(private config: ErrorReporterConfig = {}) {
    this.config = {
      enableUserMessages: true,
      enableTechnicalDetails: false,
      enableSuggestedActions: true,
      maxReportsPerSession: 100,
      ...config
    };
    
    this.defaultTemplates = this.initializeDefaultTemplates();
  }
  
  /**
   * Initialize default error message templates
   */
  private initializeDefaultTemplates(): Map<ErrorCategory, ErrorMessageTemplate> {
    return new Map([
      [ErrorCategory.VALIDATION, {
        userMessage: "I couldn't understand that request. Could you please rephrase it?",
        suggestedActions: [
          "Try using simpler language",
          "Be more specific about what you're looking for",
          "Check for typos or unclear terms"
        ],
        retryable: true,
        showDetails: false
      }],
      
      [ErrorCategory.AUTHENTICATION, {
        userMessage: "You need to be logged in to perform this action.",
        suggestedActions: [
          "Please log in to your account",
          "Create an account if you don't have one"
        ],
        retryable: false,
        showDetails: false
      }],
      
      [ErrorCategory.AUTHORIZATION, {
        userMessage: "You don't have permission to perform this action.",
        suggestedActions: [
          "Contact your administrator for access",
          "Try a different action"
        ],
        retryable: false,
        showDetails: false
      }],
      
      [ErrorCategory.NETWORK, {
        userMessage: "I'm having trouble connecting to our services. Please try again.",
        suggestedActions: [
          "Check your internet connection",
          "Try again in a moment",
          "Refresh the page if the problem persists"
        ],
        retryable: true,
        showDetails: false
      }],
      
      [ErrorCategory.TIMEOUT, {
        userMessage: "This is taking longer than expected. Let me try again.",
        suggestedActions: [
          "The system will retry automatically",
          "Try a simpler request if this continues"
        ],
        retryable: true,
        showDetails: false
      }],
      
      [ErrorCategory.RATE_LIMIT, {
        userMessage: "You're making requests too quickly. Please wait a moment.",
        suggestedActions: [
          "Wait a few seconds before trying again",
          "Reduce the frequency of your requests"
        ],
        retryable: true,
        showDetails: false
      }],
      
      [ErrorCategory.NOT_FOUND, {
        userMessage: "I couldn't find what you're looking for.",
        suggestedActions: [
          "Try different search terms",
          "Browse our categories",
          "Check if the item name is correct"
        ],
        retryable: false,
        showDetails: false
      }],
      
      [ErrorCategory.BUSINESS_RULE, {
        userMessage: "This action isn't allowed due to business rules.",
        technicalMessage: "Business rule violation",
        suggestedActions: [
          "Review the requirements",
          "Contact support for clarification"
        ],
        retryable: false,
        showDetails: true
      }],
      
      [ErrorCategory.UDL, {
        userMessage: "I'm having trouble accessing product information. Please try again.",
        suggestedActions: [
          "The system will retry automatically",
          "Try refreshing if this persists"
        ],
        retryable: true,
        showDetails: false
      }],
      
      [ErrorCategory.MODEL, {
        userMessage: "I'm having trouble understanding your request right now.",
        suggestedActions: [
          "Try rephrasing your question",
          "Be more specific",
          "Use simpler language"
        ],
        retryable: true,
        showDetails: false
      }],
      
      [ErrorCategory.SYSTEM, {
        userMessage: "Something went wrong on our end. We're working on it.",
        suggestedActions: [
          "Try again in a few moments",
          "Contact support if this persists"
        ],
        retryable: true,
        showDetails: false
      }]
    ]);
  }
  
  /**
   * Generate user-friendly message from error
   */
  generateUserMessage(error: AIAssistantError): BaseMessage {
    // Get template
    const template = this.getTemplate(error);
    
    // Build message parts
    const messageParts: string[] = [];
    
    // Add main message
    if (this.config.enableUserMessages && template.userMessage) {
      messageParts.push(template.userMessage);
    } else if (error.userMessage) {
      messageParts.push(error.userMessage);
    } else {
      messageParts.push("I encountered an issue processing your request.");
    }
    
    // Add specific error details if appropriate
    if (this.shouldShowErrorDetails(error, template)) {
      messageParts.push(this.formatErrorDetails(error));
    }
    
    // Add suggested actions
    if (this.config.enableSuggestedActions && template.suggestedActions?.length) {
      messageParts.push("\n\nHere's what you can try:");
      template.suggestedActions.forEach((action, index) => {
        messageParts.push(`${index + 1}. ${action}`);
      });
    }
    
    // Add retry information
    if (template.retryable && error.retryable) {
      messageParts.push("\n\nI'll try again automatically...");
    }
    
    return new AIMessage({
      content: messageParts.join('\n'),
      additional_kwargs: {
        error: true,
        errorCode: error.code,
        errorCategory: error.category,
        retryable: error.retryable
      }
    });
  }
  
  /**
   * Get template for error
   */
  private getTemplate(error: AIAssistantError): ErrorMessageTemplate {
    // Check custom templates first
    if (this.config.customTemplates?.has(error.code)) {
      return this.config.customTemplates.get(error.code)!;
    }
    
    // Fall back to category template
    return this.defaultTemplates.get(error.category) || {
      userMessage: "An unexpected error occurred. Please try again.",
      retryable: false,
      showDetails: false
    };
  }
  
  /**
   * Check if should show error details
   */
  private shouldShowErrorDetails(
    error: AIAssistantError,
    template: ErrorMessageTemplate
  ): boolean {
    if (!this.config.enableTechnicalDetails) return false;
    if (!template.showDetails) return false;
    if (error.severity === ErrorSeverity.LOW) return false;
    
    return true;
  }
  
  /**
   * Format error details for display
   */
  private formatErrorDetails(error: AIAssistantError): string {
    const details: string[] = ["\n\nError details:"];
    
    if (error instanceof ValidationError) {
      details.push(`Validation issue: ${error.message}`);
    } else if (error instanceof NotFoundError) {
      details.push(`Not found: ${error.resourceType} "${error.resourceId}"`);
    } else if (error instanceof RateLimitError && error.retryAfter) {
      details.push(`Rate limited. Retry after ${error.retryAfter} seconds.`);
    } else if (error instanceof BusinessRuleError && error.rule) {
      details.push(`Business rule: ${error.rule}`);
    } else {
      details.push(`Error code: ${error.code}`);
    }
    
    return details.join('\n');
  }
  
  /**
   * Report error for tracking/monitoring
   */
  async reportError(
    error: AIAssistantError,
    userMessage: string
  ): Promise<string> {
    const report: ErrorReport = {
      id: this.generateReportId(),
      timestamp: new Date(),
      error,
      userMessage,
      context: {
        ...error.context,
        severity: error.severity,
        category: error.category,
        retryable: error.retryable
      },
      stackTrace: error.stack,
      reported: false
    };
    
    // Store report
    this.errorReports.push(report);
    
    // Limit stored reports
    if (this.errorReports.length > this.config.maxReportsPerSession!) {
      this.errorReports.shift();
    }
    
    // Log error
    Loggers.ai.error('Error reported', error, {
      reportId: report.id,
      userMessage
    });
    
    // Record metrics
    metrics.recordRequestError({
      error_code: error.code,
      error_category: error.category,
      error_severity: error.severity,
      mode: error.context.mode || 'unknown'
    });
    
    // Send to reporting endpoint if configured
    if (this.config.reportingEndpoint) {
      this.sendErrorReport(report).catch(err => {
        Loggers.ai.error('Failed to send error report', err);
      });
    }
    
    return report.id;
  }
  
  /**
   * Send error report to external service
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    if (!this.config.reportingEndpoint) return;
    
    try {
      // In a real implementation, this would send to an error tracking service
      const response = await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: report.id,
          timestamp: report.timestamp.toISOString(),
          errorCode: report.error.code,
          errorCategory: report.error.category,
          errorSeverity: report.error.severity,
          message: report.error.message,
          userMessage: report.userMessage,
          context: report.context,
          stackTrace: report.stackTrace
        })
      });
      
      if (response.ok) {
        report.reported = true;
      }
    } catch (error) {
      Loggers.ai.error('Failed to send error report', error);
    }
  }
  
  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get error reports for session
   */
  getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }
  
  /**
   * Clear error reports
   */
  clearReports(): void {
    this.errorReports = [];
  }
}

/**
 * Error message builders for specific scenarios
 */
export class ErrorMessageBuilders {
  /**
   * Build cart error message
   */
  static buildCartError(error: AIAssistantError, itemName?: string): string {
    const base = "I couldn't add that to your cart.";
    
    if (error instanceof BusinessRuleError) {
      if (error.rule === 'minimum_quantity') {
        return `${base} This item has a minimum order quantity.`;
      }
      if (error.rule === 'maximum_quantity') {
        return `${base} You've reached the maximum quantity for this item.`;
      }
      if (error.rule === 'out_of_stock') {
        return `${base} ${itemName || 'This item'} is currently out of stock.`;
      }
    }
    
    if (error instanceof NotFoundError) {
      return `${base} I couldn't find ${itemName || 'that product'}.`;
    }
    
    return `${base} Please try again or choose a different item.`;
  }
  
  /**
   * Build search error message
   */
  static buildSearchError(error: AIAssistantError, query?: string): string {
    if (error instanceof ValidationError) {
      return "I need more information to search. What are you looking for?";
    }
    
    if (error instanceof TimeoutError) {
      return "The search is taking longer than expected. Let me try with a simpler query.";
    }
    
    if (query) {
      return `I couldn't find products matching "${query}". Try different keywords or browse our categories.`;
    }
    
    return "I'm having trouble searching right now. Please try again or browse our categories.";
  }
  
  /**
   * Build checkout error message
   */
  static buildCheckoutError(error: AIAssistantError): string {
    if (error instanceof AuthenticationError) {
      return "Please log in to complete your purchase.";
    }
    
    if (error instanceof BusinessRuleError) {
      if (error.rule === 'minimum_order_value') {
        return "Your order doesn't meet the minimum order value.";
      }
      if (error.rule === 'invalid_payment') {
        return "There was an issue with your payment method. Please check and try again.";
      }
    }
    
    if (error instanceof NetworkError) {
      return "We're having trouble processing your order. Please check your connection and try again.";
    }
    
    return "We couldn't complete your checkout. Please review your order and try again.";
  }
}

/**
 * Global error reporter instance
 */
export const errorReporter = new ErrorReporter();

/**
 * Helper function to report and generate user message
 */
export async function reportAndGenerateMessage(
  error: AIAssistantError
): Promise<BaseMessage> {
  const userMessage = errorReporter.generateUserMessage(error);
  await errorReporter.reportError(error, userMessage.content as string);
  return userMessage;
}