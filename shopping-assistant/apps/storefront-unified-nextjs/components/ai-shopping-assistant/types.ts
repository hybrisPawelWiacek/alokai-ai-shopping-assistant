import type { ReactNode } from 'react';

/**
 * Types for the AI Shopping Assistant frontend components
 */

export type ShoppingMode = 'b2c' | 'b2b';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ActionResult[];
  ui?: UIComponent;
  error?: string;
  mode?: ShoppingMode;
}

export interface ActionResult {
  type: string;
  data: any;
  success: boolean;
  message?: string;
}

export interface UIComponent {
  component: string;
  data: any;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  sessionId: string;
  mode: ShoppingMode;
  streamingMessage: string;
}

export interface StreamEvent {
  type: 'metadata' | 'content' | 'actions' | 'ui' | 'done' | 'error';
  data: any;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  mode?: ShoppingMode;
  context?: {
    cartId?: string;
    customerId?: string;
    locale?: string;
    currency?: string;
  };
  stream?: boolean;
}

export interface ChatResponse {
  message: string;
  actions?: ActionResult[];
  ui?: UIComponent;
  metadata: {
    sessionId: string;
    mode: ShoppingMode;
    processingTime: number;
    version: string;
  };
}

// Rich UI Component Props
export interface ProductGridResultProps {
  products: Array<{
    id: string;
    name: string;
    price: {
      value: number;
      currency: string;
    };
    image?: {
      url: string;
      alt: string;
    };
    rating?: number;
    inStock: boolean;
  }>;
  onProductClick?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

export interface ProductComparisonProps {
  products: Array<{
    id: string;
    name: string;
    price: {
      value: number;
      currency: string;
    };
    attributes: Record<string, any>;
    image?: {
      url: string;
      alt: string;
    };
  }>;
  highlightedAttributes?: string[];
}

export interface CartPreviewResultProps {
  cart: {
    id: string;
    items: Array<{
      id: string;
      productId: string;
      name: string;
      quantity: number;
      price: {
        value: number;
        currency: string;
      };
    }>;
    totals: {
      subtotal: number;
      tax: number;
      shipping: number;
      total: number;
      currency: string;
    };
  };
  addedItems?: string[];
  removedItems?: string[];
  onCheckout?: () => void;
}

export interface BulkUploadProgress {
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

// Hook types
export interface UseShoppingAssistantOptions {
  apiEndpoint?: string;
  defaultMode?: ShoppingMode;
  persistSession?: boolean;
  onError?: (error: Error) => void;
}

export interface UseShoppingAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  sessionId: string;
  mode: ShoppingMode;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  setMode: (mode: ShoppingMode) => void;
  retryLastMessage: () => Promise<void>;
}

// Component Props
export interface ChatInterfaceProps {
  className?: string;
  height?: string;
  showModeToggle?: boolean;
  placeholder?: string;
  welcomeMessage?: string;
  renderCustomAction?: (action: ActionResult) => ReactNode;
}

export interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  renderCustomAction?: (action: ActionResult) => ReactNode;
}

export interface ShoppingAssistantWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  triggerText?: string;
  triggerIcon?: ReactNode;
  className?: string;
}

// B2B Types
export interface BulkOrderItem {
  sku: string;
  quantity: number;
  notes?: string;
}

export interface BulkOrderResult {
  items: Array<{
    sku: string;
    productId?: string;
    name?: string;
    quantity: number;
    price?: number;
    available: boolean;
    alternatives?: Array<{
      productId: string;
      name: string;
      sku: string;
      price: number;
    }>;
  }>;
  summary: {
    totalItems: number;
    availableItems: number;
    unavailableItems: number;
    totalPrice: number;
    currency: string;
  };
}

export interface QuoteSummaryProps {
  quote: {
    id: string;
    items: BulkOrderResult['items'];
    summary: BulkOrderResult['summary'];
    validUntil: Date;
    customerInfo?: {
      company: string;
      contact: string;
      email: string;
    };
  };
  onApprove?: () => void;
  onReject?: () => void;
}