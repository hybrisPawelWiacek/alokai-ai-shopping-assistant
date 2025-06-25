import { Maybe } from '@/types';
import type { SfCategory, SfProduct } from '@/types';

export interface AssistantMessage {
  content: string;
  productData?: {
    categoryHierarchy: SfCategory[];
    product: SfProduct;
  }[];
  role: 'assistant' | 'user';
  searchResults?: {
    products: SfProduct[];
    totalResults?: number;
    query?: string;
    timestamp?: string;
  };
  ui?: UIResponse;
}

export type AssistantActionType = 'ADD_TO_CART' | 'CHECKOUT' | 'GET_PRODUCT' | 'SEARCH_PRODUCTS' | 'UPDATE_CART' | 'GET_CART' | 'REMOVE_FROM_CART' | 'UPDATE_CART_ITEM';

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  sku: Maybe<string>;
}

export interface SearchProductsPayload {
  limit?: number;
  query: string;
}

export interface GetProductPayload {
  productId: string;
}

export interface UpdateCartPayload {
  lineItemId: string;
  quantity: number;
}

export interface RemoveFromCartPayload {
  lineItemId: string;
}

export type AssistantActionPayload =
  | AddToCartPayload
  | GetProductPayload
  | Record<string, never>
  | SearchProductsPayload
  | UpdateCartPayload
  | RemoveFromCartPayload;

export interface AssistantAction {
  payload: Record<string, unknown> & AssistantActionPayload;
  type: AssistantActionType;
}

export type UIComponentType = 'ProductGrid' | 'ErrorMessage' | 'SearchResults' | 'CartPreview';

export interface SearchResultsData {
  products: Array<{
    id: string;
    name: string;
    images: Array<{ url: string }>;
    price: { regular: number };
  }>;
  totalResults: number;
  query: string;
}

export interface ProductGridData {
  products: Array<{
    id: string;
    name: string;
    images: Array<{ url: string }>;
    price: { regular: number };
  }>;
}

export interface CartPreviewData {
  items: Array<{
    productId: string;
    quantity: number;
    name: string;
    price: number;
  }>;
  total: number;
}

export interface ErrorMessageData {
  message: string;
  suggestions: string[];
}

export type UIComponentData = {
  SearchResults: SearchResultsData;
  ProductGrid: ProductGridData;
  CartPreview: CartPreviewData;
  ErrorMessage: ErrorMessageData;
}

export interface UIResponse {
  component: UIComponentType;
  data: UIComponentData[UIComponentType];
}

export interface AssistantResponse {
  actions?: AssistantAction[];
  content?: string;
  ui?: UIResponse;
  productData?: {
    categoryHierarchy: SfCategory[];
    product: SfProduct;
    productUrl?: string;
  }[];
  searchResults?: {
    products: SfProduct[];
    totalResults?: number;
    query?: string;
    timestamp?: string;
  };
}

export interface AssistantContext {
  cartItems?: {
    productId: string;
    quantity: number;
    lineItemId: string;
  }[];
  currentPage?: string;
  lastAction?: AssistantAction;
  messageHistory?: AssistantMessage[];
}

export class AssistantError extends Error {
  public constructor(
    message: string,
    public readonly code: 'API' | 'INITIALIZATION' | 'SDK' | 'UNKNOWN' | 'VALIDATION',
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'AssistantError';
  }
}
