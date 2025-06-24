import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  addToCartImplementation,
  updateCartItemImplementation,
  removeFromCartImplementation,
  getCartImplementation,
  clearCartImplementation
} from '../implementations/cart-implementation';
import type { CommerceState } from '../../state';
import { CommerceStateAnnotation } from '../../state';
import { getSdk } from '@/sdk';

// Mock the SDK
jest.mock('@/sdk', () => ({
  getSdk: jest.fn()
}));

describe('Cart Actions', () => {
  let mockState: CommerceState;
  let mockSdk: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock state
    mockState = CommerceStateAnnotation.spec.default() as CommerceState;
    mockState.mode = 'b2c';
    mockState.context.currency = 'USD';
    
    // Create mock SDK
    mockSdk = {
      unified: {
        addCartLineItem: jest.fn(),
        updateCartLineItem: jest.fn(),
        removeCartLineItem: jest.fn(),
        getCart: jest.fn()
      }
    };
    
    (getSdk as jest.MockedFunction<typeof getSdk>).mockReturnValue(mockSdk);
  });

  describe('addToCartImplementation', () => {
    it('should add item to cart successfully', async () => {
      const params = {
        productId: 'prod-123',
        quantity: 2
      };

      const mockCartResponse = {
        lineItems: [
          {
            id: 'line-1',
            productId: 'prod-123',
            name: 'Test Product',
            quantity: 2,
            price: { regular: { amount: 50 } },
            image: { url: 'https://example.com/image.jpg' }
          }
        ],
        totalPrice: { amount: 100 },
        subtotalPrice: { amount: 100 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 },
        appliedCoupons: []
      };

      mockSdk.unified.addCartLineItem.mockResolvedValueOnce({ success: true });
      mockSdk.unified.getCart.mockResolvedValueOnce(mockCartResponse);

      const commands = await addToCartImplementation(params, mockState);

      expect(mockSdk.unified.addCartLineItem).toHaveBeenCalledWith({
        productId: 'prod-123',
        variantId: undefined,
        quantity: 2
      });

      expect(commands).toHaveLength(3);
      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.items).toHaveLength(1);
      expect(commands[0].payload.total).toBe(100);
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      expect(commands[1].payload.content).toContain('Added 2 Test Product to your cart!');
      
      expect(commands[2].type).toBe('UPDATE_AVAILABLE_ACTIONS');
      expect(commands[2].payload.enabled).toContain('checkout');
    });

    it('should enforce B2C quantity limits', async () => {
      const params = {
        productId: 'prod-123',
        quantity: 150 // Over B2C limit
      };

      const commands = await addToCartImplementation(params, mockState);

      expect(commands).toHaveLength(2);
      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('limited to 100 units');
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      expect(commands[1].payload.content).toContain('Failed to add item to cart');
    });

    it('should enforce B2B quantity limits', async () => {
      mockState.mode = 'b2b';
      
      const params = {
        productId: 'prod-123',
        quantity: 15000 // Over B2B limit
      };

      const commands = await addToCartImplementation(params, mockState);

      expect(commands[0].type).toBe('SET_ERROR');
      expect(commands[0].payload.message).toContain('require a custom quote');
    });
  });

  describe('updateCartItemImplementation', () => {
    it('should update cart item quantity', async () => {
      const params = {
        lineItemId: 'line-1',
        quantity: 5
      };

      const mockUpdatedCart = {
        lineItems: [
          {
            id: 'line-1',
            productId: 'prod-123',
            name: 'Test Product',
            quantity: 5,
            price: { regular: { amount: 50 } }
          }
        ],
        totalPrice: { amount: 250 },
        subtotalPrice: { amount: 250 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 }
      };

      mockSdk.unified.updateCartLineItem.mockResolvedValueOnce({ success: true });
      mockSdk.unified.getCart.mockResolvedValueOnce(mockUpdatedCart);

      const commands = await updateCartItemImplementation(params, mockState);

      expect(mockSdk.unified.updateCartLineItem).toHaveBeenCalledWith({
        lineItemId: 'line-1',
        quantity: 5
      });

      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.total).toBe(250);
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      expect(commands[1].payload.content).toContain('Updated quantity to 5');
    });

    it('should remove item when quantity is 0', async () => {
      const params = {
        lineItemId: 'line-1',
        quantity: 0
      };

      const mockEmptyCart = {
        lineItems: [],
        totalPrice: { amount: 0 },
        subtotalPrice: { amount: 0 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 }
      };

      mockSdk.unified.removeCartLineItem.mockResolvedValueOnce({ success: true });
      mockSdk.unified.getCart.mockResolvedValueOnce(mockEmptyCart);

      const commands = await updateCartItemImplementation(params, mockState);

      expect(mockSdk.unified.removeCartLineItem).toHaveBeenCalledWith({
        lineItemId: 'line-1'
      });
      
      expect(commands[1].payload.content).toContain('Item removed from cart');
    });
  });

  describe('removeFromCartImplementation', () => {
    it('should remove item from cart', async () => {
      const params = {
        lineItemId: 'line-1'
      };

      const mockCurrentCart = {
        lineItems: [
          {
            id: 'line-1',
            name: 'Product to Remove',
            productId: 'prod-123',
            quantity: 2,
            price: { regular: { amount: 50 } }
          }
        ],
        totalPrice: { amount: 100 }
      };

      const mockUpdatedCart = {
        lineItems: [],
        totalPrice: { amount: 0 },
        subtotalPrice: { amount: 0 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 }
      };

      mockSdk.unified.getCart
        .mockResolvedValueOnce(mockCurrentCart)
        .mockResolvedValueOnce(mockUpdatedCart);
      mockSdk.unified.removeCartLineItem.mockResolvedValueOnce({ success: true });

      const commands = await removeFromCartImplementation(params, mockState);

      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.items).toHaveLength(0);
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      expect(commands[1].payload.content).toContain('Removed Product to Remove from cart');
      
      // Should update available actions when cart is empty
      expect(commands[2].type).toBe('UPDATE_AVAILABLE_ACTIONS');
      expect(commands[2].payload.suggested).toContain('searchProducts');
    });
  });

  describe('getCartImplementation', () => {
    it('should display cart contents', async () => {
      const mockCart = {
        lineItems: [
          {
            id: 'line-1',
            name: 'Product 1',
            quantity: 2,
            price: { regular: { amount: 50 } }
          },
          {
            id: 'line-2',
            name: 'Product 2',
            quantity: 1,
            price: { regular: { amount: 75 } }
          }
        ],
        totalPrice: { amount: 175 },
        subtotalPrice: { amount: 175 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 },
        appliedCoupons: []
      };

      mockSdk.unified.getCart.mockResolvedValueOnce(mockCart);

      const commands = await getCartImplementation({}, mockState);

      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.items).toHaveLength(2);
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      const message = commands[1].payload.content;
      expect(message).toContain('Your Cart');
      expect(message).toContain('Product 1');
      expect(message).toContain('Quantity: 2');
      expect(message).toContain('Total: USD 175');
    });

    it('should show empty cart message', async () => {
      const mockEmptyCart = {
        lineItems: [],
        totalPrice: { amount: 0 },
        subtotalPrice: { amount: 0 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 },
        appliedCoupons: []
      };

      mockSdk.unified.getCart.mockResolvedValueOnce(mockEmptyCart);

      const commands = await getCartImplementation({}, mockState);

      expect(commands[1].payload.content).toContain('Your cart is empty');
    });

    it('should show B2B specific message', async () => {
      mockState.mode = 'b2b';
      
      const mockCart = {
        lineItems: [{ id: 'line-1', name: 'Product', quantity: 1, price: { regular: { amount: 100 } } }],
        totalPrice: { amount: 100 },
        subtotalPrice: { amount: 100 },
        totalTax: { amount: 0 },
        shippingPrice: { amount: 0 },
        appliedCoupons: []
      };

      mockSdk.unified.getCart.mockResolvedValueOnce(mockCart);

      const commands = await getCartImplementation({}, mockState);

      expect(commands[1].payload.content).toContain('Tax-exempt pricing available');
    });
  });

  describe('clearCartImplementation', () => {
    it('should require confirmation before clearing', async () => {
      const params = {
        confirm: false
      };

      const commands = await clearCartImplementation(params, mockState);

      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('ADD_MESSAGE');
      expect(commands[0].payload.content).toContain('Are you sure');
      expect(mockSdk.unified.removeCartLineItem).not.toHaveBeenCalled();
    });

    it('should clear cart when confirmed', async () => {
      const params = {
        confirm: true
      };

      const mockCart = {
        lineItems: [
          { id: 'line-1', name: 'Product 1' },
          { id: 'line-2', name: 'Product 2' }
        ]
      };

      mockSdk.unified.getCart.mockResolvedValueOnce(mockCart);
      mockSdk.unified.removeCartLineItem.mockResolvedValue({ success: true });

      const commands = await clearCartImplementation(params, mockState);

      expect(mockSdk.unified.removeCartLineItem).toHaveBeenCalledTimes(2);
      expect(mockSdk.unified.removeCartLineItem).toHaveBeenCalledWith({ lineItemId: 'line-1' });
      expect(mockSdk.unified.removeCartLineItem).toHaveBeenCalledWith({ lineItemId: 'line-2' });

      expect(commands[0].type).toBe('UPDATE_CART');
      expect(commands[0].payload.items).toEqual([]);
      expect(commands[0].payload.total).toBe(0);
      
      expect(commands[1].type).toBe('ADD_MESSAGE');
      expect(commands[1].payload.content).toContain('cart has been cleared');
      
      expect(commands[2].type).toBe('UPDATE_AVAILABLE_ACTIONS');
    });
  });
});