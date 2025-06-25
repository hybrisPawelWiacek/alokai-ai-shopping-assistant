import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';
import { withSDKErrorHandling, retrySDKOperation } from '../../utils/error-handling';

/**
 * Search products implementation using UDL
 */
export async function searchProductsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  // Parse and validate parameters
  const searchSchema = z.object({
    query: z.string(),
    filters: z.object({
      categories: z.array(z.string()).optional(),
      priceRange: z.object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional()
      }).optional(),
      brands: z.array(z.string()).optional(),
      inStock: z.boolean().optional()
    }).optional(),
    sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'name', 'rating', 'newest']).optional(),
    pagination: z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0)
    }).optional()
  });

  const validated = searchSchema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // Perform the search using the SDK with retry logic
    const sdk = getSdk();
    
    // Build filters for UDL
    const filters: any = {};
    if (validated.filters?.categories?.length) {
      filters.categoryId = validated.filters.categories;
    }
    if (validated.filters?.priceRange) {
      if (validated.filters.priceRange.min !== undefined) {
        filters.minPrice = validated.filters.priceRange.min;
      }
      if (validated.filters.priceRange.max !== undefined) {
        filters.maxPrice = validated.filters.priceRange.max;
      }
    }
    if (validated.filters?.brands?.length) {
      filters.brand = validated.filters.brands;
    }
    
    // Use retry logic for network resilience
    const searchResults = await retrySDKOperation(
      () => sdk.unified.searchProducts({
        search: validated.query,
        filter: filters,
        sort: validated.sortBy,
        pageSize: validated.pagination?.limit || 20,
        currentPage: Math.floor((validated.pagination?.offset || 0) / (validated.pagination?.limit || 20)) + 1
      }),
      {
        maxRetries: 2,
        backoffMs: 500
      }
    );

    // Success: add results
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `Found ${searchResults.pagination?.total || searchResults.products.length} products matching "${validated.query}"`,
        additional_kwargs: {
          searchResults: {
            products: searchResults.products,
            totalCount: searchResults.pagination?.total || searchResults.products.length,
            query: validated.query,
            timestamp: new Date().toISOString()
          }
        }
      })
    });

    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        lastSearch: {
          query: validated.query,
          resultCount: searchResults.products.length,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    // Handle SDK errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error(errorMessage)
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Unable to search for products: ${errorMessage}\n\nPlease try again or refine your search.`,
        additional_kwargs: {
          tool_use: {
            name: 'searchProducts',
            error: true,
            query: validated.query
          }
        }
      })
    });
  }

  return commands;
}

/**
 * Get product details implementation using UDL
 */
export async function getProductDetailsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string(),
    includeVariants: z.boolean().default(true)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // Fetch product details with error handling
    const sdk = getSdk();
    const product = await withSDKErrorHandling(
      () => sdk.unified.getProductDetails({ 
        id: validated.productId
      }),
      {
        action: 'getProductDetails',
        fallbackMessage: 'Unable to retrieve product details. The product may be unavailable or the ID may be incorrect.'
      }
    );

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `Here are the details for ${product.name}`,
        additional_kwargs: {
          productData: [{
            product,
            categoryHierarchy: product.categories || []
          }]
        }
      })
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get product details';
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error(errorMessage)
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ ${errorMessage}`,
        additional_kwargs: {
          tool_use: {
            name: 'getProductDetails',
            error: true,
            productId: validated.productId
          }
        }
      })
    });
  }

  return commands;
}

/**
 * Review-based search implementation
 * Filters products by minimum rating and review keywords
 */
export async function searchWithReviewsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    query: z.string(),
    minRating: z.number().min(0).max(5).optional(),
    reviewKeywords: z.array(z.string()).optional(),
    sortByReviews: z.boolean().optional()
  });

  const validated = schema.parse(params);
  const sdk = getSdk();
  
  // Search products first
  const searchResults = await sdk.unified.searchProducts({
    search: validated.query,
    pageSize: 50 // Get more to filter by reviews
  });
  
  // Filter and sort by reviews
  let productsWithReviews = searchResults.products;
  
  if (validated.minRating || validated.reviewKeywords || validated.sortByReviews) {
    // Filter by minimum rating
    if (validated.minRating) {
      productsWithReviews = productsWithReviews.filter(
        product => (product.rating?.average || 0) >= validated.minRating!
      );
    }
    
    // Sort by review score if requested
    if (validated.sortByReviews) {
      productsWithReviews.sort((a, b) => {
        const scoreA = (a.rating?.average || 0) * (a.rating?.count || 0);
        const scoreB = (b.rating?.average || 0) * (b.rating?.count || 0);
        return scoreB - scoreA;
      });
    }
  }
  
  return [
    {
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `Found ${productsWithReviews.length} products matching "${validated.query}"${
          validated.minRating ? ` with rating ≥ ${validated.minRating}` : ''
        }`,
        additional_kwargs: {
          searchResults: {
            products: productsWithReviews.slice(0, 20), // Return top 20
            totalCount: productsWithReviews.length,
            query: validated.query,
            filters: { minRating: validated.minRating },
            timestamp: new Date().toISOString()
          }
        }
      })
    }
  ];
}

/**
 * Find similar products implementation
 * Uses category and attributes to find similar items
 */
export async function findSimilarProductsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string(),
    limit: z.number().min(1).max(10).default(5)
  });
  
  const validated = schema.parse(params);
  const sdk = getSdk();
  
  // Get the source product details
  const sourceProduct = await sdk.unified.getProductDetails({ 
    id: validated.productId 
  });
  
  // Search for products in the same category
  const categoryIds = sourceProduct.categories?.map(c => c.id) || [];
  const similarProducts = await sdk.unified.searchProducts({
    filter: categoryIds.length > 0 ? { categoryId: categoryIds } : {},
    pageSize: validated.limit * 2 // Get extra to filter out source product
  });
  
  // Filter out the source product and limit results
  const filteredProducts = similarProducts.products
    .filter(p => p.id !== validated.productId)
    .slice(0, validated.limit);
  
  return [
    {
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `Found ${filteredProducts.length} products similar to ${sourceProduct.name}`,
        additional_kwargs: {
          similarProducts: {
            sourceProduct: {
              id: sourceProduct.id,
              name: sourceProduct.name
            },
            products: filteredProducts,
            timestamp: new Date().toISOString()
          }
        }
      })
    }
  ];
}

/**
 * Search products by category implementation
 */
export async function browseCategoryImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    categoryId: z.string(),
    filters: z.object({
      priceRange: z.object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional()
      }).optional(),
      brands: z.array(z.string()).optional(),
      inStock: z.boolean().optional()
    }).optional(),
    sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'name', 'rating', 'newest']).optional(),
    pagination: z.object({
      limit: z.number().min(1).max(100).default(20),
      page: z.number().min(1).default(1)
    }).optional()
  });

  const validated = schema.parse(params);
  const sdk = getSdk();
  
  // Build filters
  const filters: any = {
    categoryId: [validated.categoryId]
  };
  
  if (validated.filters?.priceRange) {
    if (validated.filters.priceRange.min !== undefined) {
      filters.minPrice = validated.filters.priceRange.min;
    }
    if (validated.filters.priceRange.max !== undefined) {
      filters.maxPrice = validated.filters.priceRange.max;
    }
  }
  if (validated.filters?.brands?.length) {
    filters.brand = validated.filters.brands;
  }
  
  // Get category details
  const category = await sdk.unified.getCategory({ id: validated.categoryId });
  
  // Search products in category
  const searchResults = await sdk.unified.searchProducts({
    filter: filters,
    sort: validated.sortBy,
    pageSize: validated.pagination?.limit || 20,
    currentPage: validated.pagination?.page || 1
  });
  
  return [
    {
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `Browsing ${category.name}: ${searchResults.pagination?.total || searchResults.products.length} products`,
        additional_kwargs: {
          categoryBrowse: {
            category: {
              id: category.id,
              name: category.name,
              slug: category.slug,
              breadcrumbs: category.breadcrumbs
            },
            products: searchResults.products,
            totalCount: searchResults.pagination?.total || searchResults.products.length,
            facets: searchResults.facets,
            timestamp: new Date().toISOString()
          }
        }
      })
    },
    {
      type: 'UPDATE_CONTEXT',
      payload: {
        currentCategory: {
          id: category.id,
          name: category.name
        }
      }
    }
  ];
}