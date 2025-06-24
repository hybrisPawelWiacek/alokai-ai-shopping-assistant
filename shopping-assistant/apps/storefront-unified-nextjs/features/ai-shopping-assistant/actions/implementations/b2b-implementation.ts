import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';
import { mockCustomExtension } from '../../mocks/custom-extension-mock';

/**
 * B2B-specific action implementations
 */

export async function requestBulkPricingImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string(),
    quantities: z.array(z.number().min(50)).min(1).max(5)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    if (state.mode !== 'b2b') {
      throw new Error('Bulk pricing is only available for business customers');
    }

    const sdk = getSdk();
    
    // Get product details first
    const product = await sdk.unified.getProductDetails({ id: validated.productId });
    
    // Fetch bulk pricing tiers using custom extension
    // TODO: Replace with sdk.customExtension.getBulkPricing()
    const pricingData = await mockCustomExtension.getBulkPricing({
      productId: validated.productId,
      quantities: validated.quantities,
      customerId: state.context.customerId
    });

    // Format pricing response
    let response = `💼 **Bulk Pricing for ${product.name}**\n\n`;
    response += '**Volume Discounts:**\n';
    
    pricingData.pricingTiers.forEach(tier => {
      const unitPrice = tier.totalPrice / tier.quantity;
      const savings = ((product.price.regular.amount - unitPrice) / product.price.regular.amount * 100).toFixed(1);
      
      response += `• **${tier.quantity}+ units:** ${state.context.currency} ${unitPrice.toFixed(2)}/unit`;
      
      if (savings > 0) {
        response += ` (Save ${savings}%)`;
      }
      
      response += '\n';
      response += `  Total: ${state.context.currency} ${tier.totalPrice.toFixed(2)}\n`;
      
      if (tier.leadTime) {
        response += `  Lead time: ${tier.leadTime}\n`;
      }
      
      response += '\n';
    });
    
    response += `**Minimum Order:** ${pricingData.minimumOrderQuantity} units\n\n`;
    response += '📞 *Contact our sales team for custom quantities or additional discounts on orders over 10,000 units.*';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'requestBulkPricing',
            result: {
              productName: product.name,
              pricingTiers: pricingData.pricingTiers,
              minimumOrder: pricingData.minimumOrderQuantity
            }
          }
        }
      })
    });

    // Suggest adding to cart with bulk quantity
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['addToCart', 'checkBulkAvailability', 'createQuote'],
        suggested: [`addToCart:${validated.productId}:${pricingData.minimumOrderQuantity}`]
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to get bulk pricing')
    });
  }

  return commands;
}

export async function checkBulkAvailabilityImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    deliveryDate: z.string().optional()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    if (state.mode !== 'b2b') {
      throw new Error('Bulk availability check is only available for business customers');
    }

    const sdk = getSdk();
    
    // Get product and availability
    const [product, availability] = await Promise.all([
      sdk.unified.getProductDetails({ id: validated.productId }),
      // TODO: Replace with sdk.customExtension.checkBulkAvailability()
      mockCustomExtension.checkBulkAvailability({
        productId: validated.productId,
        quantity: validated.quantity,
        deliveryDate: validated.deliveryDate
      })
    ]);

    let response = `📦 **Bulk Availability for ${product.name}**\n\n`;
    response += `Requested Quantity: **${validated.quantity} units**\n\n`;

    if (availability.available) {
      response += '✅ **Available**\n';
      response += `• In Stock: ${availability.inStockQuantity} units\n`;
      
      if (availability.leadTime) {
        response += `• Estimated Delivery: ${availability.leadTime.estimatedDate}\n`;
        response += `• Production Time: ${availability.leadTime.productionDays} days\n`;
      }
    } else {
      response += '⚠️ **Limited Availability**\n';
      response += `• Current Stock: ${availability.inStockQuantity} units\n`;
      
      if (availability.alternativeOptions && availability.alternativeOptions.length > 0) {
        response += '\n**Alternative Options:**\n';
        availability.alternativeOptions.forEach((option, index) => {
          response += `${index + 1}. ${option.description}\n`;
          response += `   Quantity: ${option.availableQuantity} units\n`;
          response += `   Delivery: ${option.estimatedDelivery}\n\n`;
        });
      }
    }

    if (validated.quantity > 1000) {
      response += '\n💡 *For orders over 1,000 units, we recommend scheduling a call with our supply chain team for custom fulfillment options.*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'checkBulkAvailability',
            result: {
              available: availability.available,
              inStock: availability.inStockQuantity,
              requestedQuantity: validated.quantity
            }
          }
        }
      })
    });

    // Update available actions based on availability
    if (availability.available) {
      commands.push({
        type: 'UPDATE_AVAILABLE_ACTIONS',
        payload: {
          enabled: ['addToCart', 'createQuote', 'requestBulkPricing'],
          suggested: ['addToCart', 'createQuote']
        }
      });
    }

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to check availability')
    });
  }

  return commands;
}

export async function requestSampleImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productIds: z.array(z.string()).min(1).max(5),
    shippingAddress: z.object({
      company: z.string(),
      address: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string()
    })
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    if (state.mode !== 'b2b') {
      throw new Error('Product samples are only available for business customers');
    }

    const sdk = getSdk();
    
    // Create sample request
    // TODO: Replace with sdk.customExtension.requestProductSamples()
    const sampleRequest = await mockCustomExtension.requestProductSamples({
      productIds: validated.productIds,
      shippingAddress: validated.shippingAddress,
      customerId: state.context.customerId,
      accountId: state.context.accountId
    });

    let response = '🎁 **Sample Request Submitted**\n\n';
    response += `**Request ID:** ${sampleRequest.requestId}\n`;
    response += `**Status:** ${sampleRequest.status}\n`;
    response += `**Estimated Delivery:** ${sampleRequest.estimatedDelivery}\n\n`;
    
    response += '**Samples Requested:**\n';
    sampleRequest.products.forEach((product, index) => {
      response += `${index + 1}. ${product.name}\n`;
    });
    
    response += '\n**Shipping To:**\n';
    response += `${validated.shippingAddress.company}\n`;
    response += `${validated.shippingAddress.address}\n`;
    response += `${validated.shippingAddress.city}, ${validated.shippingAddress.postalCode}\n`;
    response += `${validated.shippingAddress.country}\n\n`;
    
    response += '📧 *A confirmation email has been sent. Our sales team will follow up within 24 hours.*';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'requestSample',
            result: {
              requestId: sampleRequest.requestId,
              status: sampleRequest.status,
              productCount: validated.productIds.length
            }
          }
        }
      })
    });

    // Update context
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        sampleRequestId: sampleRequest.requestId,
        sampleRequestDate: new Date().toISOString()
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to request samples')
    });
  }

  return commands;
}

export async function getAccountCreditImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const commands: StateUpdateCommand[] = [];

  try {
    if (state.mode !== 'b2b') {
      throw new Error('Account credit is only available for business customers');
    }

    const sdk = getSdk();
    
    // Get account credit information
    // TODO: Replace with sdk.customExtension.getAccountCredit()
    const creditInfo = await mockCustomExtension.getAccountCredit({
      customerId: state.context.customerId,
      accountId: state.context.accountId
    });

    let response = '💳 **Account Credit Information**\n\n';
    response += `**Credit Limit:** ${state.context.currency} ${creditInfo.creditLimit.toLocaleString()}\n`;
    response += `**Available Credit:** ${state.context.currency} ${creditInfo.availableCredit.toLocaleString()}\n`;
    response += `**Outstanding Balance:** ${state.context.currency} ${creditInfo.outstandingBalance.toLocaleString()}\n`;
    response += `**Payment Terms:** ${creditInfo.paymentTerms.replace('_', ' ').toUpperCase()}\n\n`;
    
    // Calculate credit utilization
    const utilization = (creditInfo.outstandingBalance / creditInfo.creditLimit * 100).toFixed(1);
    response += `**Credit Utilization:** ${utilization}%\n\n`;
    
    if (creditInfo.availableCredit < creditInfo.creditLimit * 0.2) {
      response += '⚠️ *Low available credit. Contact our finance team to increase your credit limit.*\n';
    } else {
      response += '✅ *Sufficient credit available for new orders.*\n';
    }
    
    if (creditInfo.pendingPayments && creditInfo.pendingPayments.length > 0) {
      response += '\n**Upcoming Payments:**\n';
      creditInfo.pendingPayments.forEach(payment => {
        response += `• ${state.context.currency} ${payment.amount} due ${payment.dueDate}\n`;
      });
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getAccountCredit',
            result: {
              creditLimit: creditInfo.creditLimit,
              availableCredit: creditInfo.availableCredit,
              utilization: parseFloat(utilization)
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to get account credit')
    });
  }

  return commands;
}

export async function scheduleProductDemoImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    productIds: z.array(z.string()),
    preferredTimes: z.array(z.object({
      date: z.string(),
      time: z.string()
    })).min(1).max(3),
    attendeeCount: z.number().default(1)
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    if (state.mode !== 'b2b') {
      throw new Error('Product demos are only available for business customers');
    }

    const sdk = getSdk();
    
    // Schedule demo
    // TODO: Replace with sdk.customExtension.scheduleProductDemo()
    const demoBooking = await mockCustomExtension.scheduleProductDemo({
      productIds: validated.productIds,
      preferredTimes: validated.preferredTimes,
      attendeeCount: validated.attendeeCount,
      customerId: state.context.customerId,
      contactInfo: {
        email: state.context.customerEmail,
        company: state.context.companyName
      }
    });

    let response = '📅 **Product Demo Scheduled**\n\n';
    response += `**Demo ID:** ${demoBooking.demoId}\n`;
    response += `**Date & Time:** ${demoBooking.scheduledTime.date} at ${demoBooking.scheduledTime.time}\n`;
    response += `**Duration:** ${demoBooking.duration} minutes\n`;
    response += `**Attendees:** ${validated.attendeeCount}\n\n`;
    
    response += '**Products to Demo:**\n';
    demoBooking.products.forEach((product, index) => {
      response += `${index + 1}. ${product.name}\n`;
    });
    
    response += `\n**Meeting Link:** ${demoBooking.meetingLink}\n\n`;
    response += '📧 *Calendar invitation sent to your email. Our product specialist will cover features, pricing, and answer any questions.*';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'scheduleProductDemo',
            result: {
              demoId: demoBooking.demoId,
              scheduledTime: demoBooking.scheduledTime,
              meetingLink: demoBooking.meetingLink
            }
          }
        }
      })
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to schedule demo')
    });
  }

  return commands;
}

export async function getTaxExemptionImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    exemptionCertificate: z.string(),
    state: z.string()
  });

  const validated = schema.parse(params);
  const commands: StateUpdateCommand[] = [];

  try {
    if (state.mode !== 'b2b') {
      throw new Error('Tax exemption is only available for business customers');
    }

    if (!state.cart.items || state.cart.items.length === 0) {
      throw new Error('Cannot apply tax exemption to an empty cart');
    }

    const sdk = getSdk();
    
    // Apply tax exemption
    // TODO: Replace with sdk.customExtension.applyTaxExemption()
    const exemptionResult = await mockCustomExtension.applyTaxExemption({
      cartId: state.cart.id,
      exemptionCertificate: validated.exemptionCertificate,
      state: validated.state,
      customerId: state.context.customerId
    });

    if (!exemptionResult.applied) {
      throw new Error(exemptionResult.reason || 'Invalid tax exemption certificate');
    }

    // Update cart with new totals
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        tax: 0,
        total: exemptionResult.updatedTotal,
        taxExempt: true,
        lastUpdated: new Date().toISOString()
      }
    });

    let response = '✅ **Tax Exemption Applied**\n\n';
    response += `**Certificate:** ${validated.exemptionCertificate}\n`;
    response += `**State:** ${validated.state}\n`;
    response += `**Tax Savings:** ${state.context.currency} ${exemptionResult.taxSavings.toFixed(2)}\n\n`;
    
    response += '**Updated Order Total:**\n';
    response += `Subtotal: ${state.context.currency} ${state.cart.subtotal}\n`;
    response += `Tax: ${state.context.currency} 0.00 (Exempt)\n`;
    response += `**Total: ${state.context.currency} ${exemptionResult.updatedTotal}**\n\n`;
    
    response += '📋 *Tax exemption documentation will be included with your order.*';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getTaxExemption',
            result: {
              applied: true,
              taxSavings: exemptionResult.taxSavings,
              newTotal: exemptionResult.updatedTotal
            }
          }
        }
      })
    });

    // Update available actions
    commands.push({
      type: 'UPDATE_AVAILABLE_ACTIONS',
      payload: {
        enabled: ['checkout', 'createPurchaseOrder'],
        suggested: ['createPurchaseOrder']
      }
    });

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to apply tax exemption')
    });
  }

  return commands;
}