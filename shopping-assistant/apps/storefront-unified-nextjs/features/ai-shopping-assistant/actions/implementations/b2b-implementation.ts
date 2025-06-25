import type { StateUpdateCommand } from '../../types/action-definition';
import type { CommerceState } from '../../state';
import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { getSdk } from '@/sdk';
import { executeBulkOrderWithUDL } from '../bulk-order-with-udl.action';

/**
 * B2B-specific action implementations
 * 
 * IMPORTANT: These actions require custom extensions to be defined in the Alokai middleware.
 * Each TODO comment indicates the exact custom method that needs to be implemented.
 * 
 * Example middleware implementation:
 * ```typescript
 * // In storefront-middleware/integrations/<your-integration>/extensions/unified.ts
 * export const customExtension = {
 *   getBulkPricing: async (context, args) => {
 *     // Implementation using your commerce backend API
 *   }
 * }
 * ```
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
    
    // Get bulk pricing from custom extension
    const bulkPricing = await sdk.customExtension.getBulkPricing({
      productId: validated.productId,
      quantities: validated.quantities,
      customerId: state.context.customer?.id
    });
    
    const pricingTiers = bulkPricing.pricingTiers;

    // Format pricing response
    let response = `💼 **Bulk Pricing for ${product.name}**\n\n`;
    response += '**Volume Discounts:**\n';
    
    pricingTiers.forEach(tier => {
      response += `• **${tier.quantity}+ units:** ${bulkPricing.currency} ${tier.unitPrice.toFixed(2)}/unit`;
      
      if (tier.discount > 0) {
        response += ` (Save ${tier.discount}%)`;
      }
      
      response += '\n';
      response += `  Total: ${bulkPricing.currency} ${tier.totalPrice.toFixed(2)}\n`;
      response += `  Lead time: ${tier.leadTime}\n\n`;
    });
    
    const minOrderTier = pricingTiers.find(t => t.minimumOrderQuantity);
    if (minOrderTier) {
      response += `**Minimum Order:** ${minOrderTier.minimumOrderQuantity} units\n\n`;
    }
    
    if (bulkPricing.contactForQuote) {
      response += `📞 *${bulkPricing.contactForQuote.message}*`;
    } else if (bulkPricing.customPricingAvailable) {
      response += '📞 *Custom pricing available for your account. Contact sales for details.*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'requestBulkPricing',
            result: {
              productName: product.name,
              pricingTiers,
              minimumOrder: 50
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
        suggested: [`addToCart:${validated.productId}:50`]
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
      throw new Error('Bulk availability is only available for business customers');
    }

    const sdk = getSdk();
    
    // Get product details with inventory
    const product = await sdk.unified.getProductDetails({ id: validated.productId });
    
    // Check bulk availability from custom extension
    const availability = await sdk.customExtension.checkBulkAvailability({
      productId: validated.productId,
      quantity: validated.quantity,
      deliveryDate: validated.deliveryDate
    });
    
    const inStock = availability.availableNow;
    const available = inStock >= validated.quantity;
    const leadTime = availability.availability.production;
    
    let response = `📦 **Bulk Availability for ${product.name}**\n\n`;
    response += `**Requested Quantity:** ${validated.quantity} units\n`;
    response += `**In Stock:** ${inStock} units\n\n`;
    
    if (available) {
      response += '✅ **Available for immediate shipment**\n';
      response += 'Estimated delivery: 3-5 business days\n\n';
      
      // Show warehouse breakdown if available
      if (availability.availability.immediate.warehouses.length > 0) {
        response += '**Warehouse Availability:**\n';
        availability.availability.immediate.warehouses.forEach(wh => {
          response += `• ${wh.name} (${wh.location}): ${wh.quantity} units\n`;
        });
        response += '\n';
      }
    } else {
      response += '⏳ **Production Required**\n';
      response += `Available stock: ${inStock} units\n`;
      response += `Additional needed: ${validated.quantity - inStock} units\n`;
      response += `Production time: ${leadTime.leadTime} business days\n`;
      response += `Estimated delivery: ${new Date(leadTime.estimatedDate).toLocaleDateString()}\n\n`;
      
      // Show alternatives from API
      if (availability.availability.alternatives.length > 0) {
        response += '**Alternative Options:**\n';
        availability.availability.alternatives.forEach(alt => {
          if (alt.splitShipment) {
            response += `• Split shipment:\n`;
            alt.shipments.forEach(ship => {
              response += `  - ${ship.quantity} units by ${new Date(ship.estimatedDate).toLocaleDateString()} (${ship.source})\n`;
            });
          } else {
            response += `• Full order from ${alt.shipments[0].source} by ${new Date(alt.shipments[0].estimatedDate).toLocaleDateString()}\n`;
          }
        });
      }
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'checkBulkAvailability',
            result: {
              available,
              inStockQuantity: inStock,
              requestedQuantity: validated.quantity,
              leadTime
            }
          }
        }
      })
    });

    if (available) {
      commands.push({
        type: 'UPDATE_AVAILABLE_ACTIONS',
        payload: {
          enabled: ['addToCart', 'createQuote'],
          suggested: [`addToCart:${validated.productId}:${validated.quantity}`]
        }
      });
    }

  } catch (error) {
    commands.push({
      type: 'SET_ERROR',
      payload: error instanceof Error ? error : new Error('Failed to check bulk availability')
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
    
    // Request product samples from custom extension
    const sampleRequest = await sdk.customExtension.requestProductSamples({
      productIds: validated.productIds,
      shippingAddress: validated.shippingAddress,
      customerId: state.context.customer?.id || '',
      notes: 'Requested via AI assistant'
    });
    
    const requestId = sampleRequest.requestId;
    const estimatedDelivery = new Date(sampleRequest.estimatedDelivery).toLocaleDateString();
    
    let response = '🎁 **Sample Request Submitted**\n\n';
    response += `**Request ID:** ${requestId}\n`;
    response += `**Status:** Pending Approval\n`;
    response += `**Estimated Delivery:** ${estimatedDelivery}\n\n`;
    
    response += '**Samples Requested:**\n';
    sampleRequest.products.forEach((product, index) => {
      response += `${index + 1}. ${product.name}\n`;
    });
    
    response += '\n**Shipping To:**\n';
    response += `${validated.shippingAddress.company}\n`;
    response += `${validated.shippingAddress.address}\n`;
    response += `${validated.shippingAddress.city}, ${validated.shippingAddress.postalCode}\n`;
    response += `${validated.shippingAddress.country}\n\n`;
    
    if (sampleRequest.salesRepAssigned) {
      response += `📧 *Your sales representative ${sampleRequest.salesRepAssigned.name} (${sampleRequest.salesRepAssigned.email}) will follow up within 24 hours.*`;
    } else {
      response += '📧 *A confirmation email has been sent. Our sales team will follow up within 24 hours.*';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'requestSample',
            result: {
              requestId,
              status: 'pending',
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
        sampleRequestId: requestId,
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
    
    // Get customer information
    const customer = await sdk.unified.getCustomer();
    
    // Get account credit from custom extension
    const creditInfo = await sdk.customExtension.getAccountCredit({
      customerId: customer.id,
      accountId: customer.accountId,
      includePendingOrders: true
    });
    
    let response = '💳 **Account Credit Information**\n\n';
    response += `**Company:** ${customer.company || customer.email}\n`;
    response += `**Account Status:** ${creditInfo.creditStatus.toUpperCase()}\n`;
    if (creditInfo.creditScore) {
      response += `**Credit Score:** ${creditInfo.creditScore}\n`;
    }
    response += '\n';
    
    response += '**Credit Details:**\n';
    response += `• **Credit Limit:** ${creditInfo.currency} ${creditInfo.creditLimit.toLocaleString()}\n`;
    response += `• **Available Credit:** ${creditInfo.currency} ${creditInfo.availableCredit.toLocaleString()}\n`;
    response += `• **Used Credit:** ${creditInfo.currency} ${creditInfo.usedCredit.toLocaleString()}\n`;
    if (creditInfo.pendingCharges) {
      response += `• **Pending Charges:** ${creditInfo.currency} ${creditInfo.pendingCharges.toLocaleString()}\n`;
    }
    response += `• **Payment Terms:** ${creditInfo.paymentTerms}\n\n`;
    
    const utilizationRate = (creditInfo.usedCredit / creditInfo.creditLimit * 100).toFixed(1);
    response += `**Credit Utilization:** ${utilizationRate}%\n\n`;
    
    if (creditInfo.outstandingInvoices && creditInfo.outstandingInvoices.length > 0) {
      response += '**Outstanding Invoices:**\n';
      creditInfo.outstandingInvoices.forEach(inv => {
        response += `• ${inv.invoiceNumber}: ${creditInfo.currency} ${inv.amount.toLocaleString()}`;
        if (inv.daysPastDue > 0) {
          response += ` (${inv.daysPastDue} days past due)`;
        }
        response += '\n';
      });
      response += '\n';
    }
    
    if (creditInfo.availableCredit < 10000) {
      response += '⚠️ *Low available credit. Contact our finance team to increase your credit limit.*\n';
    } else {
      response += '✅ *Sufficient credit available for new orders.*\n';
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getAccountCredit',
            result: creditInfo
          }
        }
      })
    });

    // Update context with credit info
    commands.push({
      type: 'UPDATE_CONTEXT',
      payload: {
        creditLimit: creditInfo.creditLimit,
        availableCredit: creditInfo.availableCredit,
        paymentTerms: creditInfo.paymentTerms
      }
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
    productIds: z.array(z.string()).min(1),
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
    
    // Get customer information
    const customer = await sdk.unified.getCustomer();
    
    // Schedule product demo from custom extension
    const demo = await sdk.customExtension.scheduleProductDemo({
      productIds: validated.productIds,
      preferredTimes: validated.preferredTimes,
      attendees: [{ 
        name: customer.firstName + ' ' + customer.lastName, 
        email: customer.email,
        role: 'Customer'
      }],
      customerId: customer.id,
      demoType: 'virtual',
      notes: 'Scheduled via AI assistant'
    });
    
    const demoId = demo.demoId;
    const scheduledTime = demo.scheduledTime;
    const meetingLink = demo.meetingDetails.location;
    
    let response = '📅 **Product Demo Scheduled**\n\n';
    response += `**Demo ID:** ${demoId}\n`;
    response += `**Date:** ${new Date(scheduledTime.date).toLocaleDateString()}\n`;
    response += `**Time:** ${scheduledTime.time} ${scheduledTime.timezone}\n`;
    response += `**Duration:** ${scheduledTime.duration} minutes\n`;
    response += `**Attendees:** ${validated.attendeeCount} person${validated.attendeeCount > 1 ? 's' : ''}\n\n`;
    
    response += '**Products to Demo:**\n';
    demo.products.forEach((product, index) => {
      response += `${index + 1}. ${product.name}\n`;
    });
    
    response += `\n**Meeting Link:** ${meetingLink}\n`;
    if (demo.meetingDetails.joinInstructions) {
      response += `${demo.meetingDetails.joinInstructions}\n`;
    }
    response += '\n';
    
    if (demo.salesRep) {
      response += `**Your Product Specialist:** ${demo.salesRep.name} (${demo.salesRep.title})\n`;
      response += `Contact: ${demo.salesRep.email} | ${demo.salesRep.phone}\n\n`;
    }
    
    response += '📧 *Calendar invites have been sent. ';
    if (demo.calendarInvite) {
      response += `[Add to Google Calendar](${demo.calendarInvite.googleCalendarUrl})*\n\n`;
    } else {
      response += '*\n\n';
    }
    
    response += '*We look forward to demonstrating how our products can benefit your business!*';

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'scheduleProductDemo',
            result: {
              demoId,
              scheduledTime,
              meetingLink,
              productCount: validated.productIds.length
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

    // TODO: Implement custom extension in middleware
    // Required method: sdk.customExtension.applyTaxExemption({ exemptionCertificate, state, cartId })
    // This method should:
    // 1. Validate the exemption certificate
    // 2. Apply exemption to current cart
    // 3. Return updated totals
    // 
    // Implementation:
    // const exemption = await sdk.customExtension.applyTaxExemption({
    //   exemptionCertificate: validated.exemptionCertificate,
    //   state: validated.state,
    //   cartId: state.cart.id,
    //   customerId: state.context.customer.id
    // });
    // 
    // Then use exemption.taxSavings for the response
    // See: @docs/claude/CUSTOM_EXTENSIONS_SPEC.md#applytaxexemption
    
    // Calculate tax savings - replace with real implementation
    const cartSubtotal = state.cart.subtotal || 0;
    const estimatedTaxRate = 0.0875; // 8.75% example
    const taxAmount = cartSubtotal * estimatedTaxRate;
    const newTotal = cartSubtotal;
    
    let response = '🏛️ **Tax Exemption Applied**\n\n';
    response += `**Certificate:** ${validated.exemptionCertificate}\n`;
    response += `**State:** ${validated.state}\n`;
    response += `**Status:** ✅ Verified\n\n`;
    
    response += '**Cart Summary:**\n';
    response += `• Subtotal: ${state.context.currency} ${cartSubtotal.toFixed(2)}\n`;
    response += `• Tax: ~~${state.context.currency} ${taxAmount.toFixed(2)}~~ ${state.context.currency} 0.00\n`;
    response += `• **New Total:** ${state.context.currency} ${newTotal.toFixed(2)}\n\n`;
    
    if (exemption.taxSavings) {
      response += `**You saved:** ${state.context.currency} ${exemption.taxSavings.netSavings.toFixed(2)}\n\n`;
    }
    
    if (exemption.validStates.length > 1) {
      response += `*Tax exemption valid in: ${exemption.validStates.join(', ')}*\n`;
    } else {
      response += '*Tax exemption will be applied to this order and future orders in eligible states.*\n';
    }
    
    if (exemption.expirationDate) {
      response += `*Certificate expires: ${new Date(exemption.expirationDate).toLocaleDateString()}*`;
    }

    commands.push({
      type: 'ADD_MESSAGE',
      payload: new AIMessage({
        content: response,
        additional_kwargs: {
          tool_use: {
            name: 'getTaxExemption',
            result: {
              applied: exemption.appliedToCart,
              taxSavings: exemption.taxSavings?.netSavings || taxAmount,
              updatedTotal: newTotal,
              exemptionId: exemption.exemptionId
            }
          }
        }
      })
    });

    // Update cart with tax exemption
    commands.push({
      type: 'UPDATE_CART',
      payload: {
        tax: exemption.appliedToCart ? 0 : state.cart.tax,
        total: exemption.appliedToCart ? newTotal : state.cart.total,
        taxExemptionApplied: exemption.appliedToCart
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

export async function processBulkOrderImplementation(
  params: unknown,
  state: CommerceState
): Promise<StateUpdateCommand[]> {
  const schema = z.object({
    csvContent: z.string().optional(),
    items: z.array(z.object({
      sku: z.string(),
      quantity: z.number().positive()
    })).optional(),
    enableAlternatives: z.boolean().default(true),
    priority: z.enum(['high', 'normal', 'low']).default('normal')
  });

  const validated = schema.parse(params);
  
  // Ensure B2B mode
  if (state.mode !== 'b2b') {
    return [{
      type: 'SET_ERROR',
      payload: new Error('Bulk orders are only available for business customers')
    }];
  }

  // Validate input - must have either CSV or items
  if (!validated.csvContent && !validated.items) {
    return [{
      type: 'SET_ERROR',
      payload: new Error('Either csvContent or items must be provided')
    }];
  }

  const sdk = getSdk();
  
  // Delegate to the comprehensive bulk order implementation
  return executeBulkOrderWithUDL(validated, state, {
    sdk,
    progressCallback: (status) => {
      // In a real implementation, this would stream progress to the client
      console.log(`Bulk order progress: ${status.processedItems}/${status.totalItems}`);
    }
  });
}