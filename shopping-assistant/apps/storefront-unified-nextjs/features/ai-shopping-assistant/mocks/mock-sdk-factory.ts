/**
 * Centralized mock SDK factory that follows Alokai UDL patterns
 * This provides a consistent interface for all mock implementations
 * Replace mock calls with real SDK calls when integrating with backend
 */

import { mockCustomExtension } from './custom-extension-mock';
import type {
  UDLSearchResponse,
  UDLProductDetails,
  UDLCart,
  UDLCustomer,
  UDLShippingMethod,
  MockSdkConfig
} from '../types/mock-responses';

/**
 * Mock implementation of Alokai Unified Data Layer methods
 * All responses follow the exact UDL structure
 */
const createMockUnified = (config?: MockSdkConfig) => ({
  /**
   * Search for products
   * TODO: Replace with real sdk.unified.searchProducts()
   */
  searchProducts: async (params: {
    search?: string;
    categoryId?: string;
    filter?: Array<{ attribute: string; in?: string[]; eq?: string }>;
    sort?: { attribute: string; order: 'asc' | 'desc' };
    pageSize?: number;
    currentPage?: number;
  }): Promise<UDLSearchResponse> => {
    const delay = config?.delays?.search?.min || 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Mock implementation would filter/sort based on params
    // For now, return sample data
    const response: UDLSearchResponse = {
      products: [
        {
          id: 'prod-001',
          sku: 'SKU-001',
          name: 'Wireless Bluetooth Headphones',
          slug: 'wireless-bluetooth-headphones',
          price: {
            value: { amount: 149.99, currency: 'USD', precisionAmount: '14999' },
            isDiscounted: true,
            regular: { amount: 149.99, currency: 'USD' },
            special: { amount: 119.99, currency: 'USD' }
          },
          primaryImage: { 
            url: 'https://storage.example.com/products/headphones.jpg',
            alt: 'Wireless Bluetooth Headphones'
          },
          rating: { average: 4.5, count: 234 },
          inventory: { isInStock: true },
          categories: [
            { id: 'cat-electronics', name: 'Electronics', slug: 'electronics' }
          ]
        }
      ],
      pagination: {
        page: params.currentPage || 1,
        perPage: params.pageSize || 20,
        total: 45,
        totalPages: 3
      },
      facets: [
        {
          name: 'category',
          label: 'Category',
          type: 'multi-select',
          values: [
            { value: 'cat-electronics', label: 'Electronics', count: 25 }
          ]
        }
      ]
    };
    
    return response;
  },

  /**
   * Get product details
   * TODO: Replace with real sdk.unified.getProductDetails()
   */
  getProductDetails: async (params: { id?: string; sku?: string }): Promise<UDLProductDetails> => {
    const delay = config?.delays?.productDetails?.min || 80;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const product: UDLProductDetails = {
      id: params.id || 'prod-001',
      sku: params.sku || 'SKU-001',
      name: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      description: 'Experience superior sound quality...',
      price: {
        value: { amount: 249.99, currency: 'USD', precisionAmount: '24999' },
        isDiscounted: true,
        regular: { amount: 249.99, currency: 'USD' },
        special: { amount: 199.99, currency: 'USD' }
      },
      primaryImage: { 
        url: 'https://storage.example.com/products/headphones-detail.jpg',
        alt: 'Premium Wireless Headphones'
      },
      gallery: [
        { url: 'https://storage.example.com/products/headphones-1.jpg', alt: 'Side view' },
        { url: 'https://storage.example.com/products/headphones-2.jpg', alt: 'Folded view' }
      ],
      rating: { average: 4.6, count: 1234 },
      inventory: { 
        isInStock: true,
        availableQuantity: 156
      },
      categories: [
        { 
          id: 'cat-electronics', 
          name: 'Electronics', 
          slug: 'electronics',
          breadcrumbs: [
            { id: 'root', name: 'Home', slug: '/' },
            { id: 'cat-electronics', name: 'Electronics', slug: 'electronics' }
          ]
        }
      ],
      attributes: {
        brand: 'AudioTech Pro',
        color: 'Midnight Black',
        batteryLife: '30 hours'
      },
      variants: [
        {
          id: 'var-001',
          sku: 'SKU-001-BLK',
          name: 'Midnight Black',
          attributes: { color: 'Black' },
          price: { regular: { amount: 249.99 } },
          inventory: { isInStock: true }
        }
      ]
    };
    
    return product;
  },

  /**
   * Get current cart
   * TODO: Replace with real sdk.unified.getCart()
   */
  getCart: async (): Promise<UDLCart> => {
    const delay = config?.delays?.cart?.min || 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const cart: UDLCart = {
      id: 'cart-' + Date.now(),
      lineItems: [
        {
          id: 'item-1',
          productId: 'prod-001',
          variantId: 'var-001',
          sku: 'SKU-001',
          name: 'Wireless Headphones',
          quantity: 2,
          price: {
            regular: { amount: 149.99, currency: 'USD' },
            special: { amount: 119.99, currency: 'USD' }
          },
          image: { url: 'https://storage.example.com/products/headphones.jpg' }
        }
      ],
      totalPrice: { amount: 239.98, currency: 'USD' },
      subtotalPrice: { amount: 239.98, currency: 'USD' },
      totalTax: { amount: 20.40, currency: 'USD' },
      shippingPrice: { amount: 0, currency: 'USD' },
      appliedCoupons: []
    };
    
    return cart;
  },

  /**
   * Add item to cart
   * TODO: Replace with real sdk.unified.addCartLineItem()
   */
  addCartLineItem: async (params: {
    product: {
      productId: string;
      variantId?: string;
      sku?: string;
      quantity: number;
    }
  }) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      cart: await createMockUnified().getCart()
    };
  },

  /**
   * Update cart item
   * TODO: Replace with real sdk.unified.updateCartLineItem()
   */
  updateCartLineItem: async (params: {
    lineItemId: string;
    quantity: number;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    return {
      success: true,
      cart: await createMockUnified().getCart()
    };
  },

  /**
   * Remove cart item
   * TODO: Replace with real sdk.unified.removeCartLineItem()
   */
  removeCartLineItem: async (params: {
    lineItemId: string;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 80));
    
    return {
      success: true,
      cart: await createMockUnified().getCart()
    };
  },

  /**
   * Get customer details
   * TODO: Replace with real sdk.unified.getCustomer()
   */
  getCustomer: async () => {
    await new Promise(resolve => setTimeout(resolve, 60));
    
    return {
      id: 'cust-001',
      email: 'business@example.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Example Corp',
      isB2B: true,
      creditLimit: 50000,
      taxExempt: false
    };
  },

  /**
   * Get shipping methods
   * TODO: Replace with real sdk.unified.getShippingMethods()
   */
  getShippingMethods: async () => {
    await new Promise(resolve => setTimeout(resolve, 70));
    
    return {
      methods: [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: '5-7 business days',
          price: { amount: 9.99, currency: 'USD' }
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: '2-3 business days',
          price: { amount: 19.99, currency: 'USD' }
        },
        {
          id: 'freight',
          name: 'Freight Shipping',
          description: 'For bulk orders',
          price: { amount: 0, currency: 'USD' },
          note: 'Contact for quote'
        }
      ]
    };
  }
});

/**
 * Create mock SDK instance with all integrations
 */
export const createMockSdk = () => ({
  // Unified Data Layer methods
  unified: createMockUnified(),
  
  // Custom extension methods (B2B, recommendations, etc.)
  customExtension: mockCustomExtension,
  
  // CMS integration (if needed)
  contentful: {
    getEntry: async (id: string) => ({ id, title: 'Mock Content' })
  },
  
  // Unified CMS (if needed)
  unifiedCms: {
    getPage: async (slug: string) => ({ slug, content: 'Mock Page' })
  }
});

/**
 * Type definitions for the mock SDK
 */
export type MockSdk = ReturnType<typeof createMockSdk>;
export type MockUnified = ReturnType<typeof createMockUnified>;

/**
 * Helper to simulate network errors
 */
export const simulateNetworkError = async (probability: number = 0.1) => {
  if (Math.random() < probability) {
    throw new Error('Network error: Unable to fetch data');
  }
};

/**
 * Helper to simulate slow network
 */
export const simulateSlowNetwork = async (minMs: number = 100, maxMs: number = 500) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
};