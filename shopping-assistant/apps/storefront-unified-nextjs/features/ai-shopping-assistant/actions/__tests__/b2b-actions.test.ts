import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  requestBulkPricingImplementation,
  checkBulkAvailabilityImplementation,
  requestSampleImplementation,
  getAccountCreditImplementation,
  scheduleProductDemoImplementation,
  getTaxExemptionImplementation
} from '../implementations/b2b-implementation';
import type { CommerceState } from '../../state';
import { CommerceStateAnnotation } from '../../state';
import { getSdk } from '@/sdk';

jest.mock('@/sdk', () => ({
  getSdk: jest.fn()
}));

describe('B2B Actions', () => {
  let mockState: CommerceState;
  let mockSdk: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockState = CommerceStateAnnotation.spec.default() as CommerceState;
    mockState.mode = 'b2b';
    mockState.context.currency = 'USD';
    mockState.context.customerId = 'cust-123';
    mockState.context.accountId = 'acc-456';
    mockState.cart = {
      id: 'cart-123',
      items: [
        { id: 'item-1', productId: 'prod-1', name: 'Product 1', quantity: 100, price: 50 }
      ],
      total: 5000,
      subtotal: 5000,
      tax: 0,
      shipping: 0,
      appliedCoupons: [],
      lastUpdated: new Date().toISOString()
    };
    
    mockSdk = {
      unified: {
        getProductDetails: jest.fn()
      },
      customExtension: {
        getBulkPricing: jest.fn(),
        checkBulkAvailability: jest.fn(),
        requestProductSamples: jest.fn(),
        getAccountCredit: jest.fn(),
        scheduleProductDemo: jest.fn(),
        applyTaxExemption: jest.fn()
      }
    };
    
    (getSdk as jest.MockedFunction<typeof getSdk>).mockReturnValue(mockSdk);
  });

  describe('requestBulkPricingImplementation', () => {
    it('should return bulk pricing tiers', async () => {
      const params = {
        productId: 'prod-123',
        quantities: [100, 500, 1000]
      };

      mockSdk.unified.getProductDetails.mockResolvedValueOnce({
        id: 'prod-123',
        name: 'Industrial Widget',
        price: { regular: { amount: 100 } }
      });

      mockSdk.customExtension.getBulkPricing.mockResolvedValueOnce({
        pricingTiers: [
          { quantity: 100, totalPrice: 9000, unitPrice: 90, leadTime: '3-5 days' },
          { quantity: 500, totalPrice: 40000, unitPrice: 80, leadTime: '5-7 days' },
          { quantity: 1000, totalPrice: 70000, unitPrice: 70, leadTime: '7-10 days' }
        ],
        minimumOrderQuantity: 100
      });

      const commands = await requestBulkPricingImplementation(params, mockState);

      expect(mockSdk.customExtension.getBulkPricing).toHaveBeenCalledWith({
        productId: 'prod-123',
        quantities: [100, 500, 1000],
        customerId: 'cust-123'
      });

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Bulk Pricing for Industrial Widget');
      expect(message).toContain('100+ units: USD 90.00/unit (Save 10.0%)');
      expect(message).toContain('500+ units: USD 80.00/unit (Save 20.0%)');
      expect(message).toContain('1000+ units: USD 70.00/unit (Save 30.0%)');
      expect(message).toContain('Minimum Order: 100 units');
      
      expect(commands[1].type).toBe('UPDATE_AVAILABLE_ACTIONS');
      expect(commands[1].payload.suggested).toContain('addToCart:prod-123:100');
    });

    it('should reject for B2C mode', async () => {
      mockState.mode = 'b2c';
      
      const commands = await requestBulkPricingImplementation({
        productId: 'prod-123',
        quantities: [100]
      }, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('only available for business customers');
    });
  });

  describe('checkBulkAvailabilityImplementation', () => {
    it('should check availability for large quantities', async () => {
      const params = {
        productId: 'prod-123',
        quantity: 5000,
        deliveryDate: '2024-03-01'
      };

      mockSdk.unified.getProductDetails.mockResolvedValueOnce({
        id: 'prod-123',
        name: 'Bulk Product'
      });

      mockSdk.customExtension.checkBulkAvailability.mockResolvedValueOnce({
        available: true,
        inStockQuantity: 2000,
        leadTime: {
          estimatedDate: '2024-02-28',
          productionDays: 15
        }
      });

      const commands = await checkBulkAvailabilityImplementation(params, mockState);

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Bulk Availability for Bulk Product');
      expect(message).toContain('Requested Quantity: **5000 units**');
      expect(message).toContain('✅ **Available**');
      expect(message).toContain('In Stock: 2000 units');
      expect(message).toContain('Production Time: 15 days');
      expect(message).toContain('custom fulfillment options'); // For large orders
      
      expect(commands[1].type).toBe('UPDATE_AVAILABLE_ACTIONS');
      expect(commands[1].payload.enabled).toContain('addToCart');
      expect(commands[1].payload.enabled).toContain('createQuote');
    });

    it('should show alternative options when not available', async () => {
      const params = {
        productId: 'prod-123',
        quantity: 10000
      };

      mockSdk.unified.getProductDetails.mockResolvedValueOnce({
        id: 'prod-123',
        name: 'Limited Product'
      });

      mockSdk.customExtension.checkBulkAvailability.mockResolvedValueOnce({
        available: false,
        inStockQuantity: 500,
        alternativeOptions: [
          {
            description: 'Split shipment - 5000 units now, 5000 in 30 days',
            availableQuantity: 5000,
            estimatedDelivery: 'Immediate'
          },
          {
            description: 'Alternative model with similar specs',
            availableQuantity: 10000,
            estimatedDelivery: '5-7 days'
          }
        ]
      });

      const commands = await checkBulkAvailabilityImplementation(params, mockState);

      const message = commands[0].payload.content;
      expect(message).toContain('⚠️ **Limited Availability**');
      expect(message).toContain('Current Stock: 500 units');
      expect(message).toContain('Alternative Options:');
      expect(message).toContain('Split shipment');
      expect(message).toContain('Alternative model');
    });
  });

  describe('requestSampleImplementation', () => {
    it('should create sample request', async () => {
      const params = {
        productIds: ['prod-1', 'prod-2'],
        shippingAddress: {
          company: 'Test Corp',
          address: '123 Business St',
          city: 'New York',
          postalCode: '10001',
          country: 'US'
        }
      };

      mockSdk.customExtension.requestProductSamples.mockResolvedValueOnce({
        requestId: 'SAMPLE-2024-001',
        status: 'pending',
        estimatedDelivery: '3-5 business days',
        products: [
          { id: 'prod-1', name: 'Product 1' },
          { id: 'prod-2', name: 'Product 2' }
        ]
      });

      const commands = await requestSampleImplementation(params, mockState);

      expect(mockSdk.customExtension.requestProductSamples).toHaveBeenCalledWith({
        productIds: ['prod-1', 'prod-2'],
        shippingAddress: params.shippingAddress,
        customerId: 'cust-123',
        accountId: 'acc-456'
      });

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Sample Request Submitted');
      expect(message).toContain('Request ID: SAMPLE-2024-001');
      expect(message).toContain('Test Corp');
      expect(message).toContain('123 Business St');
      
      expect(commands[1].type).toBe('UPDATE_CONTEXT');
      expect(commands[1].payload.sampleRequestId).toBe('SAMPLE-2024-001');
    });

    it('should enforce sample limit', async () => {
      const params = {
        productIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], // Over limit
        shippingAddress: { company: 'Test', address: '123', city: 'NY', postalCode: '10001', country: 'US' }
      };

      await expect(requestSampleImplementation(params, mockState)).rejects.toThrow();
    });
  });

  describe('getAccountCreditImplementation', () => {
    it('should display account credit information', async () => {
      mockSdk.customExtension.getAccountCredit.mockResolvedValueOnce({
        creditLimit: 50000,
        availableCredit: 35000,
        outstandingBalance: 15000,
        paymentTerms: 'net_30',
        pendingPayments: [
          { amount: 5000, dueDate: '2024-02-15' },
          { amount: 10000, dueDate: '2024-03-01' }
        ]
      });

      const commands = await getAccountCreditImplementation({}, mockState);

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Account Credit Information');
      expect(message).toContain('Credit Limit: USD 50,000');
      expect(message).toContain('Available Credit: USD 35,000');
      expect(message).toContain('Outstanding Balance: USD 15,000');
      expect(message).toContain('Credit Utilization: 30.0%');
      expect(message).toContain('Payment Terms: NET 30');
      expect(message).toContain('Sufficient credit available');
      expect(message).toContain('USD 5000 due 2024-02-15');
    });

    it('should warn about low credit', async () => {
      mockSdk.customExtension.getAccountCredit.mockResolvedValueOnce({
        creditLimit: 50000,
        availableCredit: 5000, // Low credit
        outstandingBalance: 45000,
        paymentTerms: 'net_30'
      });

      const commands = await getAccountCreditImplementation({}, mockState);

      const message = commands[0].payload.content;
      expect(message).toContain('Low available credit');
      expect(message).toContain('Contact our finance team');
    });
  });

  describe('scheduleProductDemoImplementation', () => {
    it('should schedule product demo', async () => {
      const params = {
        productIds: ['prod-1', 'prod-2'],
        preferredTimes: [
          { date: '2024-02-01', time: '10:00 AM' },
          { date: '2024-02-02', time: '2:00 PM' }
        ],
        attendeeCount: 5
      };

      mockSdk.customExtension.scheduleProductDemo.mockResolvedValueOnce({
        demoId: 'DEMO-2024-001',
        scheduledTime: { date: '2024-02-01', time: '10:00 AM' },
        duration: 60,
        products: [
          { id: 'prod-1', name: 'Product 1' },
          { id: 'prod-2', name: 'Product 2' }
        ],
        meetingLink: 'https://demo.example.com/DEMO-2024-001'
      });

      const commands = await scheduleProductDemoImplementation(params, mockState);

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Product Demo Scheduled');
      expect(message).toContain('Demo ID: DEMO-2024-001');
      expect(message).toContain('Date & Time: 2024-02-01 at 10:00 AM');
      expect(message).toContain('Duration: 60 minutes');
      expect(message).toContain('Attendees: 5');
      expect(message).toContain('Meeting Link: https://demo.example.com/DEMO-2024-001');
    });
  });

  describe('getTaxExemptionImplementation', () => {
    it('should apply tax exemption', async () => {
      const params = {
        exemptionCertificate: 'TX-EXEMPT-123',
        state: 'TX'
      };

      mockSdk.customExtension.applyTaxExemption.mockResolvedValueOnce({
        applied: true,
        taxSavings: 500,
        updatedTotal: 4500
      });

      const commands = await getTaxExemptionImplementation(params, mockState);

      expect(mockSdk.customExtension.applyTaxExemption).toHaveBeenCalledWith({
        cartId: 'cart-123',
        exemptionCertificate: 'TX-EXEMPT-123',
        state: 'TX',
        customerId: 'cust-123'
      });

      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.tax).toBe(0);
      expect(commands[0].payload.total).toBe(4500);
      expect(commands[0].payload.taxExempt).toBe(true);
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      const message = commands[1].payload.content;
      expect(message).toContain('Tax Exemption Applied');
      expect(message).toContain('Certificate: TX-EXEMPT-123');
      expect(message).toContain('Tax Savings: USD 500.00');
      expect(message).toContain('Tax: USD 0.00 (Exempt)');
      
      expect(commands[2].type).toBe('UPDATE_AVAILABLE_ACTIONS');
      expect(commands[2].payload.suggested).toContain('createPurchaseOrder');
    });

    it('should reject invalid certificate', async () => {
      mockSdk.customExtension.applyTaxExemption.mockResolvedValueOnce({
        applied: false,
        reason: 'Certificate expired'
      });

      const commands = await getTaxExemptionImplementation({
        exemptionCertificate: 'EXPIRED-123',
        state: 'TX'
      }, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('Certificate expired');
    });

    it('should reject for empty cart', async () => {
      mockState.cart.items = [];
      
      const commands = await getTaxExemptionImplementation({
        exemptionCertificate: 'TX-123',
        state: 'TX'
      }, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('Cannot apply tax exemption to an empty cart');
    });
  });
});