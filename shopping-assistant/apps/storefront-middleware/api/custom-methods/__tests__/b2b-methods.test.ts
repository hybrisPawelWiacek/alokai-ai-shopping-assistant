import { type IntegrationContext } from "../../../types";
import { getBulkPricing } from "../b2b/bulk-pricing";
import { checkBulkAvailability } from "../b2b/bulk-availability";
import { getAccountCredit } from "../b2b/account-credit";
import { requestProductSamples } from "../b2b/product-samples";
import { scheduleProductDemo } from "../b2b/product-demo";
import { applyTaxExemption } from "../b2b/tax-exemption";

describe('B2B Custom Extension Methods', () => {
  // Mock context
  const mockContext: IntegrationContext = {
    api: {
      getCustomer: jest.fn().mockResolvedValue({
        uid: 'test-customer',
        isB2B: true,
        accountId: 'ACC-123',
        currency: { isocode: 'USD' }
      }),
      getProduct: jest.fn().mockResolvedValue({
        code: 'PROD-123',
        name: 'Test Product',
        price: { value: 100, currencyIso: 'USD' },
        stock: { stockLevel: 500, stockLevelStatus: 'inStock' }
      }),
      getCart: jest.fn().mockResolvedValue({
        code: 'CART-123',
        totalTax: { value: 10 }
      }),
      getOrders: jest.fn().mockResolvedValue({
        orders: []
      })
    },
    getApiClient: jest.fn().mockResolvedValue({
      api: {}
    })
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBulkPricing', () => {
    it('should return bulk pricing tiers', async () => {
      const result = await getBulkPricing(mockContext, {
        productId: 'PROD-123',
        quantities: [50, 100, 250]
      });

      expect(result).toHaveProperty('productId', 'PROD-123');
      expect(result).toHaveProperty('currency', 'USD');
      expect(result).toHaveProperty('pricingTiers');
      expect(result.pricingTiers).toHaveLength(3);
      expect(result.pricingTiers[0]).toHaveProperty('quantity', 50);
      expect(result.pricingTiers[0]).toHaveProperty('discount');
    });

    it('should throw error for non-B2B customers', async () => {
      mockContext.api.getCustomer = jest.fn().mockResolvedValue({
        uid: 'test-customer',
        isB2B: false
      });

      await expect(getBulkPricing(mockContext, {
        productId: 'PROD-123',
        quantities: [50]
      })).rejects.toThrow('Bulk pricing is only available for B2B customers');
    });
  });

  describe('checkBulkAvailability', () => {
    it('should return availability information', async () => {
      const result = await checkBulkAvailability(mockContext, {
        productId: 'PROD-123',
        quantity: 100
      });

      expect(result).toHaveProperty('productId', 'PROD-123');
      expect(result).toHaveProperty('requestedQuantity', 100);
      expect(result).toHaveProperty('availability');
      expect(result.availability).toHaveProperty('immediate');
      expect(result.availability).toHaveProperty('production');
    });
  });

  describe('getAccountCredit', () => {
    it('should return credit information', async () => {
      const result = await getAccountCredit(mockContext, {
        customerId: 'test-customer'
      });

      expect(result).toHaveProperty('customerId', 'test-customer');
      expect(result).toHaveProperty('creditLimit');
      expect(result).toHaveProperty('availableCredit');
      expect(result).toHaveProperty('paymentTerms');
      expect(result).toHaveProperty('creditStatus');
    });
  });

  describe('requestProductSamples', () => {
    it('should create sample request', async () => {
      const result = await requestProductSamples(mockContext, {
        productIds: ['PROD-123'],
        shippingAddress: {
          company: 'Test Company',
          street: '123 Main St',
          city: 'Dallas',
          state: 'TX',
          postalCode: '75001',
          country: 'US'
        },
        customerId: 'test-customer'
      });

      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('status', 'pending');
      expect(result).toHaveProperty('products');
      expect(result.products).toHaveLength(1);
    });
  });

  describe('scheduleProductDemo', () => {
    it('should schedule demo', async () => {
      const result = await scheduleProductDemo(mockContext, {
        productIds: ['PROD-123'],
        preferredTimes: [{
          date: '2024-07-01',
          time: '14:00',
          timezone: 'CST'
        }],
        attendees: [{
          name: 'John Doe',
          email: 'john@example.com'
        }],
        customerId: 'test-customer',
        demoType: 'virtual'
      });

      expect(result).toHaveProperty('demoId');
      expect(result).toHaveProperty('status', 'scheduled');
      expect(result).toHaveProperty('meetingDetails');
      expect(result).toHaveProperty('salesRep');
    });
  });

  describe('applyTaxExemption', () => {
    it('should apply tax exemption', async () => {
      const result = await applyTaxExemption(mockContext, {
        exemptionCertificate: 'TX-12345-ABCD',
        state: 'TX',
        cartId: 'CART-123',
        customerId: 'test-customer'
      });

      expect(result).toHaveProperty('exemptionId');
      expect(result).toHaveProperty('status', 'active');
      expect(result).toHaveProperty('validStates');
      expect(result.validStates).toContain('TX');
    });

    it('should reject invalid certificate format', async () => {
      await expect(applyTaxExemption(mockContext, {
        exemptionCertificate: 'INVALID',
        state: 'TX',
        customerId: 'test-customer'
      })).rejects.toThrow('Invalid exemption certificate format');
    });
  });
});