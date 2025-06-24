import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  addToCartImplementation,
  updateCartItemImplementation,
  removeFromCartImplementation,
  getCartImplementation,
  checkoutImplementation
} from '../implementations/cart-implementation';
import { createTestState, createTestSDK, TestFixtures } from '../../testing/test-utils';
import type { CommerceState } from '../../state';

describe('Cart Actions', () => {
  let mockState: CommerceState;
  let mockSDK: ReturnType<typeof createTestSDK>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = createTestState({
      cart: {
        ...TestFixtures.cart,
        id: 'cart-123',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            name: 'Test Product 1',
            quantity: 2,
            price: 99.99,
            subtotal: 199.98
          }
        ],
        subtotal: 199.98,
        total: 199.98
      }
    });
    mockSDK = createTestSDK();
  });

  describe('addToCartImplementation', () => {
    it('should add product to cart using UDL', async () => {
      const updatedCart = {
        ...mockState.cart,
        items: [
          ...mockState.cart.items,
          {
            id: 'item-2',
            productId: 'prod-2',
            name: 'Test Product 2',
            quantity: 1,
            price: 149.99,
            subtotal: 149.99
          }
        ],
        subtotal: 349.97,
        total: 349.97
      };

      mockSDK.unified.addCartLineItem = jest.fn().mockResolvedValue(updatedCart);

      const result = await addToCartImplementation(
        { productId: 'prod-2', quantity: 1 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.addCartLineItem).toHaveBeenCalledWith({
        cartId: 'cart-123',
        product: {
          productId: 'prod-2',
          quantity: 1
        }
      });

      expect(result.cart.items).toHaveLength(2);
      expect(result.cart.total).toBe(349.97);
    });

    it('should handle adding product by SKU', async () => {
      await addToCartImplementation(
        { sku: 'SKU-002', quantity: 3 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.addCartLineItem).toHaveBeenCalledWith({
        cartId: 'cart-123',
        product: {
          sku: 'SKU-002',
          quantity: 3
        }
      });
    });

    it('should apply bulk pricing for B2B mode', async () => {
      mockState.mode = 'b2b';
      mockSDK.customExtension.addToCartWithBulkPricing = jest.fn().mockResolvedValue({
        ...mockState.cart,
        items: [
          ...mockState.cart.items,
          {
            id: 'item-2',
            productId: 'prod-2',
            quantity: 50,
            price: 89.99, // Bulk price
            subtotal: 4499.50,
            bulkPricing: { minQuantity: 50, price: 89.99 }
          }
        ]
      });

      const result = await addToCartImplementation(
        { productId: 'prod-2', quantity: 50 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.addToCartWithBulkPricing).toHaveBeenCalled();
      expect(result.cart.items[1].price).toBe(89.99);
    });

    it('should validate quantity limits', async () => {
      mockSDK.unified.addCartLineItem = jest.fn().mockRejectedValue(
        new Error('Quantity exceeds available stock')
      );

      await expect(
        addToCartImplementation(
          { productId: 'prod-1', quantity: 1000 },
          { state: mockState, sdk: mockSDK }
        )
      ).rejects.toThrow('Quantity exceeds available stock');
    });

    it('should create cart if none exists', async () => {
      mockState.cart.id = '';
      mockSDK.unified.createCart = jest.fn().mockResolvedValue({
        id: 'new-cart-123',
        items: [],
        total: 0
      });

      await addToCartImplementation(
        { productId: 'prod-1', quantity: 1 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.createCart).toHaveBeenCalled();
    });
  });

  describe('updateCartItemImplementation', () => {
    it('should update cart item quantity', async () => {
      const updatedCart = {
        ...mockState.cart,
        items: [
          {
            ...mockState.cart.items[0],
            quantity: 5,
            subtotal: 499.95
          }
        ],
        subtotal: 499.95,
        total: 499.95
      };

      mockSDK.unified.updateCartLineItem = jest.fn().mockResolvedValue(updatedCart);

      const result = await updateCartItemImplementation(
        { itemId: 'item-1', quantity: 5 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.updateCartLineItem).toHaveBeenCalledWith({
        cartId: 'cart-123',
        lineItemId: 'item-1',
        quantity: 5
      });

      expect(result.cart.items[0].quantity).toBe(5);
      expect(result.cart.total).toBe(499.95);
    });

    it('should handle quantity reduction to zero', async () => {
      const emptyCart = {
        ...mockState.cart,
        items: [],
        subtotal: 0,
        total: 0
      };

      mockSDK.unified.updateCartLineItem = jest.fn().mockResolvedValue(emptyCart);

      const result = await updateCartItemImplementation(
        { itemId: 'item-1', quantity: 0 },
        { state: mockState, sdk: mockSDK }
      );

      expect(result.cart.items).toHaveLength(0);
      expect(result.cart.total).toBe(0);
    });

    it('should recalculate bulk pricing for B2B', async () => {
      mockState.mode = 'b2b';
      mockSDK.customExtension.updateCartWithBulkPricing = jest.fn().mockResolvedValue({
        ...mockState.cart,
        items: [
          {
            ...mockState.cart.items[0],
            quantity: 100,
            price: 79.99, // New bulk price tier
            subtotal: 7999.00
          }
        ]
      });

      await updateCartItemImplementation(
        { itemId: 'item-1', quantity: 100 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.updateCartWithBulkPricing).toHaveBeenCalled();
    });
  });

  describe('removeFromCartImplementation', () => {
    it('should remove item from cart', async () => {
      const emptyCart = {
        ...mockState.cart,
        items: [],
        subtotal: 0,
        total: 0
      };

      mockSDK.unified.removeCartLineItem = jest.fn().mockResolvedValue(emptyCart);

      const result = await removeFromCartImplementation(
        { itemId: 'item-1' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.removeCartLineItem).toHaveBeenCalledWith({
        cartId: 'cart-123',
        lineItemId: 'item-1'
      });

      expect(result.cart.items).toHaveLength(0);
      expect(result.removedItem).toBe('Test Product 1');
    });

    it('should handle removing non-existent item', async () => {
      mockSDK.unified.removeCartLineItem = jest.fn().mockRejectedValue(
        new Error('Item not found in cart')
      );

      await expect(
        removeFromCartImplementation(
          { itemId: 'non-existent' },
          { state: mockState, sdk: mockSDK }
        )
      ).rejects.toThrow('Item not found');
    });
  });

  describe('getCartImplementation', () => {
    it('should fetch current cart state', async () => {
      const latestCart = {
        ...mockState.cart,
        lastUpdated: new Date().toISOString()
      };

      mockSDK.unified.getCart = jest.fn().mockResolvedValue(latestCart);

      const result = await getCartImplementation(
        {},
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.getCart).toHaveBeenCalledWith({
        cartId: 'cart-123'
      });

      expect(result.cart).toEqual(latestCart);
    });

    it('should include B2B information for B2B mode', async () => {
      mockState.mode = 'b2b';
      const b2bCart = {
        ...mockState.cart,
        taxExempt: true,
        poNumber: 'PO-12345',
        approvalRequired: true
      };

      mockSDK.unified.getCart = jest.fn().mockResolvedValue(mockState.cart);
      mockSDK.customExtension.getB2BCartDetails = jest.fn().mockResolvedValue(b2bCart);

      const result = await getCartImplementation(
        {},
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.getB2BCartDetails).toHaveBeenCalled();
      expect(result.cart.taxExempt).toBe(true);
    });
  });

  describe('checkoutImplementation', () => {
    it('should initiate checkout process', async () => {
      const checkoutSession = {
        id: 'checkout-123',
        status: 'pending',
        redirectUrl: 'https://checkout.example.com/session/123'
      };

      mockSDK.unified.createCheckoutSession = jest.fn().mockResolvedValue(checkoutSession);

      const result = await checkoutImplementation(
        {},
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.createCheckoutSession).toHaveBeenCalledWith({
        cartId: 'cart-123'
      });

      expect(result.checkoutUrl).toBe('https://checkout.example.com/session/123');
      expect(result.sessionId).toBe('checkout-123');
    });

    it('should handle B2B checkout with approval', async () => {
      mockState.mode = 'b2b';
      const b2bCheckout = {
        id: 'checkout-b2b-123',
        status: 'pending_approval',
        approvalRequired: true,
        approvalUrl: 'https://approval.example.com/123'
      };

      mockSDK.customExtension.createB2BCheckout = jest.fn().mockResolvedValue(b2bCheckout);

      const result = await checkoutImplementation(
        { poNumber: 'PO-12345' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.createB2BCheckout).toHaveBeenCalledWith({
        cartId: 'cart-123',
        poNumber: 'PO-12345'
      });

      expect(result.approvalRequired).toBe(true);
      expect(result.approvalUrl).toBeDefined();
    });

    it('should validate cart before checkout', async () => {
      mockState.cart.items = [];
      
      await expect(
        checkoutImplementation(
          {},
          { state: mockState, sdk: mockSDK }
        )
      ).rejects.toThrow('Cart is empty');
    });

    it('should handle payment method selection', async () => {
      await checkoutImplementation(
        { paymentMethod: 'credit_card' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.createCheckoutSession).toHaveBeenCalledWith({
        cartId: 'cart-123',
        paymentMethod: 'credit_card'
      });
    });
  });

  describe('Performance', () => {
    it('should complete cart operations within 50ms', async () => {
      const start = Date.now();
      
      await addToCartImplementation(
        { productId: 'prod-1', quantity: 1 },
        { state: mockState, sdk: mockSDK }
      );
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSDK.unified.addCartLineItem = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        addToCartImplementation(
          { productId: 'prod-1', quantity: 1 },
          { state: mockState, sdk: mockSDK }
        )
      ).rejects.toThrow('Network error');
    });

    it('should validate input parameters', async () => {
      await expect(
        addToCartImplementation(
          { productId: '', quantity: -1 },
          { state: mockState, sdk: mockSDK }
        )
      ).rejects.toThrow('Invalid parameters');
    });
  });
});