# Custom Extensions Specification for B2B Operations

This document specifies the custom extension methods that need to be implemented in the Alokai middleware layer to support B2B operations. These methods extend the Unified Data Layer (UDL) with business-specific functionality.

## Overview

All custom extensions should be implemented in:
```
storefront-middleware/integrations/<your-integration>/extensions/unified.ts
```

They are accessed via `sdk.customExtension.*` in the frontend code.

## Custom Extension Methods

### 1. getBulkPricing

Retrieves tiered pricing for bulk quantities of a product.

**Method Signature:**
```typescript
async getBulkPricing(
  context: IntegrationContext,
  args: {
    productId: string;
    quantities: number[];
    customerId?: string;
    accountId?: string;
  }
): Promise<BulkPricingResponse>
```

**Response Structure:**
```typescript
interface BulkPricingResponse {
  productId: string;
  currency: string;
  basePrice: number;
  pricingTiers: Array<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number; // percentage
    leadTime: string; // e.g., "5-7 business days"
    minimumOrderQuantity?: number;
  }>;
  customPricingAvailable: boolean;
  contactForQuote?: {
    threshold: number;
    message: string;
  };
}
```

**Implementation Requirements:**
- Connect to ERP/pricing system to get volume discounts
- Calculate discounts based on customer tier and order history
- Include lead times that vary by quantity
- Return custom pricing flag for negotiated rates
- Handle quantities above 10,000 with "contact for quote"

**Error Scenarios:**
- Invalid product ID → 404 Not Found
- Unauthorized customer → 403 Forbidden
- Pricing service unavailable → 503 Service Unavailable

### 2. checkBulkAvailability

Checks inventory availability for large quantities across warehouses.

**Method Signature:**
```typescript
async checkBulkAvailability(
  context: IntegrationContext,
  args: {
    productId: string;
    quantity: number;
    deliveryDate?: string; // ISO date
    warehouseIds?: string[];
  }
): Promise<BulkAvailabilityResponse>
```

**Response Structure:**
```typescript
interface BulkAvailabilityResponse {
  productId: string;
  requestedQuantity: number;
  availableNow: number;
  totalAvailable: number;
  availability: {
    immediate: {
      quantity: number;
      warehouses: Array<{
        id: string;
        name: string;
        quantity: number;
        location: string;
      }>;
    };
    production: {
      quantity: number;
      leadTime: number; // days
      estimatedDate: string;
    };
    alternatives: Array<{
      splitShipment: boolean;
      shipments: Array<{
        quantity: number;
        estimatedDate: string;
        source: 'warehouse' | 'production';
      }>;
    }>;
  };
}
```

**Implementation Requirements:**
- Query multiple warehouse systems
- Check production schedules if stock insufficient
- Calculate optimal fulfillment options
- Provide split shipment alternatives
- Consider delivery date constraints

**Error Scenarios:**
- Product discontinued → 410 Gone
- Invalid warehouse IDs → 400 Bad Request
- Inventory system timeout → 504 Gateway Timeout

### 3. requestProductSamples

Creates a sample request for B2B customers to evaluate products.

**Method Signature:**
```typescript
async requestProductSamples(
  context: IntegrationContext,
  args: {
    productIds: string[];
    shippingAddress: {
      company: string;
      attention?: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    customerId: string;
    notes?: string;
  }
): Promise<SampleRequestResponse>
```

**Response Structure:**
```typescript
interface SampleRequestResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'shipped' | 'delivered';
  products: Array<{
    productId: string;
    name: string;
    sampleSku: string;
    approved: boolean;
  }>;
  estimatedDelivery: string;
  trackingNumber?: string;
  approvalRequired: boolean;
  salesRepAssigned?: {
    name: string;
    email: string;
    phone: string;
  };
}
```

**Implementation Requirements:**
- Create request in CRM system
- Check sample eligibility per product
- Assign to sales representative
- Generate unique request ID
- Send notification emails
- Track sample history per customer

**Error Scenarios:**
- Sample limit exceeded → 429 Too Many Requests
- Product not eligible for samples → 400 Bad Request
- Invalid address → 422 Unprocessable Entity

### 4. getAccountCredit

Retrieves credit information for B2B accounts from financial systems.

**Method Signature:**
```typescript
async getAccountCredit(
  context: IntegrationContext,
  args: {
    customerId: string;
    accountId?: string;
    includePendingOrders?: boolean;
  }
): Promise<AccountCreditResponse>
```

**Response Structure:**
```typescript
interface AccountCreditResponse {
  accountId: string;
  customerId: string;
  creditLimit: number;
  availableCredit: number;
  usedCredit: number;
  pendingCharges?: number;
  currency: string;
  paymentTerms: string; // e.g., "Net 30"
  creditStatus: 'active' | 'hold' | 'suspended';
  creditScore?: string; // e.g., "A+", "B"
  lastReviewDate: string;
  nextReviewDate: string;
  outstandingInvoices?: Array<{
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
  }>;
}
```

**Implementation Requirements:**
- Integrate with ERP/accounting system
- Calculate real-time available credit
- Include pending order amounts if requested
- Check payment history
- Return outstanding invoice details

**Error Scenarios:**
- Customer not found → 404 Not Found
- Credit check service down → 503 Service Unavailable
- Unauthorized access → 403 Forbidden

### 5. scheduleProductDemo

Books a product demonstration with sales team.

**Method Signature:**
```typescript
async scheduleProductDemo(
  context: IntegrationContext,
  args: {
    productIds: string[];
    preferredTimes: Array<{
      date: string;
      time: string;
      timezone: string;
    }>;
    attendees: Array<{
      name: string;
      email: string;
      role?: string;
    }>;
    customerId: string;
    demoType: 'virtual' | 'in-person';
    notes?: string;
  }
): Promise<ProductDemoResponse>
```

**Response Structure:**
```typescript
interface ProductDemoResponse {
  demoId: string;
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled';
  scheduledTime: {
    date: string;
    time: string;
    timezone: string;
    duration: number; // minutes
  };
  meetingDetails: {
    type: 'virtual' | 'in-person';
    location?: string; // URL for virtual, address for in-person
    joinInstructions?: string;
  };
  salesRep: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };
  products: Array<{
    productId: string;
    name: string;
    demoMaterials?: string[]; // URLs to resources
  }>;
  calendarInvite: {
    icsUrl: string;
    googleCalendarUrl?: string;
    outlookUrl?: string;
  };
}
```

**Implementation Requirements:**
- Check sales team calendar availability
- Create calendar booking
- Send meeting invitations
- Assign appropriate sales specialist
- Generate meeting links for virtual demos
- Prepare demo materials

**Error Scenarios:**
- No availability in preferred times → 409 Conflict
- Too many attendees → 400 Bad Request
- Invalid timezone → 422 Unprocessable Entity

### 6. applyTaxExemption

Applies tax exemption certificate to orders.

**Method Signature:**
```typescript
async applyTaxExemption(
  context: IntegrationContext,
  args: {
    exemptionCertificate: string;
    state: string;
    cartId?: string;
    customerId: string;
    expirationDate?: string;
  }
): Promise<TaxExemptionResponse>
```

**Response Structure:**
```typescript
interface TaxExemptionResponse {
  exemptionId: string;
  certificateNumber: string;
  status: 'active' | 'expired' | 'invalid' | 'pending';
  validStates: string[];
  appliedToCart: boolean;
  taxSavings?: {
    originalTax: number;
    exemptedTax: number;
    netSavings: number;
  };
  expirationDate: string;
  verificationDetails: {
    verifiedAt: string;
    verifiedBy: string;
    method: 'manual' | 'automated';
  };
}
```

**Implementation Requirements:**
- Validate certificate with tax authority APIs
- Store certificate for future orders
- Apply to current cart if provided
- Calculate tax savings
- Handle multi-state exemptions
- Track expiration dates

**Error Scenarios:**
- Invalid certificate → 422 Unprocessable Entity
- Certificate expired → 410 Gone
- State not covered → 400 Bad Request
- Tax service unavailable → 503 Service Unavailable

## Implementation Guidelines

### Authentication & Authorization
All methods must:
- Verify the customer is authenticated
- Check B2B account status
- Validate account permissions
- Log all access attempts

### Error Handling
- Use standard HTTP status codes
- Return detailed error messages for debugging
- Log errors with correlation IDs
- Implement retry logic for external services

### Performance Requirements
- Response time < 2 seconds for all methods
- Implement caching where appropriate
- Use connection pooling for external services
- Support concurrent requests

### Integration Patterns
```typescript
// Example implementation structure
export const customExtension = {
  async getBulkPricing(context, args) {
    // 1. Validate input
    validateBulkPricingArgs(args);
    
    // 2. Check customer authorization
    const customer = await context.api.getCustomer();
    if (!customer.isB2B) {
      throw new Error('B2B account required');
    }
    
    // 3. Call external service
    const pricingService = context.getExternalService('pricing');
    const pricing = await pricingService.getBulkPricing({
      sku: args.productId,
      quantities: args.quantities,
      customerId: customer.erpId
    });
    
    // 4. Transform response to UDL format
    return transformToBulkPricingResponse(pricing);
  }
};
```

### Testing Requirements
Each method should have:
- Unit tests with mocked external services
- Integration tests with test accounts
- Performance tests under load
- Error scenario tests

## Migration from Frontend TODOs

The frontend code currently has TODO comments indicating where these methods should be called. Once implemented:

1. Remove the simulated logic in the frontend
2. Replace with actual SDK calls
3. Update error handling for real responses
4. Add proper loading states
5. Test with real B2B accounts

## Next Steps

1. Prioritize implementation based on business needs
2. Set up external service connections
3. Implement methods incrementally
4. Test with pilot B2B customers
5. Monitor performance and errors
6. Iterate based on feedback

---

*Last updated: June 2025 - PROMPT 13 Verification*