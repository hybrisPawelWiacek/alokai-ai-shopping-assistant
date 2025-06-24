import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  searchProductsImplementation,
  getProductDetailsImplementation,
  findSimilarProductsImplementation,
  filterProductsImplementation,
  searchByReviewsImplementation
} from '../implementations/search-implementation';
import { createTestState, createTestSDK, TestFixtures } from '../../testing/test-utils';
import type { CommerceState } from '../../state';

describe('Search Actions', () => {
  let mockState: CommerceState;
  let mockSDK: ReturnType<typeof createTestSDK>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = createTestState({
      mode: 'b2c',
      searchResults: []
    });
    mockSDK = createTestSDK();
  });

  describe('searchProductsImplementation', () => {
    it('should search products using UDL', async () => {
      const mockProducts = {
        products: TestFixtures.products,
        total: 2,
        currentPage: 1,
        pageSize: 20
      };

      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue(mockProducts);

      const result = await searchProductsImplementation(
        { query: 'test product', limit: 20 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledWith({
        search: 'test product',
        pageSize: 20,
        currentPage: 1
      });

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should apply filters when provided', async () => {
      const filters = {
        category: ['electronics'],
        minPrice: 50,
        maxPrice: 200
      };

      await searchProductsImplementation(
        { query: 'laptop', filters, limit: 10 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledWith({
        search: 'laptop',
        filter: {
          category: ['electronics'],
          price: { min: 50, max: 200 }
        },
        pageSize: 10,
        currentPage: 1
      });
    });

    it('should handle sorting options', async () => {
      await searchProductsImplementation(
        { query: 'shoes', sortBy: 'price-asc' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledWith({
        search: 'shoes',
        sort: { field: 'price', order: 'asc' },
        pageSize: 20,
        currentPage: 1
      });
    });

    it('should use B2B search for B2B mode', async () => {
      mockState.mode = 'b2b';
      mockSDK.customExtension.searchProductsB2B = jest.fn().mockResolvedValue({
        products: TestFixtures.products,
        total: 2
      });

      await searchProductsImplementation(
        { query: 'bulk items' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.searchProductsB2B).toHaveBeenCalled();
      expect(mockSDK.unified.searchProducts).not.toHaveBeenCalled();
    });

    it('should handle empty results gracefully', async () => {
      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: [],
        total: 0
      });

      const result = await searchProductsImplementation(
        { query: 'nonexistent product' },
        { state: mockState, sdk: mockSDK }
      );

      expect(result.products).toHaveLength(0);
      expect(result.message).toContain('No products found');
    });

    it('should respect result limit', async () => {
      const manyProducts = Array(50).fill(null).map((_, i) => ({
        ...TestFixtures.products[0],
        id: `prod-${i}`,
        name: `Product ${i}`
      }));

      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: manyProducts,
        total: 50
      });

      const result = await searchProductsImplementation(
        { query: 'test', limit: 5 },
        { state: mockState, sdk: mockSDK }
      );

      expect(result.products).toHaveLength(5);
    });
  });

  describe('getProductDetailsImplementation', () => {
    it('should fetch product details by ID', async () => {
      const mockProduct = {
        ...TestFixtures.products[0],
        description: 'Detailed description',
        images: ['image1.jpg', 'image2.jpg']
      };

      mockSDK.unified.getProductDetails = jest.fn().mockResolvedValue(mockProduct);

      const result = await getProductDetailsImplementation(
        { productId: 'prod-1' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.getProductDetails).toHaveBeenCalledWith({
        id: 'prod-1'
      });
      expect(result.product).toEqual(mockProduct);
    });

    it('should fetch product details by SKU', async () => {
      await getProductDetailsImplementation(
        { sku: 'SKU-001' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.getProductDetails).toHaveBeenCalledWith({
        sku: 'SKU-001'
      });
    });

    it('should include B2B pricing for B2B mode', async () => {
      mockState.mode = 'b2b';
      const mockB2BProduct = {
        ...TestFixtures.products[0],
        bulkPricing: [
          { minQuantity: 10, price: 89.99 },
          { minQuantity: 50, price: 79.99 }
        ]
      };

      mockSDK.unified.getProductDetails = jest.fn().mockResolvedValue(TestFixtures.products[0]);
      mockSDK.customExtension.getB2BProductDetails = jest.fn().mockResolvedValue(mockB2BProduct);

      const result = await getProductDetailsImplementation(
        { productId: 'prod-1' },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.getB2BProductDetails).toHaveBeenCalled();
      expect(result.product.bulkPricing).toBeDefined();
    });

    it('should handle product not found', async () => {
      mockSDK.unified.getProductDetails = jest.fn().mockRejectedValue(
        new Error('Product not found')
      );

      await expect(
        getProductDetailsImplementation(
          { productId: 'nonexistent' },
          { state: mockState, sdk: mockSDK }
        )
      ).rejects.toThrow('Product not found');
    });
  });

  describe('findSimilarProductsImplementation', () => {
    it('should find similar products', async () => {
      const similarProducts = [
        { ...TestFixtures.products[1], similarity: 0.9 }
      ];

      mockSDK.customExtension.findSimilarProducts = jest.fn().mockResolvedValue({
        products: similarProducts
      });

      const result = await findSimilarProductsImplementation(
        { productId: 'prod-1', limit: 5 },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.customExtension.findSimilarProducts).toHaveBeenCalledWith({
        productId: 'prod-1',
        limit: 5
      });
      expect(result.similarProducts).toHaveLength(1);
    });

    it('should handle no similar products found', async () => {
      mockSDK.customExtension.findSimilarProducts = jest.fn().mockResolvedValue({
        products: []
      });

      const result = await findSimilarProductsImplementation(
        { productId: 'unique-product' },
        { state: mockState, sdk: mockSDK }
      );

      expect(result.similarProducts).toHaveLength(0);
      expect(result.message).toContain('No similar products');
    });
  });

  describe('searchByReviewsImplementation', () => {
    it('should search products by review criteria', async () => {
      const highRatedProducts = [
        { ...TestFixtures.products[0], rating: 4.5, reviewCount: 120 }
      ];

      mockSDK.unified.searchProducts = jest.fn().mockResolvedValue({
        products: highRatedProducts,
        total: 1
      });

      const result = await searchByReviewsImplementation(
        { minRating: 4.0, keywords: ['quality', 'durable'] },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledWith({
        filter: {
          rating: { min: 4.0 }
        },
        search: 'quality durable reviews',
        pageSize: 20,
        currentPage: 1
      });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].rating).toBeGreaterThanOrEqual(4.0);
    });

    it('should sort by review count when specified', async () => {
      await searchByReviewsImplementation(
        { sortByReviewCount: true },
        { state: mockState, sdk: mockSDK }
      );

      expect(mockSDK.unified.searchProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: { field: 'reviewCount', order: 'desc' }
        })
      );
    });
  });

  describe('Performance', () => {
    it('should complete search within 100ms', async () => {
      const start = Date.now();
      
      await searchProductsImplementation(
        { query: 'test' },
        { state: mockState, sdk: mockSDK }
      );
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should cache repeated searches', async () => {
      // First call
      await searchProductsImplementation(
        { query: 'cached query' },
        { state: mockState, sdk: mockSDK }
      );

      // Second call with same query
      await searchProductsImplementation(
        { query: 'cached query' },
        { state: mockState, sdk: mockSDK }
      );

      // Should only call SDK once due to caching
      expect(mockSDK.unified.searchProducts).toHaveBeenCalledTimes(1);
    });
  });
});