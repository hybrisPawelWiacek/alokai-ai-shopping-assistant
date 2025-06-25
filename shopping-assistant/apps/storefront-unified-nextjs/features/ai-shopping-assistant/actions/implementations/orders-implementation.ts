import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';

/**
 * Order management action implementations using UDL
 */

export async function getOrdersImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    status: z.enum(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    limit: z.number().min(1).max(50).default(10),
    offset: z.number().min(0).default(0)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Get orders using UDL
    const ordersResponse = await sdk.unified.getOrders({
      pageSize: validated.limit,
      currentPage: Math.floor(validated.offset / validated.limit) + 1
    });
    
    // Filter by status if specified
    let orders = ordersResponse.results || [];
    if (validated.status && validated.status !== 'all') {
      orders = orders.filter(order => order.status?.toLowerCase() === validated.status);
    }
    
    if (orders.length === 0) {
      const response = validated.status && validated.status !== 'all' 
        ? `📦 No ${validated.status} orders found.`
        : '📦 You haven\'t placed any orders yet.';
      
      commands.push({
        type: 'ADD_MESSAGE',
        payload: new AIMessage({
          content: response,
          additional_kwargs: {
            tool_use: {
              name: 'getOrders',
              result: { orders: [], totalCount: 0 }
            }
          }
        })
      });
      return commands;
    }
    
    let response = `📦 **Your Orders (${orders.length}${validated.status && validated.status !== 'all' ? ` ${validated.status}` : ''})**\n\n`;
    
    orders.forEach((order, index) => {
      const orderDate = new Date(order.createdAt || '').toLocaleDateString();
      const statusEmoji = getStatusEmoji(order.status || 'pending');
      
      response += `**${index + 1}. Order #${order.id}**\n`;
      response += `Date: ${orderDate}\n`;
      response += `Status: ${statusEmoji} ${formatStatus(order.status || 'pending')}\n`;
      response += `Total: ${state.context.currency} ${order.totalPrice?.amount.toFixed(2)}\n`;
      response += `Items: ${order.lineItems?.length || 0}\n`;
      
      if (order.shippingInfo?.trackingNumber) {
        response += `Tracking: ${order.shippingInfo.trackingNumber}\n`;
      }
      
      response += '\n';
    });
    
    if (ordersResponse.pagination?.totalPages > 1) {
      const currentPage = ordersResponse.pagination.currentPage;
      const totalPages = ordersResponse.pagination.totalPages;
      response += `*Showing page ${currentPage} of ${totalPages}*`;
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getOrders',
            result: {
              orders,
              totalCount: ordersResponse.pagination?.total || orders.length
            }
          }
        }
      })
    });

    // Suggest actions based on orders
    if (orders.length > 0) {
      commands.push({
        type: 'UPDATE_AVAILABLE_ACTIONS',
        payload: {
          enabled: ['getOrderDetails', 'trackOrder', 'reorderItems'],
          suggested: [`getOrderDetails:${orders[0].id}`]
        }
      });
    }

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: '❌ Unable to retrieve orders. Please log in first.',
        additional_kwargs: {
          tool_use: {
            name: 'getOrders',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to get orders')
    });
  }

  return commands;
}

export async function getOrderDetailsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    orderId: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Get order details
    const order = await sdk.unified.getOrderDetails({ orderId: validated.orderId });
    
    const orderDate = new Date(order.createdAt || '').toLocaleDateString();
    const statusEmoji = getStatusEmoji(order.status || 'pending');
    
    let response = `📋 **Order Details #${order.id}**\n\n`;
    response += `**Order Information:**\n`;
    response += `• Date: ${orderDate}\n`;
    response += `• Status: ${statusEmoji} ${formatStatus(order.status || 'pending')}\n`;
    response += `• Payment: ${order.paymentInfo?.method || 'N/A'}\n`;
    
    if (order.shippingInfo) {
      response += `\n**Shipping Information:**\n`;
      response += `• Method: ${order.shippingInfo.method}\n`;
      response += `• Address: ${formatAddress(order.shippingAddress)}\n`;
      
      if (order.shippingInfo.trackingNumber) {
        response += `• Tracking: ${order.shippingInfo.trackingNumber}\n`;
        response += `• Carrier: ${order.shippingInfo.carrier || 'N/A'}\n`;
      }
      
      if (order.shippingInfo.estimatedDelivery) {
        response += `• Est. Delivery: ${new Date(order.shippingInfo.estimatedDelivery).toLocaleDateString()}\n`;
      }
    }
    
    response += `\n**Order Items (${order.lineItems?.length || 0}):**\n`;
    
    order.lineItems?.forEach((item, index) => {
      response += `${index + 1}. ${item.name}\n`;
      response += `   SKU: ${item.sku}\n`;
      response += `   Qty: ${item.quantity} × ${state.context.currency} ${item.price.regular.amount.toFixed(2)}\n`;
      response += `   Subtotal: ${state.context.currency} ${(item.quantity * item.price.regular.amount).toFixed(2)}\n\n`;
    });
    
    response += `**Order Summary:**\n`;
    response += `• Subtotal: ${state.context.currency} ${order.subtotalPrice?.amount.toFixed(2)}\n`;
    
    if (order.shippingPrice) {
      response += `• Shipping: ${state.context.currency} ${order.shippingPrice.amount.toFixed(2)}\n`;
    }
    
    if (order.totalTax) {
      response += `• Tax: ${state.context.currency} ${order.totalTax.amount.toFixed(2)}\n`;
    }
    
    if (order.discounts && order.discounts.length > 0) {
      response += `• Discounts: -${state.context.currency} ${order.discounts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}\n`;
    }
    
    response += `• **Total: ${state.context.currency} ${order.totalPrice?.amount.toFixed(2)}**\n`;
    
    // B2B specific info
    if (state.mode === 'b2b' && order.purchaseOrderNumber) {
      response += `\n**B2B Information:**\n`;
      response += `• PO Number: ${order.purchaseOrderNumber}\n`;
      response += `• Payment Terms: ${order.paymentTerms || 'N/A'}\n`;
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getOrderDetails',
            result: { order }
          }
        }
      })
    });

    // Suggest actions
    const suggestions = [];
    if (order.shippingInfo?.trackingNumber) {
      suggestions.push(`trackOrder:${order.id}`);
    }
    suggestions.push(`reorderItems:${order.id}`);
    
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['trackOrder', 'reorderItems'],
        suggested: suggestions
      }
    });

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Unable to retrieve order #${validated.orderId}. Please check the order ID.`,
        additional_kwargs: {
          tool_use: {
            name: 'getOrderDetails',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to get order details')
    });
  }

  return commands;
}

export async function trackOrderImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    orderId: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Get order details with tracking info
    const order = await sdk.unified.getOrderDetails({ orderId: validated.orderId });
    
    if (!order.shippingInfo?.trackingNumber) {
      commands.push({
        type: 'ADD_MESSAGE',
        payload: new AIMessage({
          content: `📦 Order #${order.id} hasn't shipped yet. Current status: ${formatStatus(order.status || 'pending')}`,
          additional_kwargs: {
            tool_use: {
              name: 'trackOrder',
              result: { 
                trackingInfo: {
                  status: order.status,
                  shipped: false
                }
              }
            }
          }
        })
      });
      return commands;
    }
    
    // TODO: Real tracking would call carrier API via custom extension
    // For now, simulate tracking based on order status
    const trackingEvents = generateTrackingEvents(order);
    
    let response = `🚚 **Tracking Order #${order.id}**\n\n`;
    response += `**Tracking Number:** ${order.shippingInfo.trackingNumber}\n`;
    response += `**Carrier:** ${order.shippingInfo.carrier || 'Standard Shipping'}\n`;
    response += `**Status:** ${getStatusEmoji(order.status || 'shipped')} ${formatStatus(order.status || 'shipped')}\n\n`;
    
    if (order.shippingInfo.estimatedDelivery) {
      const deliveryDate = new Date(order.shippingInfo.estimatedDelivery).toLocaleDateString();
      response += `**Estimated Delivery:** ${deliveryDate}\n\n`;
    }
    
    response += `**Tracking History:**\n`;
    trackingEvents.forEach(event => {
      response += `• ${event.date} - ${event.status}\n`;
      if (event.location) {
        response += `  📍 ${event.location}\n`;
      }
    });
    
    response += `\n**Delivery Address:**\n${formatAddress(order.shippingAddress)}`;

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'trackOrder',
            result: {
              trackingInfo: {
                trackingNumber: order.shippingInfo.trackingNumber,
                carrier: order.shippingInfo.carrier,
                status: order.status,
                estimatedDelivery: order.shippingInfo.estimatedDelivery,
                events: trackingEvents
              }
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Unable to track order #${validated.orderId}. Please check the order ID.`,
        additional_kwargs: {
          tool_use: {
            name: 'trackOrder',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to track order')
    });
  }

  return commands;
}

export async function reorderItemsImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    orderId: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    
    // Get order details
    const order = await sdk.unified.getOrderDetails({ orderId: validated.orderId });
    
    if (!order.lineItems || order.lineItems.length === 0) {
      commands.push({
        type: 'ADD_MESSAGE',
        payload: new AIMessage({
          content: `❌ Order #${order.id} has no items to reorder.`,
          additional_kwargs: {
            tool_use: {
              name: 'reorderItems',
              result: { success: false }
            }
          }
        })
      });
      return commands;
    }
    
    // Add each item to cart
    const addedItems = [];
    const failedItems = [];
    
    for (const item of order.lineItems) {
      try {
        await sdk.unified.addCartLineItem({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        });
        addedItems.push(item);
      } catch (error) {
        failedItems.push({
          item,
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Get updated cart
    const updatedCart = await sdk.unified.getCart();
    
    let response = '🛒 **Reorder Results**\n\n';
    
    if (addedItems.length > 0) {
      response += `✅ **Added ${addedItems.length} items to cart:**\n`;
      addedItems.forEach(item => {
        response += `• ${item.name} (${item.quantity}x)\n`;
      });
    }
    
    if (failedItems.length > 0) {
      response += `\n⚠️ **Could not add ${failedItems.length} items:**\n`;
      failedItems.forEach(({ item, reason }) => {
        response += `• ${item.name} - ${reason}\n`;
      });
    }
    
    response += `\n**Cart Total:** ${state.context.currency} ${updatedCart.totalPrice.amount.toFixed(2)}`;

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'reorderItems',
            result: {
              cart: updatedCart,
              addedItems
            }
          }
        }
      })
    });

    // Update cart state
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
        lastUpdated: new Date().toISOString()
      }
    });

    // Suggest checkout
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['checkout', 'getCart'],
        suggested: ['checkout']
      }
    });

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Failed to reorder items from order #${validated.orderId}.`,
        additional_kwargs: {
          tool_use: {
            name: 'reorderItems',
            result: { success: false }
          }
        }
      })
    });
    
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to reorder items')
    });
  }

  return commands;
}

// Helper functions
function getStatusEmoji(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '⏳',
    processing: '⚙️',
    shipped: '📦',
    delivered: '✅',
    cancelled: '❌',
    returned: '↩️'
  };
  return statusMap[status.toLowerCase()] || '📋';
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatAddress(address: any): string {
  if (!address) return 'N/A';
  
  let formatted = '';
  if (address.firstName && address.lastName) {
    formatted += `${address.firstName} ${address.lastName}\n`;
  }
  if (address.company) {
    formatted += `${address.company}\n`;
  }
  formatted += `${address.address1}\n`;
  if (address.address2) {
    formatted += `${address.address2}\n`;
  }
  formatted += `${address.city}, ${address.state} ${address.postalCode}\n`;
  formatted += address.country;
  
  return formatted;
}

function generateTrackingEvents(order: any): Array<{ date: string; status: string; location?: string }> {
  // Simulate tracking events based on order status
  const baseDate = new Date(order.createdAt || '');
  const events = [
    {
      date: baseDate.toLocaleDateString(),
      status: 'Order placed',
      location: undefined
    }
  ];
  
  if (['processing', 'shipped', 'delivered'].includes(order.status || '')) {
    events.push({
      date: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Order processing',
      location: 'Fulfillment Center'
    });
  }
  
  if (['shipped', 'delivered'].includes(order.status || '')) {
    events.push({
      date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Package shipped',
      location: 'Distribution Center'
    });
    
    events.push({
      date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'In transit',
      location: 'Regional Facility'
    });
  }
  
  if (order.status === 'delivered') {
    events.push({
      date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Out for delivery',
      location: order.shippingAddress?.city
    });
    
    events.push({
      date: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      status: 'Delivered',
      location: 'Front door'
    });
  }
  
  return events.reverse(); // Most recent first
}