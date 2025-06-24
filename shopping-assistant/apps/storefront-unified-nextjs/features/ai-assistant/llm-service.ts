'use client';

import OpenAI from 'openai';

import { generateErrorPrompt, generatePrompt } from './prompts';
import { AssistantContext, AssistantError, AssistantResponse } from './types';
import { createRateLimiter, RateLimitError } from './utils/rateLimiter';

interface LLMConfig {
  apiKey: string;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  retryCount?: number;
  retryDelay?: number;
}

const DEFAULT_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

const createOpenAIClient = (config: LLMConfig) => {
  return new OpenAI({
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true, // TODO: Move to backend
  });
};

const validateResponse = (response: AssistantResponse): AssistantResponse => {
  if (!response.content) {
    throw new AssistantError('Invalid response: missing content', 'VALIDATION');
  }

  if (response.actions) {
    const validTypes = ['ADD_TO_CART', 'GET_CART', 'GET_PRODUCT', 'UPDATE_CART', 'CHECKOUT', 'SEARCH_PRODUCTS', 'REMOVE_FROM_CART', 'UPDATE_CART_ITEM'] as const;
    for (const action of response.actions) {
      if (!validTypes.includes(action.type)) {
        throw new AssistantError(`Invalid action type: ${action.type}`, 'VALIDATION');
      }
    }
  }

  return response;
};

const handleLLMError = async (error: unknown, openai: OpenAI): Promise<AssistantResponse> => {
  if (error instanceof RateLimitError) {
    return {
      content: error.message,
    };
  }

  try {
    const errorPrompt = generateErrorPrompt(error as Error);
    const errorCompletion = await openai.chat.completions.create({
      messages: [{ content: errorPrompt, role: 'system' }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const errorResponse = errorCompletion.choices[0]?.message?.content;
    if (errorResponse) {
      return JSON.parse(errorResponse) as AssistantResponse;
    }
  } catch {
    // Fall through to default error message
  }

  return {
    content: 'I apologize, but I encountered an error while processing your request. Please try again.',
  };
};

export const createLLMService = (config: LLMConfig) => {
  const openai = createOpenAIClient(config);
  const retryCount = config.retryCount ?? 3;
  const retryDelay = config.retryDelay ?? 1000;
  const rateLimiter = createRateLimiter(config.rateLimit ?? DEFAULT_RATE_LIMIT);

  const processMessage = async (userMessage: string, context: AssistantContext): Promise<AssistantResponse> => {
    let lastError: unknown = null;

    // Check rate limit before processing
    try {
      rateLimiter.checkRateLimit('llm');
    } catch (error) {
      return handleLLMError(error, openai);
    }

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const prompt = generatePrompt(userMessage, context);
        console.log('[LLM Service] Generated prompt:', prompt);
        const completion = await openai.chat.completions.create({
          messages: [{ content: prompt, role: 'system' }],
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const response = completion.choices[0].message.content;
        if (!response) {
          throw new AssistantError('Failed to get response from LLM', 'API');
        }
        console.log('[LLM Service] Raw response:', response);

        const parsedResponse = JSON.parse(response) as AssistantResponse;
        console.log('[LLM Service] Parsed response:', parsedResponse);
        const validatedResponse = validateResponse(parsedResponse);
        console.log('[LLM Service] Validated response:', validatedResponse);
        return validatedResponse;
      } catch (error) {
        lastError = error;

        if (attempt === retryCount) {
          return handleLLMError(lastError, openai);
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      }
    }

    return handleLLMError(lastError, openai);
  };

  return { processMessage };
};
