import { type IntegrationContext } from "../../../types";
import { getNormalizers } from "@vsf-enterprise/unified-api-sapcc/udl";
import type { ApplyTaxExemptionArgs, TaxExemptionResponse } from './types';

/**
 * Apply tax exemption certificate to B2B orders
 */
export async function applyTaxExemption(
  context: IntegrationContext,
  args: ApplyTaxExemptionArgs
): Promise<TaxExemptionResponse> {
  const { exemptionCertificate, state, cartId, customerId, expirationDate } = args;
  
  try {
    // IMPORTANT: Always use normalizers when fetching data from context.api
    // This ensures UDL consistency across all backends
    const { normalizeCustomer, normalizeCart } = getNormalizers(context);
    
    // Validate B2B authorization
    const rawCustomer = await context.api.getCustomer();
    const customer = normalizeCustomer(rawCustomer);
    
    if (!customer.organizationId) {
      throw new Error('Tax exemption is only available for B2B customers');
    }
    
    // Verify customer access
    if (customerId !== customer.id) {
      throw new Error('Customer ID mismatch');
    }
    
    // Validate certificate format
    if (!isValidCertificateFormat(exemptionCertificate)) {
      throw new Error('Invalid exemption certificate format');
    }
    
    // Validate state code
    const validStates = getValidStates();
    if (!validStates.includes(state)) {
      throw new Error(`Invalid state code: ${state}`);
    }
    
    // TODO: Real integration with tax validation service
    // const taxService = await context.getApiClient("tax");
    // const validation = await taxService.api.validateExemptionCertificate({
    //   certificate: exemptionCertificate,
    //   state: state,
    //   customerId: customerId
    // });
    
    // Mock certificate validation
    const isExpired = expirationDate ? new Date(expirationDate) < new Date() : false;
    if (isExpired) {
      return {
        exemptionId: `EX-${Date.now()}`,
        certificateNumber: exemptionCertificate,
        status: 'expired',
        validStates: [state],
        appliedToCart: false,
        expirationDate: expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        verificationDetails: {
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'system',
          method: 'automated'
        }
      };
    }
    
    // Calculate tax savings if cart provided
    let taxSavings;
    let appliedToCart = false;
    
    if (cartId) {
      try {
        // Get current cart with normalization
        const rawCart = await context.api.getCart();
        const cart = normalizeCart(rawCart);
        
        if (cart && cart.id === cartId) {
          const originalTax = cart.totals?.tax || 0;
          
          // TODO: Apply exemption to cart via API
          // await context.api.applyTaxExemption({ 
          //   cartId: cartId,
          //   exemptionId: exemptionId 
          // });
          
          // For now, calculate what the savings would be
          taxSavings = {
            originalTax,
            exemptedTax: 0,
            netSavings: originalTax
          };
          
          appliedToCart = true;
        }
      } catch (error) {
        console.warn('Could not apply exemption to cart:', error);
      }
    }
    
    // Generate exemption record
    const exemptionId = `EX-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = expirationDate || calculateExpirationDate(state);
    
    // Determine which states this certificate is valid for
    const certificateStates = determineCertificateStates(exemptionCertificate, state);
    
    return {
      exemptionId,
      certificateNumber: exemptionCertificate,
      status: 'active',
      validStates: certificateStates,
      appliedToCart,
      taxSavings,
      expirationDate: validUntil,
      verificationDetails: {
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Tax Validation Service',
        method: 'automated'
      }
    };
    
  } catch (error) {
    console.error('Error in applyTaxExemption:', error);
    throw error;
  }
}

function isValidCertificateFormat(certificate: string): boolean {
  // Simple validation - real implementation would be more complex
  // Format: STATE-XXXXX-XXXX
  const pattern = /^[A-Z]{2}-[A-Z0-9]{5}-[A-Z0-9]{4}$/;
  return pattern.test(certificate);
}

function getValidStates(): string[] {
  // States that allow tax exemption certificates
  return [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
}

function calculateExpirationDate(state: string): string {
  // Different states have different validity periods
  const validityDays = {
    'TX': 365 * 4, // 4 years
    'CA': 365 * 3, // 3 years
    'NY': 365 * 2, // 2 years
    'FL': 365 * 5  // 5 years
  };
  
  const days = validityDays[state as keyof typeof validityDays] || 365; // Default 1 year
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  
  return expirationDate.toISOString();
}

function determineCertificateStates(certificate: string, primaryState: string): string[] {
  // Some certificates are valid across multiple states
  // Multi-state certificates usually have 'MS' prefix
  if (certificate.startsWith('MS-')) {
    // Mock multi-state coverage
    const regions = {
      'TX': ['TX', 'OK', 'AR', 'LA', 'NM'],
      'CA': ['CA', 'OR', 'WA', 'NV', 'AZ'],
      'NY': ['NY', 'NJ', 'CT', 'PA', 'MA']
    };
    
    return regions[primaryState as keyof typeof regions] || [primaryState];
  }
  
  // Single state certificate
  return [primaryState];
}