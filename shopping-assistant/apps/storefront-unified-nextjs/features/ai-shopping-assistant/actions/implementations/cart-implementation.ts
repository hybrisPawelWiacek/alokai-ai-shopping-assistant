import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';

/**
 * Cart action implementations with B2B/B2C mode awareness
 */

export async function addToCartImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1).max(999).default(1)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // B2B vs B2C quantity validation
    if (state.mode === 'b2c' && validated.quantity > 100) {
      throw new Error('B2C customers are limited to 100 units per item');
    } else if (state.mode === 'b2b' && validated.quantity > 10000) {
      throw new Error('B2B orders exceeding 10,000 units require a custom quote');
    }

    // Get SDK instance
    const sdk = getSdk();
    
    // Add to cart via SDK
    const cartResponse = await sdk.unified.addCartLineItem({
      productId: validated.productId,
      variantId: validated.variantId,
      quantity: validated.quantity
    });

    // Get updated cart details
    const updatedCart = await sdk.unified.getCart();

    // Find the added item for confirmation
    const addedItem = updatedCart.lineItems?.find(
      item => item.productId === validated.productId && 
              item.variantId === validated.variantId
    );

    // Update state with new cart data
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        items: updatedCart.lineItems?.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price.regular.amount,
          image: item.image?.url
        })) || [],
        total: updatedCart.totalPrice.amount,
        subtotal: updatedCart.subtotalPrice.amount,
        tax: updatedCart.totalTax?.amount || 0,
        shipping: updatedCart.shippingPrice?.amount || 0,
        appliedCoupons: updatedCart.appliedCoupons || [],
        lastUpdated: new Date().toISOString()
      }
    });

    // Add success message
    const message = state.mode === 'b2b' 
      ? `✅ Added ${validated.quantity} units to cart. Bulk pricing applied for quantities over 50.`
      : `✅ Added ${validated.quantity} ${addedItem?.name || 'item'} to your cart!`;

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: message,
        additional_kwargs: {
          tool_use: {
            name: 'addToCart',
            result: {
              success: true,
              cartTotal: updatedCart.totalPrice.amount,
              itemCount: updatedCart.lineItems?.length || 0,
              addedItem: addedItem ? {
                name: addedItem.name,
                quantity: validated.quantity,
                price: addedItem.price.regular.amount
              } : null
            }
          }
        }
      })
    });

    // Update available actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['checkout', 'viewCart', 'updateCartItem', 'removeFromCart'],
        suggested: ['checkout', 'continueShoppingQuickActions']
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to add item to cart')
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`,
        additional_kwargs: {
          tool_use: {
            name: 'addToCart',
            error: true
          }
        }
      })
    });
  }

  return commands;
}

export async function updateCartItemImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    lineItemId: z.string(),
    quantity: z.number().min(0).max(999)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();

    // If quantity is 0, remove the item
    if (validated.quantity === 0) {
      await sdk.unified.removeCartLineItem({ lineItemId: validated.lineItemId });
    } else {
      await sdk.unified.updateCartLineItem({
        lineItemId: validated.lineItemId,
        quantity: validated.quantity
      });
    }

    // Get updated cart
    const updatedCart = await sdk.unified.getCart();

    // Update state
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        items: updatedCart.lineItems?.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price.regular.amount,
          image: item.image?.url
        })) || [],
        total: updatedCart.totalPrice.amount,
        subtotal: updatedCart.subtotalPrice.amount,
        tax: updatedCart.totalTax?.amount || 0,
        shipping: updatedCart.shippingPrice?.amount || 0,
        lastUpdated: new Date().toISOString()
      }
    });

    const message = validated.quantity === 0
      ? '✅ Item removed from cart'
      : `✅ Updated quantity to ${validated.quantity}`;

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: message,
        additional_kwargs: {
          tool_use: {
            name: 'updateCartItem',
            result: {
              success: true,
              newQuantity: validated.quantity,
              cartTotal: updatedCart.totalPrice.amount
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to update cart')
    });
  }

  return commands;
}

export async function removeFromCartImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    lineItemId: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Find item details before removal
    const currentCart = await sdk.unified.getCart();
    const itemToRemove = currentCart.lineItems?.find(item => item.id === validated.lineItemId);
    
    // Remove from cart
    await sdk.unified.removeCartLineItem({ lineItemId: validated.lineItemId });
    
    // Get updated cart
    const updatedCart = await sdk.unified.getCart();

    // Update state
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        items: updatedCart.lineItems?.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price.regular.amount,
          image: item.image?.url
        })) || [],
        total: updatedCart.totalPrice.amount,
        subtotal: updatedCart.subtotalPrice.amount,
        tax: updatedCart.totalTax?.amount || 0,
        shipping: updatedCart.shippingPrice?.amount || 0,
        lastUpdated: new Date().toISOString()
      }
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `✅ Removed ${itemToRemove?.name || 'item'} from cart`,
        additional_kwargs: {
          tool_use: {
            name: 'removeFromCart',
            result: {
              success: true,
              removedItem: itemToRemove?.name,
              cartTotal: updatedCart.totalPrice.amount,
              remainingItems: updatedCart.lineItems?.length || 0
            }
          }
        }
      })
    });

    // Update available actions if cart is empty
    if (!updatedCart.lineItems || updatedCart.lineItems.length === 0) {
      commands.push({
        type: 'UPDATE_AVAILABLE_ACTIONS',
        payload: {
          enabled: ['search', 'browse'],
          suggested: ['searchProducts']
        }
      });
    }

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to remove item')
    });
  }

  return commands;
}

export async function getCartImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    const cart = await sdk.unified.getCart();

    // Update state with current cart
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        items: cart.lineItems?.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price.regular.amount,
          image: item.image?.url
        })) || [],
        total: cart.totalPrice.amount,
        subtotal: cart.subtotalPrice.amount,
        tax: cart.totalTax?.amount || 0,
        shipping: cart.shippingPrice?.amount || 0,
        appliedCoupons: cart.appliedCoupons || [],
        lastUpdated: new Date().toISOString()
      }
    });

    // Format cart summary
    let cartSummary = `🛒 **Your Cart**\n\n`;
    
    if (!cart.lineItems || cart.lineItems.length === 0) {
      cartSummary += 'Your cart is empty.';
    } else {
      cart.lineItems.forEach((item, index) => {
        cartSummary += `${index + 1}. ${item.name}\n`;
        cartSummary += `   Quantity: ${item.quantity} × ${state.context.currency} ${item.price.regular.amount}\n`;
        cartSummary += `   Subtotal: ${state.context.currency} ${item.quantity * item.price.regular.amount}\n\n`;
      });
      
      cartSummary += `**Total: ${state.context.currency} ${cart.totalPrice.amount}**`;
      
      if (state.mode === 'b2b') {
        cartSummary += '\n\n💼 *Tax-exempt pricing available. Contact sales for volume discounts.*';
      }
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: cartSummary,
        additional_kwargs: {
          tool_use: {
            name: 'getCart',
            result: {
              itemCount: cart.lineItems?.length || 0,
              total: cart.totalPrice.amount,
              items: cart.lineItems?.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price.regular.amount
              }))
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to retrieve cart')
    });
  }

  return commands;
}

export async function clearCartImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    confirm: z.boolean().default(false)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  if (!validated.confirm) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: '⚠️ Are you sure you want to clear your entire cart? Please confirm by setting confirm: true',
        additional_kwargs: {
          tool_use: {
            name: 'clearCart',
            requiresConfirmation: true
          }
        }
      })
    });
    return commands;
  }

  try {
    const sdk = getSdk();
    
    // Get current cart to clear all items
    const cart = await sdk.unified.getCart();
    
    // Remove all items
    if (cart.lineItems) {
      for (const item of cart.lineItems) {
        await sdk.unified.removeCartLineItem({ lineItemId: item.id });
      }
    }

    // Update state
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        items: [],
        total: 0,
        subtotal: 0,
        tax: 0,
        shipping: 0,
        appliedCoupons: [],
        lastUpdated: new Date().toISOString()
      }
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: '✅ Your cart has been cleared',
        additional_kwargs: {
          tool_use: {
            name: 'clearCart',
            result: { success: true }
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
      payload: error instanceof Error ? error : new Error('Failed to clear cart')
    });
  }

  return commands;
}