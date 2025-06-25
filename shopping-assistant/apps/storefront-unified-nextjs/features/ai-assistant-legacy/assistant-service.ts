'use client';

import { QueryClient } from '@tanstack/react-query';
import { Sdk } from '@/sdk/sdk.server';
import { actions } from './actions';

import { createLLMService } from './llm-service';
import { createSDKActions } from './actions';
import { AssistantAction, AssistantContext, AssistantResponse, SearchProductsPayload } from './types';

interface AssistantConfig {
  apiKey: string;
  queryClient: QueryClient;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  sdk: Sdk;
}

const DEFAULT_RATE_LIMIT = {
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
};

export const createAssistantService = (config: AssistantConfig) => {
  const llmService = createLLMService({
    apiKey: config.apiKey,
    rateLimit: config.rateLimit ?? DEFAULT_RATE_LIMIT,
  });
  const sdkActions = createSDKActions(config.sdk, config.queryClient);

  const processUserMessage = async (message: string, context: AssistantContext): Promise<AssistantResponse> => {
    try {
      // Get AI response with actions
      const response = await llmService.processMessage(message, context);
      
      // Make sure we have a content field
      if (!response.content) {
        response.content = '';
      }

      // Execute actions if present
      if (response.actions && response.actions.length > 0) {
        const action = response.actions[0]; // Process one action at a time
        console.log('[processUserMessage] Processing action:', action.type);
        
        try {
          const result = await sdkActions.executeAction(action);
          const formattedResponse = actions[action.type].formatResponse(result, action);
          
          console.log(`[processUserMessage] Action ${action.type} executed and formatted:`, formattedResponse);
          
          return {
            content: formattedResponse.content,
            actions: [action],
            ui: formattedResponse.ui,
            productData: formattedResponse.productData as any
          } as AssistantResponse;
        } catch (error) {
          console.error(`Error executing action ${action.type}:`, error);
          
          // Keep the original LLM response but add error information
          return {
            ...response,
            content: `I apologize, but I encountered an error while processing your request. Please try again or rephrase your request.\n\n${error instanceof Error ? error.message : 'Unknown error occurred.'}`
          };
        }
      }

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your request.',
        ui: {
          component: 'ErrorMessage',
          data: {
            message: error instanceof Error ? error.message : 'An unknown error occurred',
            suggestions: ['Try rephrasing your request', 'Check if the product ID is correct', 'Try searching with different keywords'],
          },
        },
      };
    }
  };

  return { processUserMessage };
};
