'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEnvContext } from 'next-runtime-env';
import { useCallback, useEffect, useState } from 'react';

import { useSdk } from '@/sdk/alokai-context';

import { createAssistantService } from '../assistant-service';
import { AssistantContext, AssistantError, AssistantMessage } from '../types';

interface AssistantState {
  error: null | string;
  isLoading: boolean;
  messages: AssistantMessage[];
}

const initialState: AssistantState = {
  error: null,
  isLoading: false,
  messages: [
    {
      content:
        "Hello! I'm your shopping assistant. I can help you with:\n• Finding products\n• Adding items to your cart\n• Checking your cart\n• Starting the checkout process\n\nHow can I assist you today?",
      role: 'assistant',
    },
  ],
};

export const useAssistant = () => {
  const { NEXT_PUBLIC_OPENAI_API_KEY: OPENAI_API_KEY } = useEnvContext();
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AssistantState>(initialState);
  const [assistantService, setAssistantService] = useState<null | ReturnType<typeof createAssistantService>>(null);

  useEffect(() => {
    if (!OPENAI_API_KEY) {
      setState((prev) => ({ ...prev, error: 'OpenAI API key is not configured' }));
      return;
    }

    setAssistantService(
      createAssistantService({
        apiKey: OPENAI_API_KEY,
        queryClient,
        sdk,
      }),
    );
  }, [OPENAI_API_KEY, sdk, queryClient]);

  const getCurrentContext = useCallback(async (): Promise<AssistantContext> => {
    try {
      const cart = await sdk.unified.getCart();
      return {
        cartItems: cart?.lineItems?.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        messageHistory: state.messages,
      };
    } catch (_error) {
      return {
        cartItems: [],
        messageHistory: state.messages,
      };
    }
  }, [sdk, state.messages]);

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!assistantService) {
        setState((prev) => ({ ...prev, error: 'Assistant service is not initialized' }));
        return;
      }

      setState((prev) => ({
        ...prev,
        error: null,
        isLoading: true,
        messages: [...prev.messages, { content, role: 'user' as const }],
      }));

      try {
        const context = await getCurrentContext();
        const response = await assistantService.processUserMessage(content, context);

        // Add assistant response to history
        setState((prev) => ({
          ...prev,
          isLoading: false,
          messages: [
            ...prev.messages,
            {
              content: response.content || '',
              productData: response.productData,
              role: 'assistant' as const,
              searchResults: response.searchResults,
              ui: response.ui,
            },
          ],
        }));
      } catch (error) {
        const errorMessage = error instanceof AssistantError ? error.message : 'Failed to process message';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      }
    },
    [assistantService, getCurrentContext],
  );

  return {
    clearMessages,
    error: state.error,
    isLoading: state.isLoading,
    messages: state.messages,
    sendMessage,
  };
};
