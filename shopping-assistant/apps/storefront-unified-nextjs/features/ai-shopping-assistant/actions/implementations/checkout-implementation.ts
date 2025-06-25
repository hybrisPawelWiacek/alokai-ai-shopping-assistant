import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';
import { CommerceSecurityJudge } from '../../security';

/**
 * Checkout action implementations with B2B/B2C support
 */

export async function checkoutImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    shippingMethod: z.enum(['standard', 'express', 'overnight', 'pickup']).optional(),
    paymentMethod: z.enum(['credit_card', 'paypal', 'apple_pay', 'google_pay', 'invoice', 'purchase_order']).optional(),
    couponCode: z.string().optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // Security validation for checkout
    const securityJudge = new CommerceSecurityJudge(state.security);
    const validation = await securityJudge.validate('checkout', state);
    
    if (!validation.isValid && validation.severity === 'critical') {
      throw new Error('Security validation failed: Suspicious checkout activity detected');
    }

    // Validate cart is not empty
    if (!state.cart.items || state.cart.items.length === 0) {
      throw new Error('Cannot checkout with an empty cart');
    }

    // B2B-specific payment method validation
    if (state.mode === 'b2b') {
      const b2bPaymentMethods = ['invoice', 'purchase_order'];
      if (validated.paymentMethod && !b2bPaymentMethods.includes(validated.paymentMethod)) {
        throw new Error('B2B customers must use invoice or purchase order payment methods');
      }
    } else {
      // B2C payment method validation
      const b2cPaymentMethods = ['credit_card', 'paypal', 'apple_pay', 'google_pay'];
      if (validated.paymentMethod && !b2cPaymentMethods.includes(validated.paymentMethod)) {
        throw new Error('This payment method is only available for business customers');
      }
    }

    // Check minimum order requirements
    const minimumOrder = state.mode === 'b2b' ? 100 : 0;
    if (state.cart.total < minimumOrder) {
      throw new Error(`Minimum order value is ${state.context.currency} ${minimumOrder}`);
    }

    const sdk = getSdk();

    // Apply coupon if provided
    if (validated.couponCode) {
      await sdk.unified.applyCoupon({ code: validated.couponCode });
    }

    // Get checkout URL
    const checkoutData = await sdk.unified.createCheckout({
      shippingMethod: validated.shippingMethod,
      paymentMethod: validated.paymentMethod
    });

    // Build order summary
    const orderSummary = {
      items: state.cart.items,
      subtotal: state.cart.subtotal,
      tax: state.cart.tax,
      shipping: state.cart.shipping,
      total: state.cart.total,
      shippingMethod: validated.shippingMethod || 'standard',
      paymentMethod: validated.paymentMethod || (state.mode === 'b2b' ? 'invoice' : 'credit_card')
    };

    // Format response based on mode
    let response = '🛒 **Checkout Ready**\n\n';
    response += `**Order Summary:**\n`;
    response += `Items: ${state.cart.items.length}\n`;
    response += `Subtotal: ${state.context.currency} ${state.cart.subtotal}\n`;
    
    if (state.cart.tax > 0) {
      response += `Tax: ${state.context.currency} ${state.cart.tax}\n`;
    }
    
    if (state.cart.shipping > 0) {
      response += `Shipping: ${state.context.currency} ${state.cart.shipping}\n`;
    }
    
    response += `**Total: ${state.context.currency} ${state.cart.total}**\n\n`;

    if (state.mode === 'b2b') {
      response += '💼 **B2B Checkout Options:**\n';
      response += '• Generate Purchase Order\n';
      response += '• Request Net Terms\n';
      response += '• Apply Tax Exemption\n\n';
      response += `[Complete B2B Checkout](${checkoutData.checkoutUrl})`;
    } else {
      response += `[Complete Your Purchase](${checkoutData.checkoutUrl})`;
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'checkout',
            result: {
              checkoutUrl: checkoutData.checkoutUrl,
              orderSummary,
              mode: state.mode
            }
          }
        }
      })
    });

    // Update context with checkout initiation
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        checkoutInitiated: true,
        checkoutTimestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to initiate checkout')
    });

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ Unable to checkout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        additional_kwargs: {
          tool_use: {
            name: 'checkout',
            error: true
          }
        }
      })
    });
  }

  return commands;
}

export async function applyCouponImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    couponCode: z.string().regex(/^[A-Z0-9_-]+$/)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // Security check for suspicious coupon codes
    const suspiciousCodes = ['ADMIN', 'TEST', 'DEBUG', 'STAFF', 'FREE', '100OFF'];
    if (suspiciousCodes.includes(validated.couponCode)) {
      throw new Error('Invalid coupon code');
    }

    const sdk = getSdk();
    const result = await sdk.unified.applyCoupon({ code: validated.couponCode });

    if (!result.applied) {
      throw new Error(result.message || 'Invalid or expired coupon code');
    }

    // Get updated cart
    const updatedCart = await sdk.unified.getCart();

    // Update state
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        total: updatedCart.totalPrice.amount,
        appliedCoupons: [...state.cart.appliedCoupons, validated.couponCode],
        lastUpdated: new Date().toISOString()
      }
    });

    let message = `✅ Coupon "${validated.couponCode}" applied successfully!\n`;
    message += `Discount: ${result.discount.type === 'percentage' ? `${result.discount.value}%` : `${state.context.currency} ${result.discount.value}`}\n`;
    message += `New total: ${state.context.currency} ${updatedCart.totalPrice.amount}`;

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: message,
        additional_kwargs: {
          tool_use: {
            name: 'applyCoupon',
            result: {
              applied: true,
              discount: result.discount,
              newTotal: updatedCart.totalPrice.amount
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: `❌ ${error instanceof Error ? error.message : 'Failed to apply coupon'}`,
        additional_kwargs: {
          tool_use: {
            name: 'applyCoupon',
            error: true
          }
        }
      })
    });
  }

  return commands;
}

export async function calculateShippingImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    address: z.object({
      country: z.string(),
      postalCode: z.string(),
      state: z.string().optional()
    })
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    const sdk = getSdk();
    const shippingOptions = await sdk.unified.getShippingMethods({
      cartId: state.cart.id,
      address: validated.address
    });

    // Format shipping options
    let response = '📦 **Available Shipping Options:**\n\n';
    
    shippingOptions.forEach((option, index) => {
      response += `${index + 1}. **${option.name}**\n`;
      response += `   Cost: ${state.context.currency} ${option.price.amount}\n`;
      response += `   Delivery: ${option.estimatedDelivery}\n`;
      
      if (state.mode === 'b2b' && option.bulkDiscount) {
        response += `   💼 Bulk discount available\n`;
      }
      
      response += '\n';
    });

    if (state.mode === 'b2b') {
      response += '💡 *Contact sales for custom shipping arrangements on large orders*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'calculateShipping',
            result: {
              shippingOptions: shippingOptions.map(opt => ({
                name: opt.name,
                price: opt.price.amount,
                estimatedDelivery: opt.estimatedDelivery
              }))
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to calculate shipping')
    });
  }

  return commands;
}

export async function createQuoteImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    companyInfo: z.object({
      name: z.string(),
      taxId: z.string().optional(),
      contactEmail: z.string().email()
    }),
    validityDays: z.number().min(7).max(90).default(30),
    notes: z.string().optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // B2B mode check
    if (state.mode !== 'b2b') {
      throw new Error('Quotes are only available for business customers');
    }

    // Validate cart
    if (!state.cart.items || state.cart.items.length === 0) {
      throw new Error('Cannot create a quote for an empty cart');
    }

    const sdk = getSdk();
    
    // Create quote from custom extension
    const quote = await sdk.customExtension.createQuote({
      companyInfo: validated.companyInfo,
      validityDays: validated.validityDays,
      notes: validated.notes,
      items: state.cart.items.map(item => ({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price
      })),
      currency: state.context.currency
    });
    
    let response = '📄 **Quote Generated Successfully**\n\n';
    response += `**Quote ID:** ${quote.quoteId}\n`;
    response += `**Valid Until:** ${new Date(quote.validUntil).toLocaleDateString()}\n`;
    response += `**Total Amount:** ${state.context.currency} ${quote.totalAmount.toFixed(2)}\n`;
    
    if (quote.volumeDiscount) {
      response += `**Volume Discount Applied:** ${quote.volumeDiscount}%\n`;
    }
    
    response += `\n[Download Quote PDF](${quote.downloadUrl})\n\n`;
    response += '*A copy has been sent to your registered email address.*';
    
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'createQuote',
            result: quote
          }
        }
      })
    });
    
    // Update context
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        lastQuoteId: quote.quoteId,
        lastQuoteDate: new Date().toISOString()
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to create quote')
    });
  }

  return commands;
}

export async function createPurchaseOrderImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    poNumber: z.string(),
    paymentTerms: z.enum(['net_15', 'net_30', 'net_45', 'net_60', 'prepaid']),
    approverEmail: z.string().email().optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    // B2B mode check
    if (state.mode !== 'b2b') {
      throw new Error('Purchase orders are only available for business customers');
    }

    // Validate PO number format
    if (!/^[A-Z0-9-]+$/.test(validated.poNumber)) {
      throw new Error('Invalid PO number format');
    }

    const sdk = getSdk();
    
    // Create purchase order from custom extension
    const purchaseOrder = await sdk.customExtension.createPurchaseOrder({
      poNumber: validated.poNumber,
      paymentTerms: validated.paymentTerms,
      approverEmail: validated.approverEmail,
      items: state.cart.items.map(item => ({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: state.cart.total,
      customerId: state.context.customer?.id || ''
    });
    
    let response = '💼 **Purchase Order Created**\n\n';
    response += `**PO Number:** ${validated.poNumber}\n`;
    response += `**Order ID:** ${purchaseOrder.orderId}\n`;
    response += `**Status:** ${purchaseOrder.status.toUpperCase()}\n`;
    response += `**Payment Terms:** ${validated.paymentTerms.replace('_', ' ').toUpperCase()}\n`;
    response += `**Total Amount:** ${state.context.currency} ${state.cart.total.toFixed(2)}\n\n`;
    
    if (purchaseOrder.status === 'pending' && validated.approverEmail) {
      response += `📧 *Approval request sent to ${validated.approverEmail}*\n\n`;
    }
    
    if (purchaseOrder.paymentInstructions) {
      response += '**Payment Instructions:**\n';
      response += `Bank: ${purchaseOrder.paymentInstructions.bankName}\n`;
      response += `Reference: ${purchaseOrder.paymentInstructions.reference}\n\n`;
    }
    
    response += '*Order confirmation has been sent to your email.*';
    
    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'createPurchaseOrder',
            result: purchaseOrder
          }
        }
      })
    });
    
    // Clear cart after PO creation
    commands.push({
      type: 'CLEAR_CART'
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to create purchase order')
    });
  }

  return commands;
}