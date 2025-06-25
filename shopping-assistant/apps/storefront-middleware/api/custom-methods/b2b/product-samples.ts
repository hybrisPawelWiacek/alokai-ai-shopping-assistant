import { type IntegrationContext } from "../../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";
import type { RequestProductSamplesArgs, SampleRequestResponse, SampleProduct } from './types';

/**
 * Request product samples for B2B evaluation
 */
export async function requestProductSamples(
  context: IntegrationContext,
  args: RequestProductSamplesArgs
): Promise<SampleRequestResponse> {
  const { productIds, shippingAddress, customerId, notes } = args;
  
  try {
    // Validate B2B authorization
    const customer = await context.api.getCustomer();
    if (!customer.isB2B) {
      throw new Error('Product samples are only available for B2B customers');
    }
    
    // Verify customer access
    if (customerId !== customer.uid) {
      throw new Error('Customer ID mismatch');
    }
    
    // Validate products exist and are eligible for samples
    const { normalizeProduct } = getNormalizers(context);
    const productPromises = productIds.map(id => context.api.getProduct({ code: id }));
    const products = await Promise.all(productPromises);
    
    const sampleProducts: SampleProduct[] = products.map((product, index) => {
      if (!product) {
        throw new Error(`Product ${productIds[index]} not found`);
      }
      
      // Check if product is eligible for samples
      // In real implementation, this would check product flags
      const isEligible = product.price?.value > 50; // Only expensive items have samples
      
      return {
        productId: productIds[index],
        name: product.name,
        sampleSku: `SAMPLE-${product.code}`,
        approved: isEligible
      };
    });
    
    // Check if any products are not eligible
    const ineligibleProducts = sampleProducts.filter(p => !p.approved);
    if (ineligibleProducts.length > 0) {
      const names = ineligibleProducts.map(p => p.name).join(', ');
      throw new Error(`The following products are not eligible for samples: ${names}`);
    }
    
    // TODO: Real integration with CRM/order management system
    // const crmClient = await context.getApiClient("crm");
    // const sampleRequest = await crmClient.api.createSampleRequest({
    //   customerId: customer.uid,
    //   accountId: customer.accountId,
    //   products: sampleProducts,
    //   shippingAddress: shippingAddress,
    //   notes: notes
    // });
    
    // Access CMS for product materials if available
    let demoMaterials: Record<string, string[]> = {};
    try {
      const cmsClient = await context.getApiClient("cntf");
      // TODO: Fetch actual demo materials from CMS
      // For now, generate mock URLs
      productIds.forEach(id => {
        demoMaterials[id] = [
          `https://cdn.example.com/demos/${id}/datasheet.pdf`,
          `https://cdn.example.com/demos/${id}/installation-guide.pdf`
        ];
      });
    } catch (error) {
      console.warn('Could not fetch demo materials from CMS:', error);
    }
    
    // Generate sample request
    const requestId = `SR-${Date.now().toString(36).toUpperCase()}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 business days
    
    // Assign sales rep based on region or account
    const salesRep = assignSalesRep(customer, shippingAddress);
    
    // Update sample products with demo materials
    const enrichedProducts = sampleProducts.map(sp => ({
      ...sp,
      demoMaterials: demoMaterials[sp.productId]
    }));
    
    return {
      requestId,
      status: 'pending',
      products: enrichedProducts,
      estimatedDelivery: estimatedDelivery.toISOString(),
      trackingNumber: undefined, // Will be provided when shipped
      approvalRequired: sampleProducts.length > 3, // Require approval for many samples
      salesRepAssigned: salesRep
    };
    
  } catch (error) {
    console.error('Error in requestProductSamples:', error);
    throw error;
  }
}

function assignSalesRep(customer: any, address: any) {
  // Mock sales rep assignment based on region
  const reps = {
    'TX': { name: 'John Smith', email: 'john.smith@company.com', phone: '+1-555-0123' },
    'CA': { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', phone: '+1-555-0124' },
    'NY': { name: 'Michael Davis', email: 'michael.davis@company.com', phone: '+1-555-0125' },
    'FL': { name: 'Emily Wilson', email: 'emily.wilson@company.com', phone: '+1-555-0126' }
  };
  
  const stateRep = reps[address.state as keyof typeof reps];
  
  return stateRep || {
    name: 'General Sales Team',
    email: 'sales@company.com',
    phone: '+1-555-0100'
  };
}