/**
 * Mock implementation of Alokai custom extension methods
 * This simulates the structure of real custom methods that would be defined in middleware
 * Replace these mocks with actual SDK calls: sdk.customExtension.methodName()
 */

interface BulkPricingTier {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  leadTime: string;
  discount: number;
}

interface BulkPricingResponse {
  productId: string;
  pricingTiers: BulkPricingTier[];
  minimumOrderQuantity: number;
  currency: string;
}

interface BulkAvailabilityResponse {
  available: boolean;
  inStockQuantity: number;
  leadTime?: {
    estimatedDate: string;
    productionDays: number;
    shippingDays: number;
  };
  alternativeOptions?: Array<{
    description: string;
    availableQuantity: number;
    estimatedDelivery: string;
  }>;
}

interface ProductSampleRequest {
  requestId: string;
  status: 'pending' | 'approved' | 'shipped';
  estimatedDelivery: string;
  products: Array<{
    id: string;
    name: string;
    sku: string;
  }>;
}

interface AccountCreditInfo {
  creditLimit: number;
  availableCredit: number;
  outstandingBalance: number;
  paymentTerms: 'net_30' | 'net_60' | 'net_90';
  currency: string;
  pendingPayments?: Array<{
    amount: number;
    dueDate: string;
    invoiceNumber: string;
  }>;
}

interface ProductDemoBooking {
  demoId: string;
  scheduledTime: {
    date: string;
    time: string;
  };
  duration: number;
  meetingLink: string;
  products: Array<{
    id: string;
    name: string;
  }>;
  specialist: {
    name: string;
    email: string;
  };
}

interface TaxExemptionResult {
  applied: boolean;
  reason?: string;
  taxSavings: number;
  updatedTotal: number;
  exemptionId: string;
}

/**
 * Mock custom extension service
 * TODO: Replace with real SDK calls
 */
export const mockCustomExtension = {
  /**
   * Get bulk pricing tiers for a product
   * TODO: Replace with sdk.customExtension.getBulkPricing()
   */
  async getBulkPricing(params: {
    productId: string;
    quantities: number[];
    customerId?: string;
  }): Promise<BulkPricingResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const basePrice = 99.99;
    const pricingTiers: BulkPricingTier[] = params.quantities.map(quantity => {
      let discount = 0;
      let leadTime = '2-3 days';
      
      if (quantity >= 1000) {
        discount = 0.25;
        leadTime = '7-10 days';
      } else if (quantity >= 500) {
        discount = 0.20;
        leadTime = '5-7 days';
      } else if (quantity >= 100) {
        discount = 0.15;
        leadTime = '3-5 days';
      } else if (quantity >= 50) {
        discount = 0.10;
        leadTime = '2-3 days';
      }
      
      const unitPrice = basePrice * (1 - discount);
      
      return {
        quantity,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalPrice: Math.round(unitPrice * quantity * 100) / 100,
        leadTime,
        discount: Math.round(discount * 100)
      };
    });
    
    return {
      productId: params.productId,
      pricingTiers,
      minimumOrderQuantity: 50,
      currency: 'USD'
    };
  },

  /**
   * Check bulk availability for large orders
   * TODO: Replace with sdk.customExtension.checkBulkAvailability()
   */
  async checkBulkAvailability(params: {
    productId: string;
    quantity: number;
    deliveryDate?: string;
  }): Promise<BulkAvailabilityResponse> {
    await new Promise(resolve => setTimeout(resolve, 120));
    
    const inStockQuantity = 2500;
    const available = params.quantity <= inStockQuantity;
    
    const response: BulkAvailabilityResponse = {
      available,
      inStockQuantity
    };
    
    if (available) {
      const productionDays = params.quantity > 1000 ? 5 : 0;
      const shippingDays = params.quantity > 500 ? 3 : 2;
      
      response.leadTime = {
        estimatedDate: new Date(Date.now() + (productionDays + shippingDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        productionDays,
        shippingDays
      };
    } else {
      response.alternativeOptions = [
        {
          description: `Split order: ${inStockQuantity} units now, ${params.quantity - inStockQuantity} units in 2 weeks`,
          availableQuantity: inStockQuantity,
          estimatedDelivery: '3-5 days for first batch'
        },
        {
          description: 'Full order with extended lead time',
          availableQuantity: params.quantity,
          estimatedDelivery: '3-4 weeks'
        }
      ];
    }
    
    return response;
  },

  /**
   * Request product samples for evaluation
   * TODO: Replace with sdk.customExtension.requestProductSamples()
   */
  async requestProductSamples(params: {
    productIds: string[];
    shippingAddress: any;
    customerId?: string;
    accountId?: string;
  }): Promise<ProductSampleRequest> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      requestId: `SMPL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'approved',
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      products: params.productIds.map(id => ({
        id,
        name: `Sample Product ${id}`,
        sku: `SKU-${id}`
      }))
    };
  },

  /**
   * Get account credit information
   * TODO: Replace with sdk.customExtension.getAccountCredit()
   */
  async getAccountCredit(params: {
    customerId?: string;
    accountId?: string;
  }): Promise<AccountCreditInfo> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const creditLimit = 50000;
    const outstandingBalance = 12500;
    
    return {
      creditLimit,
      availableCredit: creditLimit - outstandingBalance,
      outstandingBalance,
      paymentTerms: 'net_30',
      currency: 'USD',
      pendingPayments: [
        {
          amount: 5000,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceNumber: 'INV-2024-001'
        },
        {
          amount: 7500,
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          invoiceNumber: 'INV-2024-002'
        }
      ]
    };
  },

  /**
   * Schedule a product demonstration
   * TODO: Replace with sdk.customExtension.scheduleProductDemo()
   */
  async scheduleProductDemo(params: {
    productIds: string[];
    preferredTimes: Array<{ date: string; time: string }>;
    attendeeCount: number;
    customerId?: string;
    contactInfo: {
      email?: string;
      company?: string;
    };
  }): Promise<ProductDemoBooking> {
    await new Promise(resolve => setTimeout(resolve, 180));
    
    // Pick the first available time slot
    const scheduledTime = params.preferredTimes[0] || {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '14:00'
    };
    
    return {
      demoId: `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scheduledTime,
      duration: 45,
      meetingLink: 'https://meet.example.com/demo/' + Math.random().toString(36).substr(2, 9),
      products: params.productIds.map(id => ({
        id,
        name: `Product ${id} Demo`
      })),
      specialist: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com'
      }
    };
  },

  /**
   * Apply tax exemption to cart
   * TODO: Replace with sdk.customExtension.applyTaxExemption()
   */
  async applyTaxExemption(params: {
    cartId?: string;
    exemptionCertificate: string;
    state: string;
    customerId?: string;
  }): Promise<TaxExemptionResult> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Mock validation of exemption certificate
    const validCertificate = params.exemptionCertificate.startsWith('EX-');
    
    if (!validCertificate) {
      return {
        applied: false,
        reason: 'Invalid exemption certificate format',
        taxSavings: 0,
        updatedTotal: 0,
        exemptionId: ''
      };
    }
    
    // Calculate mock tax savings (assuming 8.5% tax rate)
    const subtotal = 1500; // Mock cart subtotal
    const taxRate = 0.085;
    const taxSavings = subtotal * taxRate;
    
    return {
      applied: true,
      taxSavings: Math.round(taxSavings * 100) / 100,
      updatedTotal: subtotal,
      exemptionId: `EXMPT-${Date.now()}`
    };
  },

  /**
   * Find similar products (for alternatives)
   * TODO: Replace with sdk.customExtension.findSimilarProducts()
   */
  async findSimilarProducts(params: {
    sku: string;
    maxResults?: number;
    includeOutOfStock?: boolean;
    mode?: 'b2c' | 'b2b';
  }): Promise<Array<{
    product: any;
    similarity: number;
    reasons: string[];
  }>> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // This would be implemented in middleware using the pattern from product-similarity.ts
    // For now, return mock similar products
    return [
      {
        product: {
          id: 'prod-alt-001',
          sku: 'SKU-ALT-001',
          name: 'Professional Wireless Headphones',
          price: {
            value: { amount: 189.99, currency: 'USD' },
            regular: { amount: 189.99, currency: 'USD' }
          },
          availability: 'in_stock'
        },
        similarity: 0.85,
        reasons: ['Same category', 'Similar features', '24% lower price']
      },
      {
        product: {
          id: 'prod-alt-002',
          sku: 'SKU-ALT-002',
          name: 'Studio Monitor Headphones',
          price: {
            value: { amount: 249.99, currency: 'USD' },
            regular: { amount: 249.99, currency: 'USD' }
          },
          availability: 'in_stock'
        },
        similarity: 0.78,
        reasons: ['Same brand', 'Professional grade', 'Similar price']
      }
    ];
  }
};