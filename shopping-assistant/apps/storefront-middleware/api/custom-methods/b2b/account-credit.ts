import { type IntegrationContext } from "../../../types";
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
    // Validate B2B authorization
    const customer = await context.api.getCustomer();
    if (!customer.isB2B) {
      throw new Error('Account credit information is only available for B2B customers');
    }
    
    // Verify customer access
    if (customerId && customer.uid !== customerId) {
      throw new Error('Unauthorized access to customer credit information');
    }
    
    // TODO: Real integration with ERP/accounting system
    // const erpClient = await context.getApiClient("erp");
    // const creditInfo = await erpClient.api.getAccountCredit({
    //   customerId: customerId || customer.uid,
    //   accountId: accountId || customer.accountId,
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
      accountId: accountId || customer.accountId || `ACC-${customer.uid}`,
      customerId: customer.uid,
      creditLimit,
      availableCredit: Math.max(0, availableCredit),
      usedCredit,
      pendingCharges: includePendingOrders ? pendingCharges : undefined,
      currency: customer.currency?.isocode || 'USD',
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
  const accountType = customer.accountType || 'STANDARD';
  
  switch (accountType) {
    case 'ENTERPRISE':
      return 100000;
    case 'PREMIUM':
      return 50000;
    case 'STANDARD':
      return 25000;
    default:
      return 10000;
  }
}

function getPaymentTerms(customer: any): string {
  // Mock payment terms based on account type
  const accountType = customer.accountType || 'STANDARD';
  
  switch (accountType) {
    case 'ENTERPRISE':
      return 'Net 60';
    case 'PREMIUM':
      return 'Net 45';
    case 'STANDARD':
      return 'Net 30';
    default:
      return 'Net 15';
  }
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