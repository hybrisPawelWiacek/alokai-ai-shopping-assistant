import { QueryClient } from '@tanstack/react-query';
import { Sdk } from '@/sdk/sdk.server';

import {
  AddToCartPayload,
  AssistantAction,
  GetProductPayload,
  SearchProductsPayload,
  UpdateCartPayload,
  UIComponentType
} from './types';

type ActionResponse = {
  content: string;
  ui?: {
    component: UIComponentType;
    data: any;
  };
  productData?: Array<{
    categoryHierarchy: string[];
    product: any;
    productUrl: string;
  }>;
};

type ActionExecuteParams = {
  sdk?: Sdk;
  payload?: any;
  queryClient?: QueryClient;
};

type ActionConfig = {
  description: string;
  parameters: Record<string, string>;
  ui?: { component: UIComponentType };
  execute: (params: ActionExecuteParams) => Promise<any>;
  formatResponse: (result: any, action?: AssistantAction) => ActionResponse;
};



// SDK implementation of the actions
const executeAddToCart = async ({ sdk, payload, queryClient = null }: { sdk?: Sdk; payload?: AddToCartPayload; queryClient?: QueryClient }): Promise<void> => {
  await sdk.unified.addCartLineItem({
    productId: payload.productId,
    quantity: payload.quantity,
    sku: payload.productId,
  });
  queryClient.invalidateQueries({ queryKey: ['cart'] });
};

const executeGetProduct = async ({ sdk, payload }: { sdk?: Sdk; payload?: GetProductPayload }) => {
  return sdk.unified.getProductDetails({
    id: payload.productId,
  });
};

const executeUpdateCart = async ({ sdk, payload, queryClient = null }: { sdk?: Sdk; payload?: UpdateCartPayload; queryClient?: QueryClient }): Promise<void> => {
  await sdk.unified.updateCartLineItem({
    lineItemId: payload.lineItemId,
    quantity: payload.quantity,
  });
  queryClient.invalidateQueries({ queryKey: ['cart'] });
};

const executeGetCart = async ({ sdk }: { sdk?: Sdk }) => {
  const cart = await sdk.unified.getCart();
  return {
    lineItems: cart.lineItems.map(item => ({
      id: item.id,
      lineItemId: item.id,
      productId: item.productId,
      quantity: item.quantity,
      name: item.name || 'Product',
      price: item.totalPrice.amount
    })),
    total: cart.totalPrice.amount
  };
};

const executeCheckout = async (): Promise<void> => {
  // Implementation depends on your checkout flow
  console.log('Initiating checkout process');
};

const executeSearchProducts = async ({ sdk, payload }: { sdk?: Sdk; payload?: SearchProductsPayload }) => {
  const { limit = 10, query } = payload;
  const searchResults = await sdk.unified.searchProducts({
    pageSize: limit,
    search: query,
  });

  if (!searchResults?.products?.length) {
    return {
      searchResults: {
        products: [],
        totalResults: 0,
      },
    };
  }

  return {
    searchResults: {
      products: searchResults.products,
      totalResults: searchResults.products.length,
    },
  };
};

const executeRemoveFromCart = async ({ sdk, payload, queryClient = null }: { sdk?: Sdk; payload?: { lineItemId: string }; queryClient?: QueryClient }): Promise<void> => {
  await sdk.unified.removeCartLineItem({
    lineItemId: payload.lineItemId,
  });
  queryClient.invalidateQueries({ queryKey: ['cart'] });
};


// Action definitions used by the AI assistant to understand available operations
export const actions: Record<string, ActionConfig> = {
  ADD_TO_CART: {
    description: 'Add products to the cart',
    parameters: {
      productId: 'ID of the product to add',
      quantity: 'Number of items to add',
      sku: 'Product SKU (optional)'
    },
    ui: {
      component: 'CartPreview' as UIComponentType
    },
    execute: executeAddToCart,
    formatResponse: (cart) => ({
      content: `Item added to cart. Your cart now has ${cart.lineItems.length} item(s) with a total of ${cart.total}.`,
      ui: {
        component: 'CartPreview',
        data: {
          items: cart.lineItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price
          })),
          total: cart.total
        }
      }
    })
  },
  GET_CART: {
    description: 'Get the current cart contents',
    parameters: {},
    ui: {
      component: 'CartPreview' as UIComponentType
    },
    execute: executeGetCart,
    formatResponse: (cart) => ({
      content: `Your cart has ${cart.lineItems.length} item(s) with a total of ${cart.total}.`,
      ui: {
        component: 'CartPreview',
        data: {
          items: cart.lineItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price
          })),
          total: cart.total
        }
      }
    })
  },
  GET_PRODUCT: {
    description: 'Get detailed product information',
    parameters: {
      productId: 'ID of the product to retrieve'
    },
    ui: {
      component: 'ProductGrid' as UIComponentType
    },
    execute: executeGetProduct,
    formatResponse: (result) => {
      const productSlug = result.product.slug || `${result.product.id}-${result.product.name.toLowerCase().replace(/ /g, '-')}`;
      return {
        content: `Here's the product information for ${result.product.name}.`,
        ui: {
          component: 'ProductGrid',
          data: {
            products: [{
              id: result.product.id,
              name: result.product.name,
              images: [{ url: result.product.primaryImage?.url || '' }],
              price: {
                regular: result.product.price.value.amount,
              },
            }]
          }
        },
        productData: [{
          categoryHierarchy: result.categoryHierarchy || [],
          product: {
            ...result.product,
            slug: productSlug
          },
          productUrl: `/product/${productSlug}/${result.product.id}?sku=${result.product.sku}`
        }]
      };
    }
  },
  UPDATE_CART: {
    description: 'Update quantities of items in the cart',
    parameters: {
      lineItemId: 'ID of the cart line item',
      quantity: 'New quantity for the item'
    },
    ui: {
      component: 'CartPreview' as UIComponentType
    },
    execute: executeUpdateCart,
    formatResponse: (cart) => ({
      content: `Cart updated. Your cart now has ${cart.lineItems.length} item(s) with a total of ${cart.total}.`,
      ui: {
        component: 'CartPreview',
        data: {
          items: cart.lineItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price
          })),
          total: cart.total
        }
      }
    })
  },
  REMOVE_FROM_CART: {
    description: 'Remove an item from the cart',
    parameters: {
      lineItemId: 'ID of the cart line item to remove'
    },
    ui: {
      component: 'CartPreview' as UIComponentType
    },
    execute: executeRemoveFromCart,
    formatResponse: (cart) => ({
      content: `Item removed from cart. Your cart now has ${cart.lineItems.length} item(s) with a total of ${cart.total}.`,
      ui: {
        component: 'CartPreview',
        data: {
          items: cart.lineItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price
          })),
          total: cart.total
        }
      }
    })
  },
  UPDATE_CART_ITEM: {
    description: 'Update a cart item\'s quantity',
    parameters: {
      lineItemId: 'ID of the cart line item',
      quantity: 'New quantity for the item'
    },
    ui: {
      component: 'CartPreview' as UIComponentType
    },
    execute: executeUpdateCart,
    formatResponse: (cart) => ({
      content: `Cart updated. Your cart now has ${cart.lineItems.length} item(s) with a total of ${cart.total}.`,
      ui: {
        component: 'CartPreview',
        data: {
          items: cart.lineItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            name: item.name,
            price: item.price
          })),
          total: cart.total
        }
      }
    })
  },
  CHECKOUT: {
    description: 'Start the checkout process',
    parameters: {},
    execute: executeCheckout,
    formatResponse: () => ({
      content: 'Initiating checkout process...'
    })
  },
  SEARCH_PRODUCTS: {
    description: 'Search for products by query',
    parameters: {
      query: 'Search query string'
    },
    ui: {
      component: 'SearchResults' as UIComponentType
    },
    execute: executeSearchProducts,
    formatResponse: (result, action) => {
      console.log('Raw search result:', JSON.stringify(result, null, 2));
      console.log('Action:', JSON.stringify(action, null, 2));

      const products = result.searchResults.products.map(product => {
        const slug = product.slug || `${product.id}-${product.name.toLowerCase().replace(/ /g, '-')}`;
        const productUrl = `/product/${slug}/${product.id}?sku=${product.sku}`;
        
        return {
          id: product.id,
          name: product.name,
          slug,
          url: productUrl,
          sku: product.sku,
          images: [{ 
            url: product.primaryImage?.url || '/placeholder-image.jpg',
            alt: product.name 
          }],
          price: {
            regular: product.price.value.amount,
            special: product.price.isDiscounted ? product.price.value.amount : undefined
          }
        };
      });

      // Get query from action payload since it's not in searchResults
      const query = action?.payload?.query || '';

      const productsList = products
        .map(p => `- ${p.name} (ID: ${p.id}, SKU: ${p.sku})`)
        .join('\n');

      return {
        content: `Found ${products.length} products matching your search${query ? ` for "${query}"` : ''}:\n\n${productsList}`,
        ui: {
          component: 'SearchResults',
          data: { 
            products,
            productsCount: products.length,
            query,
            totalResults: result.searchResults.total || products.length
          }
        }
      };
    }
  }
};

// Create SDK actions executor
export const createSDKActions = (sdk: Sdk, queryClient: QueryClient) => {
  const executeAction = async (action: AssistantAction) => {
    console.log('[executeAction] Executing action:', action);
    try {
      if (!actions[action.type]?.execute) {
        throw new Error(`Unknown action type: ${action.type}`);
      }

      // Get required parameters (those without '(optional)' in description)
      const requiredParams = Object.entries(actions[action.type].parameters)
        .filter(([_, desc]) => !desc.includes('(optional)'))
        .map(([param]) => param);
      const missingParams = requiredParams.filter(param => !action.payload?.[param]);
      
      if (missingParams.length > 0) {
        throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
      }

      const result = await actions[action.type].execute({
        sdk,
        payload: action.payload,
        queryClient
      });

      if (!result && action.type !== 'CHECKOUT') {
        throw new Error('Operation completed but no data was returned');
      }

      return result;
    } catch (error) {
      console.error('[executeAction] Error:', error);
      if (error instanceof Error && error.message.includes('UnknownIdentifierError')) {
        throw new Error(`Product not found. Please check if the product ID is correct.`);
      }
      throw error;
    }
  };

  return { executeAction };
};
