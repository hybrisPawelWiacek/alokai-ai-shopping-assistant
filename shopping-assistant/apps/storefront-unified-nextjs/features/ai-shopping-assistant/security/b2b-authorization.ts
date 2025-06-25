import { getAuditLogger, AuditEventType } from './audit-logger';
import type { SfProduct } from '@vue-storefront/unified-data-model';

/**
 * B2B permissions for bulk operations
 */
export enum B2BPermission {
  // Bulk order permissions
  BULK_ORDER_CREATE = 'bulk_order.create',
  BULK_ORDER_VIEW = 'bulk_order.view',
  BULK_ORDER_APPROVE = 'bulk_order.approve',
  BULK_ORDER_UNLIMITED = 'bulk_order.unlimited',
  
  // Pricing permissions
  VIEW_CONTRACT_PRICING = 'pricing.contract',
  VIEW_BULK_DISCOUNTS = 'pricing.bulk_discounts',
  REQUEST_CUSTOM_PRICING = 'pricing.custom_request',
  
  // Quote permissions
  CREATE_QUOTE = 'quote.create',
  APPROVE_QUOTE = 'quote.approve',
  
  // Account management
  MANAGE_USERS = 'account.manage_users',
  VIEW_CREDIT_LIMIT = 'account.view_credit',
  VIEW_ORDER_HISTORY = 'account.order_history',
  
  // Advanced features
  API_ACCESS = 'advanced.api_access',
  EXPORT_DATA = 'advanced.export_data',
  CONFIGURE_WORKFLOWS = 'advanced.workflows'
}

/**
 * B2B role definitions
 */
export interface B2BRole {
  name: string;
  permissions: B2BPermission[];
  orderLimits?: {
    dailyValue?: number;
    monthlyValue?: number;
    singleOrderValue?: number;
    singleOrderItems?: number;
  };
}

/**
 * Predefined B2B roles
 */
export const B2B_ROLES: Record<string, B2BRole> = {
  BUYER: {
    name: 'Buyer',
    permissions: [
      B2BPermission.BULK_ORDER_CREATE,
      B2BPermission.BULK_ORDER_VIEW,
      B2BPermission.VIEW_CONTRACT_PRICING,
      B2BPermission.CREATE_QUOTE
    ],
    orderLimits: {
      dailyValue: 10000,
      monthlyValue: 100000,
      singleOrderValue: 5000,
      singleOrderItems: 100
    }
  },
  PURCHASING_MANAGER: {
    name: 'Purchasing Manager',
    permissions: [
      B2BPermission.BULK_ORDER_CREATE,
      B2BPermission.BULK_ORDER_VIEW,
      B2BPermission.BULK_ORDER_APPROVE,
      B2BPermission.VIEW_CONTRACT_PRICING,
      B2BPermission.VIEW_BULK_DISCOUNTS,
      B2BPermission.CREATE_QUOTE,
      B2BPermission.VIEW_CREDIT_LIMIT,
      B2BPermission.VIEW_ORDER_HISTORY
    ],
    orderLimits: {
      dailyValue: 50000,
      monthlyValue: 500000,
      singleOrderValue: 25000,
      singleOrderItems: 500
    }
  },
  ACCOUNT_ADMIN: {
    name: 'Account Administrator',
    permissions: [
      B2BPermission.BULK_ORDER_CREATE,
      B2BPermission.BULK_ORDER_VIEW,
      B2BPermission.BULK_ORDER_APPROVE,
      B2BPermission.BULK_ORDER_UNLIMITED,
      B2BPermission.VIEW_CONTRACT_PRICING,
      B2BPermission.VIEW_BULK_DISCOUNTS,
      B2BPermission.REQUEST_CUSTOM_PRICING,
      B2BPermission.CREATE_QUOTE,
      B2BPermission.APPROVE_QUOTE,
      B2BPermission.MANAGE_USERS,
      B2BPermission.VIEW_CREDIT_LIMIT,
      B2BPermission.VIEW_ORDER_HISTORY,
      B2BPermission.EXPORT_DATA
    ],
    orderLimits: {
      dailyValue: 100000,
      monthlyValue: 1000000,
      singleOrderValue: 50000,
      singleOrderItems: 1000
    }
  },
  API_USER: {
    name: 'API User',
    permissions: [
      B2BPermission.BULK_ORDER_CREATE,
      B2BPermission.BULK_ORDER_VIEW,
      B2BPermission.VIEW_CONTRACT_PRICING,
      B2BPermission.API_ACCESS,
      B2BPermission.EXPORT_DATA
    ],
    orderLimits: {
      dailyValue: 200000,
      monthlyValue: 2000000,
      singleOrderValue: 100000,
      singleOrderItems: 2000
    }
  }
};

/**
 * B2B user context
 */
export interface B2BUserContext {
  userId: string;
  accountId: string;
  role: string;
  permissions: B2BPermission[];
  customLimits?: {
    dailyValue?: number;
    monthlyValue?: number;
    singleOrderValue?: number;
    singleOrderItems?: number;
  };
  contractIds?: string[];
  approvalRequired?: boolean;
  taxExempt?: boolean;
  paymentTerms?: string;
}

/**
 * Authorization result
 */
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermission?: B2BPermission;
  currentLimit?: number;
  requestedAmount?: number;
}

/**
 * Order statistics for limit checking
 */
interface OrderStats {
  dailyTotal: number;
  monthlyTotal: number;
  lastOrderDate: Date;
}

/**
 * B2B Authorization service
 */
export class B2BAuthorization {
  private readonly auditLogger = getAuditLogger();
  private readonly orderStatsCache = new Map<string, OrderStats>();

  /**
   * Check if user has permission
   */
  hasPermission(context: B2BUserContext, permission: B2BPermission): boolean {
    return context.permissions.includes(permission) ||
           context.permissions.includes(B2BPermission.BULK_ORDER_UNLIMITED);
  }

  /**
   * Authorize bulk operation
   */
  async authorizeBulkOperation(
    context: B2BUserContext,
    operation: {
      type: 'create' | 'update' | 'approve';
      orderValue: number;
      itemCount: number;
      items?: Array<{ sku: string; quantity: number; price: number }>;
    }
  ): Promise<AuthorizationResult> {
    // Check basic permissions
    const requiredPermission = this.getRequiredPermission(operation.type);
    if (!this.hasPermission(context, requiredPermission)) {
      await this.auditLogger.logEvent(AuditEventType.UNAUTHORIZED_ACCESS, {
        userId: context.userId,
        accountId: context.accountId,
        action: `bulk_operation.${operation.type}`,
        result: 'failure',
        details: {
          missingPermission: requiredPermission,
          userPermissions: context.permissions
        }
      });

      return {
        allowed: false,
        reason: 'Missing required permission',
        requiredPermission
      };
    }

    // Skip limit checks for unlimited permission
    if (this.hasPermission(context, B2BPermission.BULK_ORDER_UNLIMITED)) {
      return { allowed: true };
    }

    // Check order limits
    const limits = context.customLimits || this.getRoleLimits(context.role);
    if (!limits) {
      return { allowed: true }; // No limits defined
    }

    // Check single order limits
    if (limits.singleOrderValue && operation.orderValue > limits.singleOrderValue) {
      await this.auditLogger.logEvent(AuditEventType.ORDER_LIMIT_EXCEEDED, {
        userId: context.userId,
        accountId: context.accountId,
        action: 'bulk_order.create',
        result: 'failure',
        details: {
          limitType: 'singleOrderValue',
          limit: limits.singleOrderValue,
          requested: operation.orderValue
        }
      });

      return {
        allowed: false,
        reason: 'Order value exceeds single order limit',
        currentLimit: limits.singleOrderValue,
        requestedAmount: operation.orderValue
      };
    }

    if (limits.singleOrderItems && operation.itemCount > limits.singleOrderItems) {
      await this.auditLogger.logEvent(AuditEventType.ORDER_LIMIT_EXCEEDED, {
        userId: context.userId,
        accountId: context.accountId,
        action: 'bulk_order.create',
        result: 'failure',
        details: {
          limitType: 'singleOrderItems',
          limit: limits.singleOrderItems,
          requested: operation.itemCount
        }
      });

      return {
        allowed: false,
        reason: 'Item count exceeds single order limit',
        currentLimit: limits.singleOrderItems,
        requestedAmount: operation.itemCount
      };
    }

    // Check daily/monthly limits
    const stats = await this.getOrderStats(context.accountId);
    
    if (limits.dailyValue && stats.dailyTotal + operation.orderValue > limits.dailyValue) {
      await this.auditLogger.logEvent(AuditEventType.ORDER_LIMIT_EXCEEDED, {
        userId: context.userId,
        accountId: context.accountId,
        action: 'bulk_order.create',
        result: 'failure',
        details: {
          limitType: 'dailyValue',
          limit: limits.dailyValue,
          currentUsage: stats.dailyTotal,
          requested: operation.orderValue
        }
      });

      return {
        allowed: false,
        reason: 'Daily order limit exceeded',
        currentLimit: limits.dailyValue - stats.dailyTotal,
        requestedAmount: operation.orderValue
      };
    }

    if (limits.monthlyValue && stats.monthlyTotal + operation.orderValue > limits.monthlyValue) {
      await this.auditLogger.logEvent(AuditEventType.ORDER_LIMIT_EXCEEDED, {
        userId: context.userId,
        accountId: context.accountId,
        action: 'bulk_order.create',
        result: 'failure',
        details: {
          limitType: 'monthlyValue',
          limit: limits.monthlyValue,
          currentUsage: stats.monthlyTotal,
          requested: operation.orderValue
        }
      });

      return {
        allowed: false,
        reason: 'Monthly order limit exceeded',
        currentLimit: limits.monthlyValue - stats.monthlyTotal,
        requestedAmount: operation.orderValue
      };
    }

    return { allowed: true };
  }

  /**
   * Authorize data export
   */
  async authorizeDataExport(
    context: B2BUserContext,
    exportType: 'orders' | 'products' | 'users' | 'analytics'
  ): Promise<AuthorizationResult> {
    if (!this.hasPermission(context, B2BPermission.EXPORT_DATA)) {
      await this.auditLogger.logEvent(AuditEventType.UNAUTHORIZED_ACCESS, {
        userId: context.userId,
        accountId: context.accountId,
        action: `export.${exportType}`,
        result: 'failure',
        details: {
          missingPermission: B2BPermission.EXPORT_DATA
        }
      });

      return {
        allowed: false,
        reason: 'Export permission required',
        requiredPermission: B2BPermission.EXPORT_DATA
      };
    }

    // Additional checks based on export type
    if (exportType === 'users' && !this.hasPermission(context, B2BPermission.MANAGE_USERS)) {
      return {
        allowed: false,
        reason: 'User management permission required for user exports',
        requiredPermission: B2BPermission.MANAGE_USERS
      };
    }

    return { allowed: true };
  }

  /**
   * Authorize pricing view
   */
  async authorizePricingView(
    context: B2BUserContext,
    pricingType: 'contract' | 'bulk' | 'custom',
    contractId?: string
  ): Promise<AuthorizationResult> {
    // Check contract pricing
    if (pricingType === 'contract') {
      if (!this.hasPermission(context, B2BPermission.VIEW_CONTRACT_PRICING)) {
        return {
          allowed: false,
          reason: 'Contract pricing permission required',
          requiredPermission: B2BPermission.VIEW_CONTRACT_PRICING
        };
      }

      // Check specific contract access
      if (contractId && context.contractIds && !context.contractIds.includes(contractId)) {
        await this.auditLogger.logEvent(AuditEventType.UNAUTHORIZED_ACCESS, {
          userId: context.userId,
          accountId: context.accountId,
          action: 'pricing.view_contract',
          result: 'failure',
          details: {
            contractId,
            userContracts: context.contractIds
          }
        });

        return {
          allowed: false,
          reason: 'No access to this contract'
        };
      }
    }

    // Check bulk pricing
    if (pricingType === 'bulk' && !this.hasPermission(context, B2BPermission.VIEW_BULK_DISCOUNTS)) {
      return {
        allowed: false,
        reason: 'Bulk discount permission required',
        requiredPermission: B2BPermission.VIEW_BULK_DISCOUNTS
      };
    }

    // Check custom pricing
    if (pricingType === 'custom' && !this.hasPermission(context, B2BPermission.REQUEST_CUSTOM_PRICING)) {
      return {
        allowed: false,
        reason: 'Custom pricing permission required',
        requiredPermission: B2BPermission.REQUEST_CUSTOM_PRICING
      };
    }

    return { allowed: true };
  }

  /**
   * Validate SKU patterns for B2B
   */
  async validateSKUPatterns(
    context: B2BUserContext,
    skus: string[]
  ): Promise<{
    valid: boolean;
    invalidSKUs: string[];
    reason?: string;
  }> {
    const invalidSKUs: string[] = [];
    
    // Check for B2B-specific SKU patterns
    const b2bPattern = process.env.B2B_SKU_PATTERN || '^[A-Z0-9-]+$';
    const regex = new RegExp(b2bPattern);

    for (const sku of skus) {
      if (!regex.test(sku)) {
        invalidSKUs.push(sku);
      }
    }

    if (invalidSKUs.length > 0) {
      await this.auditLogger.logEvent(AuditEventType.INVALID_SKU_PATTERN, {
        userId: context.userId,
        accountId: context.accountId,
        action: 'sku.validate',
        result: 'failure',
        details: {
          invalidSKUs,
          pattern: b2bPattern
        }
      });

      return {
        valid: false,
        invalidSKUs,
        reason: `Invalid SKU format. SKUs must match pattern: ${b2bPattern}`
      };
    }

    return { valid: true, invalidSKUs: [] };
  }

  /**
   * Check credit limit
   */
  async checkCreditLimit(
    context: B2BUserContext,
    orderValue: number,
    currentCredit: number,
    creditLimit: number
  ): Promise<AuthorizationResult> {
    if (!this.hasPermission(context, B2BPermission.VIEW_CREDIT_LIMIT)) {
      // User can't even view credit limit
      return { allowed: true }; // Don't block, just don't show credit info
    }

    const availableCredit = creditLimit - currentCredit;
    
    if (orderValue > availableCredit) {
      await this.auditLogger.logEvent(AuditEventType.CREDIT_LIMIT_EXCEEDED, {
        userId: context.userId,
        accountId: context.accountId,
        action: 'order.credit_check',
        result: 'failure',
        details: {
          orderValue,
          currentCredit,
          creditLimit,
          availableCredit
        }
      });

      return {
        allowed: false,
        reason: 'Insufficient credit available',
        currentLimit: availableCredit,
        requestedAmount: orderValue
      };
    }

    return { allowed: true };
  }

  /**
   * Get required permission for operation type
   */
  private getRequiredPermission(operationType: string): B2BPermission {
    switch (operationType) {
      case 'create':
        return B2BPermission.BULK_ORDER_CREATE;
      case 'update':
        return B2BPermission.BULK_ORDER_CREATE;
      case 'approve':
        return B2BPermission.BULK_ORDER_APPROVE;
      default:
        return B2BPermission.BULK_ORDER_VIEW;
    }
  }

  /**
   * Get role limits
   */
  private getRoleLimits(roleName: string): B2BRole['orderLimits'] {
    const role = B2B_ROLES[roleName];
    return role?.orderLimits;
  }

  /**
   * Get order statistics for account
   */
  private async getOrderStats(accountId: string): Promise<OrderStats> {
    // Check cache first
    const cached = this.orderStatsCache.get(accountId);
    if (cached && this.isSameDay(cached.lastOrderDate, new Date())) {
      return cached;
    }

    // In a real implementation, this would query the database
    // For now, return mock data
    const stats: OrderStats = {
      dailyTotal: 0,
      monthlyTotal: 0,
      lastOrderDate: new Date()
    };

    // Cache the stats
    this.orderStatsCache.set(accountId, stats);

    return stats;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Update order statistics after successful order
   */
  async updateOrderStats(accountId: string, orderValue: number): Promise<void> {
    const stats = await this.getOrderStats(accountId);
    
    const now = new Date();
    if (this.isSameDay(stats.lastOrderDate, now)) {
      stats.dailyTotal += orderValue;
    } else {
      stats.dailyTotal = orderValue;
    }
    
    stats.monthlyTotal += orderValue;
    stats.lastOrderDate = now;
    
    this.orderStatsCache.set(accountId, stats);
  }
}

// Singleton instance
let b2bAuthorization: B2BAuthorization | null = null;

/**
 * Get or create B2B authorization instance
 */
export function getB2BAuthorization(): B2BAuthorization {
  if (!b2bAuthorization) {
    b2bAuthorization = new B2BAuthorization();
  }
  return b2bAuthorization;
}