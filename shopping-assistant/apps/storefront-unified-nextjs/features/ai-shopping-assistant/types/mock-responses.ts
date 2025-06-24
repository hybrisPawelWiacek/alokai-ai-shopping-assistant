/**
 * Type definitions for mock responses following Alokai UDL structure
 * These types extend from real UDL types to ensure consistency
 * Use these types when creating mock data to match real SDK responses
 */

import type {
  SfProduct,
  SfProductCatalogItem,
  SfCategory,
  SfCart,
  SfCartLineItem,
  SfCustomer,
  SfMoney,
  SfImage,
  SfProductAttribute,
  SfProductVariant,
  SfDiscountablePrice
} from '@/types';

/**
 * Price structure following UDL format
 * Extends from SfMoney for consistency
 */
export interface UDLPrice extends SfMoney {
  // SfMoney already has amount, currency, precisionAmount
}

/**
 * Price information with regular/special pricing
 * Based on SfDiscountablePrice structure
 */
export interface UDLPriceInfo extends SfDiscountablePrice {
  // SfDiscountablePrice already has value, isDiscounted, regular fields
  special?: SfMoney; // Add special price for compatibility
}

/**
 * Image structure
 * Extends from SfImage
 */
export interface UDLImage extends SfImage {
  // SfImage already has url, alt
  label?: string; // Add label for additional context
}

/**
 * Category structure with breadcrumbs
 * Extends from SfCategory
 */
export interface UDLCategory extends SfCategory {
  // SfCategory already has id, name, slug, subcategories
  breadcrumbs?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

/**
 * Product rating
 */
export interface UDLRating {
  average: number;
  count: number;
  distribution?: Record<number, number>;
}

/**
 * Inventory information
 */
export interface UDLInventory {
  isInStock: boolean;
  availableQuantity?: number;
  lowStockThreshold?: number;
}

/**
 * Product variant
 */
export interface UDLVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, any>;
  price: {
    regular: UDLPrice;
    special?: UDLPrice;
  };
  inventory: UDLInventory;
}

/**
 * Base product structure for search results
 * Extends from SfProductCatalogItem
 */
export interface UDLProductBase extends SfProductCatalogItem {
  // SfProductCatalogItem already has id, sku, name, slug, price, primaryImage, rating
  inventory?: UDLInventory;
  categories?: UDLCategory[];
}

/**
 * Full product details structure
 * Extends from SfProduct for complete product data
 */
export interface UDLProductDetails extends SfProduct {
  description: string;
  shortDescription?: string;
  gallery: UDLImage[];
  attributes: Record<string, any>;
  variants?: UDLVariant[];
  seo?: {
    title: string;
    description: string;
    keywords?: string[];
  };
  relatedProducts?: string[];
  crossSellProducts?: string[];
  availability?: string;
  shipping?: {
    freeShippingThreshold?: number;
    estimatedDelivery?: string;
    expeditedAvailable?: boolean;
  };
  // B2B specific fields
  bulkPricing?: Array<{
    minQuantity: number;
    unitPrice: number;
  }>;
}

/**
 * Search facet value
 */
export interface UDLFacetValue {
  value: string;
  label: string;
  count: number;
}

/**
 * Search facet
 */
export interface UDLFacet {
  name: string;
  label: string;
  type: 'multi-select' | 'range' | 'single-select';
  values?: UDLFacetValue[];
  min?: number;
  max?: number;
}

/**
 * Pagination information
 */
export interface UDLPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Search products response
 */
export interface UDLSearchResponse {
  products: UDLProductBase[];
  pagination: UDLPagination;
  facets: UDLFacet[];
}

/**
 * Cart line item
 * Extends from SfCartLineItem
 */
export interface UDLCartItem extends SfCartLineItem {
  // SfCartLineItem already has id, productId, variantId, sku, name, quantity, price, image
  // All necessary fields are already in the base type
}

/**
 * Cart structure
 * Extends from SfCart
 */
export interface UDLCart extends SfCart {
  // SfCart already has id, lineItems, totalPrice, subtotalPrice, totalTax, shippingPrice, appliedCoupons
  taxExempt?: boolean; // Add B2B-specific field
}

/**
 * Customer information
 * Extends from SfCustomer
 */
export interface UDLCustomer extends SfCustomer {
  // SfCustomer already has id, email, firstName, lastName
  company?: string; // Add B2B fields
  isB2B?: boolean;
  creditLimit?: number;
  taxExempt?: boolean;
  addresses?: Array<{
    id: string;
    type: 'billing' | 'shipping';
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
}

/**
 * Shipping method
 */
export interface UDLShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: UDLPrice;
  estimatedDays?: number;
  note?: string;
}

/**
 * Custom extension response types
 */
export namespace CustomExtensionTypes {
  export interface BulkPricingTier {
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    leadTime: string;
    discount: number;
  }

  export interface BulkPricingResponse {
    productId: string;
    pricingTiers: BulkPricingTier[];
    minimumOrderQuantity: number;
    currency: string;
  }

  export interface SimilarProduct {
    product: UDLProductBase;
    similarity: number;
    reasons: string[];
  }
}

/**
 * Helper type for mock delay configuration
 */
export interface MockDelayConfig {
  min: number;
  max: number;
  errorRate?: number;
}

/**
 * Mock SDK configuration
 */
export interface MockSdkConfig {
  delays?: {
    search?: MockDelayConfig;
    productDetails?: MockDelayConfig;
    cart?: MockDelayConfig;
    custom?: MockDelayConfig;
  };
  errorSimulation?: {
    enabled: boolean;
    rate: number;
  };
  dataVariation?: {
    randomizeInventory?: boolean;
    randomizePrices?: boolean;
    outOfStockRate?: number;
  };
}