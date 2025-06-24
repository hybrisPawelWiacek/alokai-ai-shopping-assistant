/**
 * Comprehensive tests for error handling framework
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  AIAssistantError,
  ValidationError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  UDLError,
  ModelError,
  BusinessRuleError,
  WorkflowError,
  NotFoundError,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  ok,
  err,
  isError
} from '../types';
import {
  ErrorHandler,
  withErrorHandling,
  validateInput,
  createUDLError,
  createModelError
} from '../handlers';
import {
  RecoveryManager,
  StateRecovery,
  CompensationStrategies
} from '../recovery';
import {
  ErrorReporter,
  ErrorMessageBuilders,
  reportAndGenerateMessage
} from '../reporting';
import {
  GraphErrorBoundary,
  createSafeNode,
  executeSafeGraph,
  errorRecoveryNode
} from '../boundaries';
import type { CommerceState } from '../../state';

// Mock dependencies
jest.mock('../../observability/logger');
jest.mock('../../observability/metrics');
jest.mock('../../observability/telemetry');

describe('Error Types', () => {
  describe('AIAssistantError', () => {
    it('should create error with all properties', () => {
      const error = new AIAssistantError({
        code: 'TEST_ERROR',
        message: 'Test error message',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        recoveryStrategy: RecoveryStrategy.RETRY,
        retryable: true,
        userMessage: 'User friendly message',
        technicalDetails: { foo: 'bar' },
        context: {
          sessionId: 'session-123',
          timestamp: new Date()
        }
      });
      
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toBe('User friendly message');
      expect(error.technicalDetails).toEqual({ foo: 'bar' });
    });
    
    it('should convert to details object', () => {
      const error = new ValidationError('Invalid input');
      const details = error.toDetails();
      
      expect(details.code).toBe('VALIDATION_ERROR');
      expect(details.category).toBe(ErrorCategory.VALIDATION);
      expect(details.retryable).toBe(false);
    });
    
    it('should check error type', () => {
      const error = new NetworkError('Connection failed');
      
      expect(AIAssistantError.isType(error, NetworkError)).toBe(true);
      expect(AIAssistantError.isType(error, ValidationError)).toBe(false);
    });
  });
  
  describe('Specific Error Types', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid email format');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.recoveryStrategy).toBe(RecoveryStrategy.USER_INTERVENTION);
      expect(error.retryable).toBe(false);
    });
    
    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);
      
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.retryAfter).toBe(60);
      expect(error.retryable).toBe(true);
    });
    
    it('should create UDL error with method', () => {
      const error = new UDLError('Search failed', 'searchProducts');
      
      expect(error.code).toBe('UDL_ERROR');
      expect(error.udlMethod).toBe('searchProducts');
      expect(error.technicalDetails?.udlMethod).toBe('searchProducts');
    });
    
    it('should create not found error with resource info', () => {
      const error = new NotFoundError('Product not found', 'product', 'prod-123');
      
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.resourceType).toBe('product');
      expect(error.resourceId).toBe('prod-123');
    });
  });
  
  describe('Result Type', () => {
    it('should create success result', () => {
      const result = ok({ data: 'test' });
      
      expect(result.success).toBe(true);
      expect((result as any).data).toEqual({ data: 'test' });
    });
    
    it('should create error result', () => {
      const error = new ValidationError('Failed');
      const result = err(error);
      
      expect(result.success).toBe(false);
      expect((result as any).error).toBe(error);
    });
    
    it('should check if result is error', () => {
      const successResult = ok('data');
      const errorResult = err(new ValidationError('Failed'));
      
      expect(isError(successResult)).toBe(false);
      expect(isError(errorResult)).toBe(true);
    });
  });
});

describe('Error Handlers', () => {
  let errorHandler: ErrorHandler;
  
  beforeEach(() => {
    errorHandler = new ErrorHandler({
      enableLogging: false,
      enableMetrics: false
    });
  });
  
  describe('Error Normalization', () => {
    it('should normalize AIAssistantError', async () => {
      const error = new ValidationError('Test');
      const operation = jest.fn().mockRejectedValue(error);
      
      const result = await errorHandler.handle(error, operation);
      
      expect(result.success).toBe(false);
      expect((result as any).error).toBe(error);
    });
    
    it('should normalize TypeError to ValidationError', async () => {
      const error = new TypeError('Cannot read property of undefined');
      const operation = jest.fn().mockRejectedValue(error);
      
      const result = await errorHandler.handle(error, operation);
      
      expect(result.success).toBe(false);
      expect((result as any).error).toBeInstanceOf(ValidationError);
    });
    
    it('should detect network errors', async () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const operation = jest.fn().mockRejectedValue(error);
      
      const result = await errorHandler.handle(error, operation);
      
      expect(result.success).toBe(false);
      expect((result as any).error).toBeInstanceOf(NetworkError);
    });
  });
  
  describe('Recovery Strategies', () => {
    it('should retry on retryable error', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new NetworkError('Failed'))
        .mockResolvedValue('success');
      
      const handler = new ErrorHandler({
        maxRetries: 2,
        retryDelayMs: 10,
        enableLogging: false,
        enableMetrics: false
      });
      
      const result = await withErrorHandling(operation, {}, {
        maxRetries: 2,
        retryDelayMs: 10,
        enableLogging: false,
        enableMetrics: false
      });
      
      expect(result.success).toBe(true);
      expect((result as any).data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
    
    it('should apply exponential backoff', async () => {
      const startTime = Date.now();
      const operation = jest.fn()
        .mockRejectedValueOnce(new TimeoutError('Timeout 1'))
        .mockRejectedValueOnce(new TimeoutError('Timeout 2'))
        .mockResolvedValue('success');
      
      const handler = new ErrorHandler({
        maxRetries: 3,
        retryDelayMs: 10,
        backoffMultiplier: 2,
        enableLogging: false,
        enableMetrics: false
      });
      
      const result = await withErrorHandling(operation, {}, {
        maxRetries: 3,
        retryDelayMs: 10,
        backoffMultiplier: 2,
        enableLogging: false,
        enableMetrics: false
      });
      
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(operation).toHaveBeenCalledTimes(3);
      // Should have delays of ~10ms and ~20ms
      expect(duration).toBeGreaterThan(30);
    });
  });
  
  describe('Input Validation', () => {
    it('should validate input successfully', () => {
      const validator = (input: unknown) => {
        if (typeof input !== 'string') throw new Error('Must be string');
        return input;
      };
      
      const result = validateInput('test', validator);
      
      expect(result.success).toBe(true);
      expect((result as any).data).toBe('test');
    });
    
    it('should return validation error', () => {
      const validator = (input: unknown) => {
        if (typeof input !== 'string') throw new Error('Must be string');
        return input;
      };
      
      const result = validateInput(123, validator);
      
      expect(result.success).toBe(false);
      expect((result as any).error).toBeInstanceOf(ValidationError);
      expect((result as any).error.message).toBe('Must be string');
    });
  });
});

describe('Recovery Manager', () => {
  let recoveryManager: RecoveryManager;
  
  beforeEach(() => {
    recoveryManager = new RecoveryManager();
  });
  
  describe('Recovery Policies', () => {
    it('should apply retry policy', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      const error = new NetworkError('Network failed');
      const result = await recoveryManager.executeWithRecovery(
        operation,
        error,
        {
          strategy: RecoveryStrategy.RETRY,
          maxAttempts: 2,
          delayMs: 10
        }
      );
      
      expect(result.success).toBe(true);
      expect((result as any).data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
    
    it('should apply fallback value', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const error = new ModelError('Model failed');
      
      const result = await recoveryManager.executeWithRecovery(
        operation,
        error,
        {
          strategy: RecoveryStrategy.FALLBACK,
          maxAttempts: 1,
          fallbackValue: 'fallback'
        }
      );
      
      expect(result.success).toBe(true);
      expect((result as any).data).toBe('fallback');
    });
    
    it('should ignore error when specified', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Ignore me'));
      const error = new AIAssistantError({
        code: 'IGNORABLE',
        message: 'Can be ignored',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.LOW,
        recoveryStrategy: RecoveryStrategy.IGNORE,
        retryable: false,
        context: { timestamp: new Date() }
      });
      
      const result = await recoveryManager.executeWithRecovery(
        operation,
        error,
        {
          strategy: RecoveryStrategy.IGNORE,
          maxAttempts: 1
        }
      );
      
      expect(result.success).toBe(true);
      expect((result as any).data).toBeUndefined();
    });
  });
  
  describe('State Recovery', () => {
    it('should create state snapshot', () => {
      const state: CommerceState = {
        messages: [],
        context: { sessionId: 'test-123' },
        cart: { id: 'cart-123' } as any,
        customer: { id: 'cust-123' } as any,
        intent: 'search',
        entities: [],
        mode: 'b2c'
      };
      
      const snapshot = StateRecovery.createSnapshot(state);
      const parsed = JSON.parse(snapshot);
      
      expect(parsed.state.cart).toBe('cart-123');
      expect(parsed.state.customer).toBe('cust-123');
      expect(parsed.state.mode).toBe('b2c');
    });
  });
});

describe('Error Reporter', () => {
  let errorReporter: ErrorReporter;
  
  beforeEach(() => {
    errorReporter = new ErrorReporter({
      enableUserMessages: true,
      enableSuggestedActions: true
    });
  });
  
  describe('User Message Generation', () => {
    it('should generate user-friendly message for validation error', () => {
      const error = new ValidationError('Invalid format');
      const message = errorReporter.generateUserMessage(error);
      
      expect(message.content).toContain("I couldn't understand that request");
      expect(message.content).toContain("Try using simpler language");
    });
    
    it('should generate message for network error', () => {
      const error = new NetworkError('Connection failed');
      const message = errorReporter.generateUserMessage(error);
      
      expect(message.content).toContain("I'm having trouble connecting");
      expect(message.content).toContain("Check your internet connection");
    });
    
    it('should include retry information for retryable errors', () => {
      const error = new TimeoutError('Request timeout');
      const message = errorReporter.generateUserMessage(error);
      
      expect(message.content).toContain("I'll try again automatically");
    });
  });
  
  describe('Error Reporting', () => {
    it('should create error report', async () => {
      const error = new ValidationError('Test error');
      const reportId = await errorReporter.reportError(error, 'User message');
      
      expect(reportId).toMatch(/^err_\d+_[a-z0-9]+$/);
      
      const reports = errorReporter.getErrorReports();
      expect(reports).toHaveLength(1);
      expect(reports[0].error).toBe(error);
    });
    
    it('should limit stored reports', async () => {
      const reporter = new ErrorReporter({ maxReportsPerSession: 2 });
      
      await reporter.reportError(new ValidationError('Error 1'), 'Message 1');
      await reporter.reportError(new ValidationError('Error 2'), 'Message 2');
      await reporter.reportError(new ValidationError('Error 3'), 'Message 3');
      
      const reports = reporter.getErrorReports();
      expect(reports).toHaveLength(2);
      expect(reports[0].error.message).toBe('Error 2');
      expect(reports[1].error.message).toBe('Error 3');
    });
  });
  
  describe('Error Message Builders', () => {
    it('should build cart error message', () => {
      const error = new BusinessRuleError('Out of stock', 'out_of_stock');
      const message = ErrorMessageBuilders.buildCartError(error, 'Red Shoes');
      
      expect(message).toContain("I couldn't add that to your cart");
      expect(message).toContain("Red Shoes is currently out of stock");
    });
    
    it('should build search error message', () => {
      const error = new ValidationError('Empty query');
      const message = ErrorMessageBuilders.buildSearchError(error);
      
      expect(message).toBe("I need more information to search. What are you looking for?");
    });
    
    it('should build checkout error message', () => {
      const error = new BusinessRuleError('Below minimum', 'minimum_order_value');
      const message = ErrorMessageBuilders.buildCheckoutError(error);
      
      expect(message).toBe("Your order doesn't meet the minimum order value.");
    });
  });
});

describe('Error Boundaries', () => {
  let boundary: GraphErrorBoundary;
  
  beforeEach(() => {
    boundary = new GraphErrorBoundary({
      maxNodeFailures: 2,
      maxGraphFailures: 2,
      enableStateRecovery: true
    });
  });
  
  describe('Node Error Boundary', () => {
    it('should handle successful node execution', async () => {
      const node = jest.fn().mockResolvedValue({ intent: 'search' });
      const wrappedNode = boundary.wrapNode('testNode', node);
      
      const state: CommerceState = {
        messages: [],
        context: { sessionId: 'test' },
        mode: 'b2c'
      } as any;
      
      const result = await wrappedNode(state);
      
      expect(result).toEqual({ intent: 'search' });
      expect(node).toHaveBeenCalledWith(state);
    });
    
    it('should handle node failure', async () => {
      const node = jest.fn().mockRejectedValue(new Error('Node failed'));
      const wrappedNode = boundary.wrapNode('testNode', node);
      
      const state: CommerceState = {
        messages: [],
        context: { sessionId: 'test' },
        mode: 'b2c'
      } as any;
      
      const result = await wrappedNode(state);
      
      expect(result.messages).toBeDefined();
      expect(result.messages![0].content).toContain('error');
    });
    
    it('should fail after max retries', async () => {
      const node = jest.fn().mockRejectedValue(new Error('Always fails'));
      const wrappedNode = boundary.wrapNode('criticalNode', node);
      
      const state: CommerceState = {
        messages: [],
        context: { sessionId: 'test' },
        mode: 'b2c'
      } as any;
      
      // First failure
      await wrappedNode(state);
      
      // Second failure
      await wrappedNode(state);
      
      // Third failure should throw
      await expect(wrappedNode(state)).rejects.toThrow(WorkflowError);
    });
  });
  
  describe('Safe Node Creation', () => {
    it('should create safe node', async () => {
      const unsafeNode = jest.fn().mockResolvedValue({ result: 'success' });
      const safeNode = createSafeNode('safeNode', unsafeNode);
      
      const state: CommerceState = {
        messages: [],
        context: {},
        mode: 'b2c'
      } as any;
      
      const result = await safeNode(state);
      
      expect(result).toEqual({ result: 'success' });
    });
  });
  
  describe('Error Recovery Node', () => {
    it('should recover from error', async () => {
      const state: CommerceState & { error?: AIAssistantError } = {
        messages: [],
        context: {},
        mode: 'b2c',
        error: new ValidationError('Test error')
      } as any;
      
      const result = await errorRecoveryNode(state);
      
      expect(result.error).toBeUndefined();
      expect(result.messages).toBeDefined();
      expect(result.context?.lastError).toBeDefined();
      expect(result.context?.lastError?.recovered).toBe(true);
    });
  });
});