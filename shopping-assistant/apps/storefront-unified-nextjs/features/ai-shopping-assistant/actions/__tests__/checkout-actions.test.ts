import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  checkoutImplementation,
  applyCouponImplementation,
  calculateShippingImplementation,
  createQuoteImplementation,
  createPurchaseOrderImplementation
} from '../implementations/checkout-implementation';
import type { CommerceState } from '../../state';
import { CommerceStateAnnotation } from '../../state';
import { CommerceSecurityJudge } from '../../security';
import { getSdk } from '@/sdk';

// Mock dependencies
jest.mock('@/sdk', () => ({
  getSdk: jest.fn()
}));

jest.mock('../../security', () => ({
  CommerceSecurityJudge: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockResolvedValue({ isValid: true }),
    getContext: jest.fn().mockReturnValue({})
  }))
}));

describe('Checkout Actions', () => {
  let mockState: CommerceState;
  let mockSdk: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockState = CommerceStateAnnotation.spec.default() as CommerceState;
    mockState.mode = 'b2c';
    mockState.context.currency = 'USD';
    mockState.cart = {
      id: 'cart-123',
      items: [
        { id: 'item-1', productId: 'prod-1', name: 'Product 1', quantity: 2, price: 50 }
      ],
      total: 100,
      subtotal: 100,
      tax: 0,
      shipping: 0,
      appliedCoupons: [],
      lastUpdated: new Date().toISOString()
    };
    
    mockSdk = {
      unified: {
        createCheckout: jest.fn(),
        applyCoupon: jest.fn(),
        getCart: jest.fn(),
        getShippingMethods: jest.fn()
      },
      customExtension: {
        createQuote: jest.fn(),
        createPurchaseOrder: jest.fn()
      }
    };
    
    (getSdk as jest.MockedFunction<typeof getSdk>).mockReturnValue(mockSdk);
  });

  describe('checkoutImplementation', () => {
    it('should create checkout for B2C customer', async () => {
      const params = {
        shippingMethod: 'standard',
        paymentMethod: 'credit_card'
      };

      mockSdk.unified.createCheckout.mockResolvedValueOnce({
        checkoutUrl: 'https://checkout.example.com/session-123'
      });

      const commands = await checkoutImplementation(params, mockState);

      expect(mockSdk.unified.createCheckout).toHaveBeenCalledWith({
        shippingMethod: 'standard',
        paymentMethod: 'credit_card'
      });

      expect(commands).toHaveLength(2);
      
      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Checkout Ready');
      expect(message).toContain('Total: USD 100');
      expect(message).toContain('Complete Your Purchase');
      expect(message).toContain('https://checkout.example.com/session-123');
      
      expect(commands[1].type).toBe('UPDATE_CONTEXT');
      expect(commands[1].payload.checkoutInitiated).toBe(true);
    });

    it('should create B2B checkout with appropriate options', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        paymentMethod: 'invoice'
      };

      mockSdk.unified.createCheckout.mockResolvedValueOnce({
        checkoutUrl: 'https://b2b-checkout.example.com/session-456'
      });

      const commands = await checkoutImplementation(params, mockState);

      const message = commands[0].payload.content;
      expect(message).toContain('B2B Checkout Options');
      expect(message).toContain('Generate Purchase Order');
      expect(message).toContain('Request Net Terms');
      expect(message).toContain('Complete B2B Checkout');
    });

    it('should reject invalid B2B payment methods', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        paymentMethod: 'credit_card' // Not allowed for B2B
      };

      const commands = await checkoutImplementation(params, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('must use invoice or purchase order');
    });

    it('should enforce minimum order requirements', async () => {
      mockState.mode = 'b2b';
      mockState.cart.total = 50; // Below B2B minimum

      const commands = await checkoutImplementation({}, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('Minimum order value is USD 100');
    });

    it('should block checkout on security validation failure', async () => {
      const mockSecurityJudge = {
        validate: jest.fn().mockResolvedValue({ 
          isValid: false, 
          severity: 'critical' 
        }),
        getContext: jest.fn().mockReturnValue({})
      };
      
      (CommerceSecurityJudge as jest.MockedClass<typeof CommerceSecurityJudge>)
        .mockImplementationOnce(() => mockSecurityJudge as any);

      const commands = await checkoutImplementation({}, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('Security validation failed');
    });
  });

  describe('applyCouponImplementation', () => {
    it('should apply valid coupon', async () => {
      const params = {
        couponCode: 'SAVE20'
      };

      mockSdk.unified.applyCoupon.mockResolvedValueOnce({
        applied: true,
        discount: { type: 'percentage', value: 20 },
        message: 'Coupon applied successfully'
      });

      mockSdk.unified.getCart.mockResolvedValueOnce({
        totalPrice: { amount: 80 },
        appliedCoupons: ['SAVE20']
      });

      const commands = await applyCouponImplementation(params, mockState);

      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.total).toBe(80);
      expect(commands[0].payload.appliedCoupons).toContain('SAVE20');
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      expect(commands[1].payload.content).toContain('Coupon "SAVE20" applied successfully');
      expect(commands[1].payload.content).toContain('Discount: 20%');
      expect(commands[1].payload.content).toContain('New total: USD 80');
    });

    it('should reject suspicious coupon codes', async () => {
      const params = {
        couponCode: 'ADMIN' // Suspicious code
      };

      const commands = await applyCouponImplementation(params, mockState);

      expect(mockSdk.unified.applyCoupon).not.toHaveBeenCalled();
      expect(commands[0].type).toBe('ADD_MESSAGE');
      expect(commands[0].payload.content).toContain('Invalid coupon code');
    });

    it('should handle invalid coupon response', async () => {
      const params = {
        couponCode: 'EXPIRED'
      };

      mockSdk.unified.applyCoupon.mockResolvedValueOnce({
        applied: false,
        message: 'Coupon has expired'
      });

      const commands = await applyCouponImplementation(params, mockState);

      expect(commands[0].type).toBe('ADD_MESSAGE');
      expect(commands[0].payload.content).toContain('Coupon has expired');
    });
  });

  describe('calculateShippingImplementation', () => {
    it('should return shipping options', async () => {
      const params = {
        address: {
          country: 'US',
          postalCode: '10001',
          state: 'NY'
        }
      };

      const mockShippingOptions = [
        {
          name: 'Standard Shipping',
          price: { amount: 5 },
          estimatedDelivery: '5-7 business days'
        },
        {
          name: 'Express Shipping',
          price: { amount: 15 },
          estimatedDelivery: '2-3 business days'
        }
      ];

      mockSdk.unified.getShippingMethods.mockResolvedValueOnce(mockShippingOptions);

      const commands = await calculateShippingImplementation(params, mockState);

      expect(mockSdk.unified.getShippingMethods).toHaveBeenCalledWith({
        cartId: 'cart-123',
        address: params.address
      });

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Available Shipping Options');
      expect(message).toContain('Standard Shipping');
      expect(message).toContain('Cost: USD 5');
      expect(message).toContain('Express Shipping');
      expect(message).toContain('Cost: USD 15');
    });

    it('should show B2B shipping note', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        address: { country: 'US', postalCode: '10001' }
      };

      mockSdk.unified.getShippingMethods.mockResolvedValueOnce([
        {
          name: 'Freight Shipping',
          price: { amount: 100 },
          estimatedDelivery: '7-10 business days',
          bulkDiscount: true
        }
      ]);

      const commands = await calculateShippingImplementation(params, mockState);

      const message = commands[0].payload.content;
      expect(message).toContain('Bulk discount available');
      expect(message).toContain('Contact sales for custom shipping arrangements');
    });
  });

  describe('createQuoteImplementation', () => {
    it('should create quote for B2B customer', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        companyInfo: {
          name: 'Acme Corp',
          taxId: '12-3456789',
          contactEmail: 'buyer@acme.com'
        },
        validityDays: 30,
        notes: 'Please expedite'
      };

      mockSdk.customExtension.createQuote.mockResolvedValueOnce({
        quoteId: 'QUOTE-2024-001',
        validUntil: '2024-02-15',
        totalAmount: 1000,
        volumeDiscount: 100,
        downloadUrl: 'https://quotes.example.com/QUOTE-2024-001.pdf'
      });

      const commands = await createQuoteImplementation(params, mockState);

      expect(mockSdk.customExtension.createQuote).toHaveBeenCalledWith({
        companyInfo: params.companyInfo,
        validityDays: 30,
        notes: 'Please expedite',
        items: mockState.cart.items,
        currency: 'USD'
      });

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Quote Generated Successfully');
      expect(message).toContain('Quote ID: QUOTE-2024-001');
      expect(message).toContain('Company: Acme Corp');
      expect(message).toContain('Volume Discount: -USD 100');
      expect(message).toContain('Download Quote PDF');
      
      expect(commands[1].type).toBe('UPDATE_CONTEXT');
      expect(commands[1].payload.lastQuoteId).toBe('QUOTE-2024-001');
    });

    it('should reject quote for B2C customers', async () => {
      mockState.mode = 'b2c';
      
      const commands = await createQuoteImplementation({
        companyInfo: { name: 'Test', contactEmail: 'test@test.com' }
      }, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('only available for business customers');
    });

    it('should reject quote for empty cart', async () => {
      mockState.mode = 'b2b';
      mockState.cart.items = [];
      
      const commands = await createQuoteImplementation({
        companyInfo: { name: 'Test', contactEmail: 'test@test.com' }
      }, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('Cannot create a quote for an empty cart');
    });
  });

  describe('createPurchaseOrderImplementation', () => {
    it('should create purchase order for B2B', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        poNumber: 'PO-2024-001',
        paymentTerms: 'net_30',
        approverEmail: 'manager@company.com'
      };

      mockSdk.customExtension.createPurchaseOrder.mockResolvedValueOnce({
        orderId: 'ORDER-789',
        status: 'pending_approval',
        paymentInstructions: {
          bankName: 'Commerce Bank',
          reference: 'ORDER-789-REF'
        }
      });

      const commands = await createPurchaseOrderImplementation(params, mockState);

      expect(commands[0].type).toBe('ADD_MESSAGE');
      const message = commands[0].payload.content;
      expect(message).toContain('Purchase Order Created');
      expect(message).toContain('Order ID: ORDER-789');
      expect(message).toContain('PO Number: PO-2024-001');
      expect(message).toContain('Payment Terms: NET 30');
      expect(message).toContain('Bank: Commerce Bank');
      
      expect(commands[1].type).toBe('UPDATE_CART');
      expect(commands[1].payload.items).toEqual([]);
      expect(commands[1].payload.total).toBe(0);
    });

    it('should validate PO number format', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        poNumber: 'invalid po!', // Invalid format
        paymentTerms: 'net_30'
      };

      const commands = await createPurchaseOrderImplementation(params, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('Invalid PO number format');
    });

    it('should reject for B2C customers', async () => {
      mockState.mode = 'b2c';
      
      const commands = await createPurchaseOrderImplementation({
        poNumber: 'PO-123',
        paymentTerms: 'net_30'
      }, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('only available for business customers');
    });
  });
});