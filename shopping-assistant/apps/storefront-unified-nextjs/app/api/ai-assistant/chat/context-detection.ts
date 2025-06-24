import { NextRequest } from 'next/server';
import { getSdk } from '@/sdk';

/**
 * B2B context information
 */
export interface B2BContext {
  isB2B: boolean;
  companyName?: string;
  accountId?: string;
  creditLimit?: number;
  taxExempt?: boolean;
  bulkPricingEnabled?: boolean;
  approvalRequired?: boolean;
}

/**
 * Detect B2B context from user and request data
 */
export async function detectB2BContext(
  userId: string,
  request: NextRequest
): Promise<B2BContext> {
  try {
    // Check request headers for B2B indicators
    const b2bHeader = request.headers.get('x-b2b-account');
    if (b2bHeader) {
      return parseB2BHeader(b2bHeader);
    }

    // Check user agent for B2B patterns
    const userAgent = request.headers.get('user-agent') || '';
    if (containsB2BPatterns(userAgent)) {
      return await fetchB2BContextFromUser(userId);
    }

    // Check referrer for B2B portal
    const referrer = request.headers.get('referer') || '';
    if (referrer.includes('/business') || referrer.includes('/b2b')) {
      return await fetchB2BContextFromUser(userId);
    }

    // Fetch user profile to determine account type
    const sdk = getSdk();
    try {
      const customer = await sdk.unified.getCustomer();
      
      // Check if customer has business account
      if (customer && isBusinessAccount(customer)) {
        return {
          isB2B: true,
          companyName: customer.company || undefined,
          accountId: customer.id,
          creditLimit: getCustomerCreditLimit(customer),
          taxExempt: customer.taxExempt || false,
          bulkPricingEnabled: true,
          approvalRequired: requiresApproval(customer)
        };
      }
    } catch (error) {
      // User might not be logged in or API call failed
      console.debug('Could not fetch customer data:', error);
    }

    // Default to B2C
    return { isB2B: false };
  } catch (error) {
    console.error('Error detecting B2B context:', error);
    return { isB2B: false };
  }
}

/**
 * Parse B2B header
 */
function parseB2BHeader(header: string): B2BContext {
  try {
    const data = JSON.parse(Buffer.from(header, 'base64').toString());
    return {
      isB2B: true,
      companyName: data.company,
      accountId: data.accountId,
      creditLimit: data.creditLimit,
      taxExempt: data.taxExempt || false,
      bulkPricingEnabled: data.bulkPricing !== false,
      approvalRequired: data.approvalRequired || false
    };
  } catch {
    return { isB2B: true };
  }
}

/**
 * Check if user agent contains B2B patterns
 */
function containsB2BPatterns(userAgent: string): boolean {
  const b2bPatterns = [
    /business/i,
    /enterprise/i,
    /corporate/i,
    /b2b/i,
    /procurement/i
  ];
  
  return b2bPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Fetch B2B context from user service
 */
async function fetchB2BContextFromUser(userId: string): Promise<B2BContext> {
  // In a real implementation, this would call a user service
  // For now, return mock data based on user ID pattern
  if (userId.startsWith('business_') || userId.startsWith('company_')) {
    return {
      isB2B: true,
      companyName: 'Acme Corporation',
      accountId: userId,
      creditLimit: 50000,
      taxExempt: false,
      bulkPricingEnabled: true,
      approvalRequired: true
    };
  }
  
  return { isB2B: false };
}

/**
 * Check if customer is a business account
 */
function isBusinessAccount(customer: any): boolean {
  // Check various indicators
  return !!(
    customer.company ||
    customer.businessType ||
    customer.taxId ||
    customer.accountType === 'business' ||
    customer.customerGroup?.includes('B2B') ||
    customer.customerGroup?.includes('business')
  );
}

/**
 * Get customer credit limit
 */
function getCustomerCreditLimit(customer: any): number | undefined {
  if (customer.creditLimit) {
    return customer.creditLimit;
  }
  
  // Check custom fields
  if (customer.customFields?.creditLimit) {
    return parseFloat(customer.customFields.creditLimit);
  }
  
  // Default credit limits by customer group
  if (customer.customerGroup?.includes('enterprise')) {
    return 100000;
  } else if (customer.customerGroup?.includes('business')) {
    return 50000;
  }
  
  return undefined;
}

/**
 * Check if customer requires approval for orders
 */
function requiresApproval(customer: any): boolean {
  // Check various approval indicators
  return !!(
    customer.requiresApproval ||
    customer.customFields?.requiresApproval ||
    customer.customerGroup?.includes('approval_required') ||
    (customer.creditLimit && customer.creditUsed >= customer.creditLimit * 0.8)
  );
}

/**
 * Create B2B context header for downstream services
 */
export function createB2BContextHeader(context: B2BContext): string {
  if (!context.isB2B) {
    return '';
  }
  
  const data = {
    company: context.companyName,
    accountId: context.accountId,
    creditLimit: context.creditLimit,
    taxExempt: context.taxExempt,
    bulkPricing: context.bulkPricingEnabled,
    approvalRequired: context.approvalRequired
  };
  
  return Buffer.from(JSON.stringify(data)).toString('base64');
}