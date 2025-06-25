'use client';

import { SfButton } from '@storefront-ui/react';
import dynamic from 'next/dynamic';
import { memo, useEffect, useRef, useState } from 'react';

import { AssistantMessage, UIComponentData, UIComponentType } from '../types';
import { useAssistant } from '../hooks/useAssistant';



interface MessageContentProps {
  message: AssistantMessage;
}

const DynamicComponents: Record<UIComponentType, React.ComponentType<any>> = {
  SearchResults: dynamic(() => import('./ui/SearchResults'), {
    loading: () => <div>Loading search results...</div>,
    ssr: false,
  }),
  ProductGrid: dynamic(() => import('./ui/ProductGrid'), {
    loading: () => <div>Loading products...</div>,
    ssr: false,
  }),
  CartPreview: dynamic(() => import('./ui/CartPreview'), {
    loading: () => <div>Loading cart...</div>,
    ssr: false,
  }),
  ErrorMessage: dynamic(() => import('./ui/ErrorMessage'), {
    loading: () => <div>Loading message...</div>,
    ssr: false,
  }),
} as const;

function DynamicComponent<T extends keyof typeof DynamicComponents>({ componentName, data }: { componentName: T; data: UIComponentData[T] }) {
  console.log('[DynamicComponent] Rendering:', { componentName, data });
  const Component = DynamicComponents[componentName];
  
  if (!Component) {
    console.error(`Unknown component: ${componentName}`);
    return null;
  }

  return <Component {...(data as any)} />;
}

const MessageContent = memo(function MessageContent({ message }: MessageContentProps) {
  console.log('[MessageContent] Rendering:', { message });
  if (message.role === 'assistant') {
    return (
      <div className="space-y-4">
        <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </div>
        {message.ui && <DynamicComponent componentName={message.ui.component} data={message.ui.data} />}
      </div>
    );
  }

  return (
    <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
      {message.content}
    </div>
  );
});

export function AIAssistant() {
  const [input, setInput] = useState('');
  const { clearMessages, error, isLoading, messages, sendMessage } = useAssistant();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    // Scroll immediately when messages change
    scrollToBottom();

    // Also scroll after a short delay to account for dynamic content loading
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setInput('');
    await sendMessage(trimmedInput);
  };

  const handleClear = () => {
    clearMessages();
  };

  return (
    <div className="mx-auto flex h-[80vh] min-h-[80vh] w-full flex-col rounded-lg bg-neutral-50 shadow-lg">
      <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} key={index}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' ? 'bg-primary-700 text-white' : 'bg-white text-gray-800'
              }`}
            >
              <MessageContent message={message} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-primary-700 p-3 text-white shadow-sm">Thinking...</div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="rounded-lg bg-red-100 p-3 text-red-800">{error}</div>
          </div>
        )}
      </div>

      <form className="border-t bg-white p-4" onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-2">
          <textarea
            className="w-full rounded border p-2"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            rows={4}
            value={input}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <SfButton disabled={isLoading} type="submit" variant="primary">
              Send
            </SfButton>
            {messages.length > 0 && (
              <SfButton onClick={handleClear} type="button" variant="secondary">
                Clear
              </SfButton>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
