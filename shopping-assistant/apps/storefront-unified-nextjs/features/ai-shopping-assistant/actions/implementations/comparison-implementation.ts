import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';
import { IntentPredictor } from '../../intelligence';

/**
 * Product comparison action implementations
 */

export async function compareProductsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productIds: z.array(z.string()).min(2).max(5),
    attributes: z.array(
      z.enum(['price', 'features', 'specifications', 'ratings', 'availability', 'warranty', 'dimensions'])
    ).optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Fetch details for all products
    const productPromises = validated.productIds.map(id => 
      sdk.unified.getProductDetails({ id })
    );
    const products = await Promise.all(productPromises);

    // Build comparison matrix
    const comparisonMatrix = buildComparisonMatrix(products, validated.attributes);
    
    // Generate AI recommendation based on intent
    const recommendation = generateRecommendation(products, state);

    // Update comparison state
    commands.push({
      type: 'UPDATE_COMPARISON',
      payload: {
        items: products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price.regular.amount,
          image: p.images?.[0]?.url
        })),
        lastComparisonResult: comparisonMatrix,
        lastUpdated: new Date().toISOString()
      }
    });

    // Format comparison response
    let response = '📊 **Product Comparison**\n\n';
    
    // Add product names
    response += '**Products:**\n';
    products.forEach((product, index) => {
      response += `${index + 1}. ${product.name} - ${state.context.currency} ${product.price.regular.amount}\n`;
    });
    response += '\n';

    // Add key differences
    response += '**Key Differences:**\n';
    const differences = findKeyDifferences(comparisonMatrix);
    differences.forEach(diff => {
      response += `• ${diff}\n`;
    });
    response += '\n';

    // Add recommendation
    response += `**Recommendation:**\n${recommendation.summary}\n`;
    
    if (state.mode === 'b2b') {
      response += '\n💼 *For bulk orders, contact sales for volume pricing on any of these products.*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'compareProducts',
            result: {
              comparisonMatrix,
              recommendation,
              productCount: products.length
            }
          }
        }
      })
    });

    // Update available actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['addToCart', 'getProductDetails', 'clearComparison'],
        suggested: [`addToCart:${recommendation.productId}`, 'askFollowUpQuestion']
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to compare products')
    });
  }

  return commands;
}

export async function addToComparisonImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // Check if already in comparison
    if (state.comparison.items.some(item => item.id === validated.productId)) {
      commands.push({
        type: 'ADD_MESSAGE',
        payload: new AIMessage({
          content: '⚠️ This product is already in your comparison list',
          additional_kwargs: {
            tool_use: {
              name: 'addToComparison',
              result: { alreadyExists: true }
            }
          }
        })
      });
      return commands;
    }

    // Check comparison limit
    if (state.comparison.items.length >= 5) {
      commands.push({
        type: 'ADD_MESSAGE',
        payload: new AIMessage({
          content: '⚠️ You can compare up to 5 products at a time. Please remove a product first.',
          additional_kwargs: {
            tool_use: {
              name: 'addToComparison',
              result: { limitReached: true }
            }
          }
        })
      });
      return commands;
    }

    const sdk = getSdk();
    const product = await sdk.unified.getProductDetails({ id: validated.productId });

    // Update comparison state
    const updatedItems = [...state.comparison.items, {
      id: product.id,
      name: product.name,
      price: product.price.regular.amount,
      image: product.images?.[0]?.url
    }];

    commands.push({
      type: 'UPDATE_COMPARISON',
      payload: {
        items: updatedItems,
        lastUpdated: new Date().toISOString()
      }
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `✅ Added "${product.name}" to comparison. You're now comparing ${updatedItems.length} products.`,
        additional_kwargs: {
          tool_use: {
            name: 'addToComparison',
            result: {
              success: true,
              productName: product.name,
              comparisonCount: updatedItems.length
            }
          }
        }
      })
    });

    // Suggest comparison when we have enough items
    if (updatedItems.length >= 2) {
      commands.push({
        type: 'UPDATE_AVAILABLE_ACTIONS',
        payload: {
          enabled: ['compareProducts', 'removeFromComparison'],
          suggested: ['compareProducts']
        }
      });
    }

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to add to comparison')
    });
  }

  return commands;
}

export async function removeFromComparisonImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const itemToRemove = state.comparison.items.find(item => item.id === validated.productId);
    
    if (!itemToRemove) {
      commands.push({
        type: 'ADD_MESSAGE',
        payload: new AIMessage({
          content: '⚠️ This product is not in your comparison list',
          additional_kwargs: {
            tool_use: {
              name: 'removeFromComparison',
              result: { notFound: true }
            }
          }
        })
      });
      return commands;
    }

    // Remove from comparison
    const updatedItems = state.comparison.items.filter(item => item.id !== validated.productId);

    commands.push({
      type: 'UPDATE_COMPARISON',
      payload: {
        items: updatedItems,
        lastUpdated: new Date().toISOString()
      }
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `✅ Removed "${itemToRemove.name}" from comparison. ${updatedItems.length} products remaining.`,
        additional_kwargs: {
          tool_use: {
            name: 'removeFromComparison',
            result: {
              success: true,
              removedProduct: itemToRemove.name,
              remainingCount: updatedItems.length
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to remove from comparison')
    });
  }

  return commands;
}

export async function getComparisonListImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    const { items } = state.comparison;
    
    let response = '📊 **Comparison List**\n\n';
    
    if (items.length === 0) {
      response += 'Your comparison list is empty.';
    } else {
      response += `Comparing ${items.length} products:\n\n`;
      items.forEach((item, index) => {
        response += `${index + 1}. ${item.name} - ${state.context.currency} ${item.price}\n`;
      });
      
      if (items.length >= 2) {
        response += '\n💡 Ready to compare these products? Use the compare action.';
      } else {
        response += '\n💡 Add at least one more product to start comparing.';
      }
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getComparisonList',
            result: {
              count: items.length,
              items: items.map(i => ({ name: i.name, price: i.price }))
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to get comparison list')
    });
  }

  return commands;
}

export async function clearComparisonImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    const previousCount = state.comparison.items.length;

    commands.push({
      type: 'UPDATE_COMPARISON',
      payload: {
        items: [],
        lastComparisonResult: null,
        lastUpdated: new Date().toISOString()
      }
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `✅ Cleared comparison list. Removed ${previousCount} products.`,
        additional_kwargs: {
          tool_use: {
            name: 'clearComparison',
            result: {
              success: true,
              clearedCount: previousCount
            }
          }
        }
      })
    });

    // Update available actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['search', 'browse'],
        suggested: ['searchProducts']
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to clear comparison')
    });
  }

  return commands;
}

/**
 * Helper functions
 */

function buildComparisonMatrix(products: any[], attributes?: string[]): Record<string, any> {
  const matrix: Record<string, any> = {};
  
  // Default attributes if not specified
  const compareAttributes = attributes || ['price', 'features', 'ratings', 'availability'];
  
  compareAttributes.forEach(attr => {
    matrix[attr] = {};
    products.forEach(product => {
      switch (attr) {
        case 'price':
          matrix[attr][product.id] = {
            regular: product.price.regular.amount,
            special: product.price.special?.amount,
            currency: product.price.regular.currency
          };
          break;
        case 'features':
          matrix[attr][product.id] = product.features || [];
          break;
        case 'ratings':
          matrix[attr][product.id] = {
            average: product.rating?.average || 'N/A',
            count: product.rating?.count || 0
          };
          break;
        case 'availability':
          matrix[attr][product.id] = product.inventory?.isInStock ? 'In Stock' : 'Out of Stock';
          break;
        case 'specifications':
          matrix[attr][product.id] = product.specifications || {};
          break;
        case 'warranty':
          matrix[attr][product.id] = product.warranty || 'Standard warranty';
          break;
        case 'dimensions':
          matrix[attr][product.id] = product.dimensions || 'Not specified';
          break;
      }
    });
  });
  
  return matrix;
}

function findKeyDifferences(matrix: Record<string, any>): string[] {
  const differences: string[] = [];
  
  // Price differences
  if (matrix.price) {
    const prices = Object.values(matrix.price).map((p: any) => p.regular);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (maxPrice - minPrice > 0) {
      const priceDiff = ((maxPrice - minPrice) / minPrice * 100).toFixed(0);
      differences.push(`Price varies by ${priceDiff}% (${minPrice} - ${maxPrice})`);
    }
  }
  
  // Availability differences
  if (matrix.availability) {
    const availabilities = Object.values(matrix.availability);
    const inStockCount = availabilities.filter(a => a === 'In Stock').length;
    if (inStockCount > 0 && inStockCount < availabilities.length) {
      differences.push(`${inStockCount} of ${availabilities.length} products are in stock`);
    }
  }
  
  // Rating differences
  if (matrix.ratings) {
    const ratings = Object.values(matrix.ratings)
      .map((r: any) => r.average)
      .filter(r => r !== 'N/A');
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      differences.push(`Average rating: ${avgRating.toFixed(1)} stars`);
    }
  }
  
  return differences;
}

function generateRecommendation(products: any[], state: CommerceState): { productId: string; summary: string } {
  // Use intent predictor to understand user preferences
  const predictedIntents = IntentPredictor.predictNextIntent(state);
  
  // Simple recommendation logic (can be enhanced with ML)
  let recommendedProduct = products[0];
  let reason = 'balanced features and price';
  
  // Price-conscious recommendation
  if (predictedIntents.some(i => i.intent === 'price_sensitive')) {
    recommendedProduct = products.reduce((min, p) => 
      p.price.regular.amount < min.price.regular.amount ? p : min
    );
    reason = 'best value for money';
  }
  
  // Quality-focused recommendation
  if (predictedIntents.some(i => i.intent === 'quality_focused')) {
    recommendedProduct = products.reduce((best, p) => {
      const currentRating = p.rating?.average || 0;
      const bestRating = best.rating?.average || 0;
      return currentRating > bestRating ? p : best;
    });
    reason = 'highest customer ratings';
  }
  
  // B2B bulk recommendation
  if (state.mode === 'b2b') {
    // Prefer products with better bulk availability
    recommendedProduct = products.find(p => p.inventory?.availableQuantity > 100) || recommendedProduct;
    reason = 'best availability for bulk orders';
  }
  
  return {
    productId: recommendedProduct.id,
    summary: `Based on your ${state.mode === 'b2b' ? 'business needs' : 'preferences'}, I recommend "${recommendedProduct.name}" for ${reason}.`
  };
}