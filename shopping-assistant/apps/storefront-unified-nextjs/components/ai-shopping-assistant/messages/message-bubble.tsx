'use client';

import { useMemo } from 'react';
import classNames from 'classnames';
import { SfIconPerson, SfIconSmartphone } from '@storefront-ui/react';
import type { MessageBubbleProps } from '../types';
import ActionButtons from '../results/action-buttons';
import ProductGridResult from '../results/product-grid-result';
import ProductComparison from '../results/product-comparison';
import CartPreviewResult from '../results/cart-preview-result';

export default function MessageBubble({
  message,
  isStreaming = false,
  renderCustomAction,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  // Parse message content for structured data
  const parsedContent = useMemo(() => {
    if (isUser || !message.content) {
      return { text: message.content, structuredData: null };
    }

    // Check if content contains JSON structured data
    try {
      const jsonMatch = message.content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        const textWithoutJson = message.content.replace(jsonMatch[0], '').trim();
        return { text: textWithoutJson, structuredData: jsonData };
      }
    } catch (error) {
      // Not JSON, treat as plain text
    }

    return { text: message.content, structuredData: null };
  }, [message.content, isUser]);

  // Render UI component based on type
  const renderUIComponent = () => {
    if (!message.ui) return null;

    const { component, data } = message.ui;

    switch (component) {
      case 'ProductGrid':
        return <ProductGridResult products={data.products} />;
      
      case 'ProductComparison':
        return <ProductComparison products={data.products} highlightedAttributes={data.highlightedAttributes} />;
      
      case 'CartPreview':
        return <CartPreviewResult cart={data.cart} addedItems={data.addedItems} removedItems={data.removedItems} />;
      
      default:
        return null;
    }
  };

  // Render actions
  const renderActions = () => {
    if (!message.actions || message.actions.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {message.actions.map((action, index) => {
          if (renderCustomAction) {
            const custom = renderCustomAction(action);
            if (custom) return <div key={index}>{custom}</div>;
          }

          return <ActionButtons key={index} actions={[action]} />;
        })}
      </div>
    );
  };

  return (
    <div
      className={classNames(
        'flex gap-3',
        isUser && 'justify-end',
        isAssistant && 'justify-start'
      )}
    >
      {/* Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <SfIconSmartphone size="sm" className="text-primary-700" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={classNames(
          'max-w-[70%] rounded-lg px-4 py-2',
          isUser && 'bg-primary-600 text-white',
          isAssistant && 'bg-white border border-neutral-200',
          message.error && 'bg-negative-100 border-negative-200 text-negative-700'
        )}
      >
        {/* Text Content */}
        {parsedContent.text && (
          <div
            className={classNames(
              'text-sm whitespace-pre-wrap',
              isStreaming && 'animate-pulse'
            )}
          >
            {parsedContent.text}
            {isStreaming && <span className="inline-block w-2 h-4 bg-current animate-blink ml-1" />}
          </div>
        )}

        {/* Error Message */}
        {message.error && (
          <div className="text-sm font-medium">
            Error: {message.error}
          </div>
        )}

        {/* Structured Data */}
        {parsedContent.structuredData && (
          <div className="mt-2 p-2 bg-neutral-50 rounded text-xs font-mono overflow-x-auto">
            <pre>{JSON.stringify(parsedContent.structuredData, null, 2)}</pre>
          </div>
        )}

        {/* UI Components */}
        {!isStreaming && renderUIComponent()}

        {/* Actions */}
        {!isStreaming && renderActions()}

        {/* Timestamp */}
        <div
          className={classNames(
            'text-xs mt-1',
            isUser && 'text-primary-100',
            isAssistant && 'text-neutral-500'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {message.mode === 'b2b' && (
            <span className="ml-2 inline-block px-1 py-0.5 bg-secondary-100 text-secondary-700 rounded text-xs">
              B2B
            </span>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
          <SfIconPerson size="sm" className="text-neutral-700" />
        </div>
      )}
    </div>
  );
}