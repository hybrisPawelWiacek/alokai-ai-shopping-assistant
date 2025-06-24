'use client';

import { useRef, useEffect, useState, FormEvent } from 'react';
import { SfButton, SfInput, SfIconSend, SfChip, SfIconSwap } from '@storefront-ui/react';
import classNames from 'classnames';
import { useShoppingAssistant } from '@/hooks/use-shopping-assistant';
import MessageList from './messages/message-list';
import TypingIndicator from './messages/typing-indicator';
import type { ChatInterfaceProps } from './types';

export default function ChatInterface({
  className,
  height = '600px',
  showModeToggle = true,
  placeholder = 'Ask me anything about our products...',
  welcomeMessage = 'Hello! I\'m your AI shopping assistant. How can I help you today?',
  renderCustomAction,
}: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    mode,
    sendMessage,
    clearMessages,
    setMode,
    retryLastMessage,
  } = useShoppingAssistant();

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show welcome message if no messages
  const showWelcome = messages.length === 0;

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && !isStreaming) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  // Handle mode toggle
  const handleModeToggle = () => {
    setMode(mode === 'b2c' ? 'b2b' : 'b2c');
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div
      className={classNames(
        'flex flex-col bg-neutral-50 rounded-lg shadow-lg overflow-hidden',
        className
      )}
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-700 text-white">
        <h2 className="text-lg font-semibold">AI Shopping Assistant</h2>
        <div className="flex items-center gap-2">
          {showModeToggle && (
            <button
              onClick={handleModeToggle}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600 hover:bg-primary-500 transition-colors"
              aria-label={`Switch to ${mode === 'b2c' ? 'B2B' : 'B2C'} mode`}
            >
              <SfIconSwap size="sm" />
              <span className="text-sm font-medium">
                {mode === 'b2c' ? 'B2C' : 'B2B'} Mode
              </span>
            </button>
          )}
          <SfButton
            variant="tertiary"
            size="sm"
            onClick={clearMessages}
            className="text-white hover:text-neutral-100"
          >
            Clear
          </SfButton>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showWelcome && (
          <div className="text-center py-8">
            <p className="text-neutral-600 mb-4">{welcomeMessage}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <SfChip
                size="sm"
                className="cursor-pointer hover:bg-neutral-200"
                onClick={() => sendMessage('Show me your best sellers')}
              >
                Best Sellers
              </SfChip>
              <SfChip
                size="sm"
                className="cursor-pointer hover:bg-neutral-200"
                onClick={() => sendMessage('I need help finding a gift')}
              >
                Gift Ideas
              </SfChip>
              <SfChip
                size="sm"
                className="cursor-pointer hover:bg-neutral-200"
                onClick={() => sendMessage('What\'s on sale?')}
              >
                Current Deals
              </SfChip>
              {mode === 'b2b' && (
                <SfChip
                  size="sm"
                  className="cursor-pointer hover:bg-neutral-200"
                  onClick={() => sendMessage('I need to order in bulk')}
                >
                  Bulk Order
                </SfChip>
              )}
            </div>
          </div>
        )}

        <MessageList
          messages={messages}
          renderCustomAction={renderCustomAction}
        />

        {isStreaming && <TypingIndicator />}

        {error && (
          <div className="flex items-center justify-between p-3 bg-negative-100 text-negative-700 rounded-md">
            <span className="text-sm">{error}</span>
            <SfButton
              variant="tertiary"
              size="sm"
              onClick={retryLastMessage}
              className="text-negative-700 hover:text-negative-800"
            >
              Retry
            </SfButton>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 bg-white">
        <div className="flex gap-2">
          <SfInput
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || isStreaming}
            className="flex-1"
            slotSuffix={
              <div className="flex items-center pr-2">
                {mode === 'b2b' && (
                  <SfChip size="sm" className="mr-2 bg-secondary-100">
                    B2B
                  </SfChip>
                )}
              </div>
            }
          />
          <SfButton
            type="submit"
            disabled={!inputValue.trim() || isLoading || isStreaming}
            className="!px-3"
            aria-label="Send message"
          >
            <SfIconSend />
          </SfButton>
        </div>
        {isLoading && !isStreaming && (
          <p className="text-xs text-neutral-500 mt-2">Processing your request...</p>
        )}
      </form>
    </div>
  );
}