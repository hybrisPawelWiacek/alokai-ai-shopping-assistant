/**
 * B2B Custom Extension Types
 * Based on CUSTOM_EXTENSIONS_SPEC.md
 */

// getBulkPricing types
export interface GetBulkPricingArgs {
  productId: string;
  quantities: number[];
  customerId?: string;
  accountId?: string;
}

export interface BulkPricingTier {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number; // percentage
  leadTime: string; // e.g., "5-7 business days"
  minimumOrderQuantity?: number;
}

export interface BulkPricingResponse {
  productId: string;
  currency: string;
  basePrice: number;
  pricingTiers: BulkPricingTier[];
  customPricingAvailable: boolean;
  contactForQuote?: {
    threshold: number;
    message: string;
  };
}

// checkBulkAvailability types
export interface CheckBulkAvailabilityArgs {
  productId: string;
  quantity: number;
  deliveryDate?: string; // ISO date
  warehouseIds?: string[];
}

export interface WarehouseAvailability {
  id: string;
  name: string;
  quantity: number;
  location: string;
}

export interface BulkAvailabilityResponse {
  productId: string;
  requestedQuantity: number;
  availableNow: number;
  totalAvailable: number;
  availability: {
    immediate: {
      quantity: number;
      warehouses: WarehouseAvailability[];
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

// requestProductSamples types
export interface RequestProductSamplesArgs {
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

export interface SampleProduct {
  productId: string;
  name: string;
  sampleSku: string;
  approved: boolean;
}

export interface SalesRep {
  name: string;
  email: string;
  phone: string;
}

export interface SampleRequestResponse {
  requestId: string;
  status: 'pending' | 'approved' | 'shipped' | 'delivered';
  products: SampleProduct[];
  estimatedDelivery: string;
  trackingNumber?: string;
  approvalRequired: boolean;
  salesRepAssigned?: SalesRep;
}

// getAccountCredit types
export interface GetAccountCreditArgs {
  customerId: string;
  accountId?: string;
  includePendingOrders?: boolean;
}

export interface OutstandingInvoice {
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;
}

export interface AccountCreditResponse {
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
  outstandingInvoices?: OutstandingInvoice[];
}

// scheduleProductDemo types
export interface ScheduleProductDemoArgs {
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

export interface DemoScheduledTime {
  date: string;
  time: string;
  timezone: string;
  duration: number; // minutes
}

export interface MeetingDetails {
  type: 'virtual' | 'in-person';
  location?: string; // URL for virtual, address for in-person
  joinInstructions?: string;
}

export interface DemoSalesRep {
  name: string;
  email: string;
  phone: string;
  title: string;
}

export interface DemoProduct {
  productId: string;
  name: string;
  demoMaterials?: string[]; // URLs to resources
}

export interface CalendarInvite {
  icsUrl: string;
  googleCalendarUrl?: string;
  outlookUrl?: string;
}

export interface ProductDemoResponse {
  demoId: string;
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled';
  scheduledTime: DemoScheduledTime;
  meetingDetails: MeetingDetails;
  salesRep: DemoSalesRep;
  products: DemoProduct[];
  calendarInvite: CalendarInvite;
}

// applyTaxExemption types
export interface ApplyTaxExemptionArgs {
  exemptionCertificate: string;
  state: string;
  cartId?: string;
  customerId: string;
  expirationDate?: string;
}

export interface TaxSavings {
  originalTax: number;
  exemptedTax: number;
  netSavings: number;
}

export interface VerificationDetails {
  verifiedAt: string;
  verifiedBy: string;
  method: 'manual' | 'automated';
}

export interface TaxExemptionResponse {
  exemptionId: string;
  certificateNumber: string;
  status: 'active' | 'expired' | 'invalid' | 'pending';
  validStates: string[];
  appliedToCart: boolean;
  taxSavings?: TaxSavings;
  expirationDate: string;
  verificationDetails: VerificationDetails;
}