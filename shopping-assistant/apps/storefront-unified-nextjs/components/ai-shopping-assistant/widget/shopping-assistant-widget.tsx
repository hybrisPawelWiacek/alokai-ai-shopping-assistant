'use client';

import { useState } from 'react';
import { SfButton, SfIconChat, SfIconClose } from '@storefront-ui/react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import ChatInterface from '../chat-interface';
import type { ShoppingAssistantWidgetProps } from '../types';
import { PerformanceDashboard } from '@/features/ai-shopping-assistant/components/performance-dashboard';

export default function ShoppingAssistantWidget({
  position = 'bottom-right',
  triggerText = 'AI Assistant',
  triggerIcon = <SfIconChat />,
  className,
}: ShoppingAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const chatPositionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  // Only render on client side
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div
        className={classNames(
          'fixed z-40',
          positionClasses[position],
          className
        )}
      >
        <SfButton
          onClick={() => setIsOpen(!isOpen)}
          className={classNames(
            'shadow-lg hover:shadow-xl transition-shadow',
            isOpen && 'ring-2 ring-primary-500'
          )}
          aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        >
          {isOpen ? <SfIconClose /> : triggerIcon}
          <span className="ml-2">{triggerText}</span>
        </SfButton>
      </div>

      {/* Chat Interface Portal */}
      {isOpen && createPortal(
        <div
          className={classNames(
            'fixed z-50',
            chatPositionClasses[position]
          )}
        >
          <div className="relative">
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Chat Interface */}
            <div className="relative w-[90vw] md:w-[400px] max-w-[400px] animate-slideUp">
              <ChatInterface
                height="min(600px, 80vh)"
                className="shadow-2xl"
              />
              
              {/* Close button for mobile */}
              <button
                className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md md:hidden"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <SfIconClose size="sm" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}