import { type IntegrationContext } from "../../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";
import type { GetAccountCreditArgs, AccountCreditResponse, OutstandingInvoice } from './types';

/**
 * Get account credit information for B2B customers
 */
export async function getAccountCredit(
  context: IntegrationContext,
  args: GetAccountCreditArgs
): Promise<AccountCreditResponse> {
  const { customerId, accountId, includePendingOrders = false } = args;
  
  try {
    // IMPORTANT: Always use normalizers when fetching data from context.api
    // This ensures UDL consistency across all backends
    const { normalizeCustomer } = getNormalizers(context);
    
    // Validate B2B authorization
    const rawCustomer = await context.api.getCustomer();
    const customer = normalizeCustomer(rawCustomer);
    
    if (!customer.organizationId) {
      throw new Error('Account credit information is only available for B2B customers');
    }
    
    // Verify customer access
    if (customerId && customer.id !== customerId) {
      throw new Error('Unauthorized access to customer credit information');
    }
    
    // TODO: Real integration with ERP/accounting system
    // const erpClient = await context.getApiClient("erp");
    // const creditInfo = await erpClient.api.getAccountCredit({
    //   customerId: customerId || customer.id,
    //   accountId: accountId || customer.organizationId,
    //   includePendingOrders: includePendingOrders
    // });
    
    // Check if we can get order history for pending charges
    let pendingCharges = 0;
    if (includePendingOrders) {
      try {
        // This might exist in SAP Commerce
        const orders = await context.api.getOrders({ 
          statuses: ['PENDING', 'PROCESSING'] 
        });
        pendingCharges = orders?.orders?.reduce((sum: number, order: any) => 
          sum + (order.totalPrice?.value || 0), 0) || 0;
      } catch (error) {
        console.warn('Could not fetch pending orders:', error);
      }
    }
    
    // Mock implementation with realistic credit data
    const creditLimit = determineCreditLimit(customer);
    const usedCredit = Math.floor(creditLimit * 0.3); // 30% utilization
    const availableCredit = creditLimit - usedCredit - pendingCharges;
    
    // Generate mock outstanding invoices
    const outstandingInvoices: OutstandingInvoice[] = usedCredit > 0 ? [
      {
        invoiceNumber: `INV-${Date.now() - 25 * 24 * 60 * 60 * 1000}`,
        amount: usedCredit * 0.6,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        daysPastDue: 0
      },
      {
        invoiceNumber: `INV-${Date.now() - 45 * 24 * 60 * 60 * 1000}`,
        amount: usedCredit * 0.4,
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        daysPastDue: 15
      }
    ] : [];
    
    const now = new Date();
    const lastReview = new Date(now);
    lastReview.setMonth(lastReview.getMonth() - 3);
    const nextReview = new Date(now);
    nextReview.setMonth(nextReview.getMonth() + 3);
    
    return {
      accountId: accountId || customer.organizationId || `ACC-${customer.id}`,
      customerId: customer.id,
      creditLimit,
      availableCredit: Math.max(0, availableCredit),
      usedCredit,
      pendingCharges: includePendingOrders ? pendingCharges : undefined,
      currency: 'USD', // Normalized customer doesn't have currency in UDL
      paymentTerms: getPaymentTerms(customer),
      creditStatus: availableCredit > creditLimit * 0.1 ? 'active' : 'hold',
      creditScore: calculateCreditScore(customer, outstandingInvoices),
      lastReviewDate: lastReview.toISOString(),
      nextReviewDate: nextReview.toISOString(),
      outstandingInvoices: outstandingInvoices.length > 0 ? outstandingInvoices : undefined
    };
    
  } catch (error) {
    console.error('Error in getAccountCredit:', error);
    throw error;
  }
}

function determineCreditLimit(customer: any): number {
  // Mock credit limit based on customer type
  // In real implementation, this would come from ERP
  // Note: Normalized customer structure doesn't have accountType, using organizationId as proxy
  const hasOrg = !!customer.organizationId;
  
  // For B2B customers with org, provide higher limits
  if (hasOrg) {
    return 50000; // Default B2B credit limit
  }
  return 10000; // Should not reach here as we validate B2B earlier
}

function getPaymentTerms(customer: any): string {
  // Mock payment terms for B2B customers
  // In real implementation, this would come from customer contract
  // All B2B customers get Net 30 by default
  return 'Net 30';
}

function calculateCreditScore(customer: any, invoices: OutstandingInvoice[]): string {
  // Simple credit score calculation
  const hasPastDue = invoices.some(inv => inv.daysPastDue > 0);
  const avgDaysPastDue = invoices.length > 0 
    ? invoices.reduce((sum, inv) => sum + inv.daysPastDue, 0) / invoices.length 
    : 0;
  
  if (avgDaysPastDue === 0 && !hasPastDue) return 'A+';
  if (avgDaysPastDue < 10) return 'A';
  if (avgDaysPastDue < 20) return 'B+';
  if (avgDaysPastDue < 30) return 'B';
  return 'C';
}