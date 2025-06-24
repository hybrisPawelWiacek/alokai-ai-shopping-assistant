// Main components
export { default as ChatInterface } from './chat-interface';
export { default as ShoppingAssistantWidget } from './widget/shopping-assistant-widget';
export { ShoppingAssistantProvider, useShoppingAssistantContext } from './widget/shopping-assistant-provider';

// Message components
export { default as MessageBubble } from './messages/message-bubble';
export { default as MessageList } from './messages/message-list';
export { default as TypingIndicator } from './messages/typing-indicator';

// Result components
export { default as ActionButtons } from './results/action-buttons';
export { default as ProductGridResult } from './results/product-grid-result';
export { default as ProductComparison } from './results/product-comparison';
export { default as CartPreviewResult } from './results/cart-preview-result';

// B2B components
export { default as BulkUploadModal } from './b2b/bulk-upload-modal';
export { default as BulkOrderProgress } from './b2b/bulk-order-progress';
export { default as QuoteSummary } from './b2b/quote-summary';

// Types
export type {
  ShoppingMode,
  Message,
  ActionResult,
  UIComponent,
  ChatState,
  StreamEvent,
  ChatRequest,
  ChatResponse,
  ProductGridResultProps,
  ProductComparisonProps,
  CartPreviewResultProps,
  BulkUploadProgress,
  UseShoppingAssistantOptions,
  UseShoppingAssistantReturn,
  ChatInterfaceProps,
  MessageBubbleProps,
  ShoppingAssistantWidgetProps,
  BulkOrderItem,
  BulkOrderResult,
  QuoteSummaryProps,
} from './types';