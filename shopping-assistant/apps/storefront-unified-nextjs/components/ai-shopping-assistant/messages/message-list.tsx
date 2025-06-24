'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './message-bubble';
import type { Message, ActionResult } from '../types';

interface MessageListProps {
  messages: Message[];
  renderCustomAction?: (action: ActionResult) => React.ReactNode;
}

export default function MessageList({ messages, renderCustomAction }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      containerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="space-y-4 overflow-y-auto scroll-smooth"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          renderCustomAction={renderCustomAction}
        />
      ))}
    </div>
  );
}