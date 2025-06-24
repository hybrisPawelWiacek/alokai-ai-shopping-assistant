'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useSdk } from '@/sdk/alokai-context';
import { useNotification } from './use-notification';
import type {
  ChatState,
  Message,
  ShoppingMode,
  StreamEvent,
  UseShoppingAssistantOptions,
  UseShoppingAssistantReturn,
} from '@/components/ai-shopping-assistant/types';
import { StreamingClient, parseStreamEvent } from '@/components/ai-shopping-assistant/utils/streaming-client';

// Action types for the reducer
type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: string }
  | { type: 'FINALIZE_STREAMING_MESSAGE'; payload: Partial<Message> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MODE'; payload: ShoppingMode }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_SESSION_ID'; payload: string };

// Initial state
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  isStreaming: false,
  error: null,
  sessionId: '',
  mode: 'b2c',
  streamingMessage: '',
};

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };

    case 'UPDATE_STREAMING_MESSAGE':
      return {
        ...state,
        streamingMessage: state.streamingMessage + action.payload,
      };

    case 'FINALIZE_STREAMING_MESSAGE':
      const finalMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: state.streamingMessage,
        timestamp: new Date(),
        ...action.payload,
      };
      return {
        ...state,
        messages: [...state.messages, finalMessage],
        streamingMessage: '',
        isStreaming: false,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isStreaming: false };

    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], error: null };

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };

    default:
      return state;
  }
}

/**
 * Custom hook for managing the AI Shopping Assistant chat interface
 */
export function useShoppingAssistant(options: UseShoppingAssistantOptions = {}): UseShoppingAssistantReturn {
  const {
    apiEndpoint = '/api/ai-shopping-assistant',
    defaultMode = 'b2c',
    persistSession = true,
    onError,
  } = options;

  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    mode: defaultMode,
  });

  const sdk = useSdk();
  const { addError } = useNotification();
  const streamingClientRef = useRef<StreamingClient | null>(null);
  const sessionStorageKey = 'ai-shopping-assistant-session';

  // Initialize session ID
  useEffect(() => {
    if (persistSession && typeof window !== 'undefined') {
      const savedSessionId = localStorage.getItem(sessionStorageKey);
      if (savedSessionId) {
        dispatch({ type: 'SET_SESSION_ID', payload: savedSessionId });
      } else {
        const newSessionId = crypto.randomUUID();
        localStorage.setItem(sessionStorageKey, newSessionId);
        dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
      }
    } else {
      dispatch({ type: 'SET_SESSION_ID', payload: crypto.randomUUID() });
    }
  }, [persistSession]);

  // Handle streaming events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    const parsed = parseStreamEvent(event);

    switch (parsed.type) {
      case 'content':
        if (parsed.content) {
          dispatch({ type: 'UPDATE_STREAMING_MESSAGE', payload: parsed.content });
        }
        break;

      case 'actions':
        // Actions will be added to the final message
        break;

      case 'ui':
        // UI components will be added to the final message
        break;

      case 'done':
        dispatch({
          type: 'FINALIZE_STREAMING_MESSAGE',
          payload: {
            actions: parsed.metadata?.actions,
            ui: parsed.metadata?.ui,
          },
        });
        break;

      case 'error':
        dispatch({ type: 'SET_ERROR', payload: parsed.error || 'Streaming error' });
        break;
    }
  }, []);

  // Send message function
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || state.isLoading || state.isStreaming) {
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      mode: state.mode,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_STREAMING', payload: true });

    try {
      // Create streaming client
      const client = new StreamingClient({
        url: apiEndpoint,
        headers: {
          // Add any auth headers if needed
        },
        onMessage: handleStreamEvent,
        onError: (error) => {
          console.error('Streaming error:', error);
          dispatch({ type: 'SET_ERROR', payload: error.message });
          if (onError) onError(error);
          addError(error.message);
        },
        onComplete: () => {
          dispatch({ type: 'SET_LOADING', payload: false });
        },
      });

      streamingClientRef.current = client;

      // Connect and start streaming
      await client.connect({
        message,
        sessionId: state.sessionId,
        mode: state.mode,
        context: {
          // Add any context from SDK if needed
          locale: sdk.config?.defaultLocale,
          currency: sdk.config?.defaultCurrency,
        },
        stream: true,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_STREAMING', payload: false });
      
      if (onError && error instanceof Error) onError(error);
      addError(errorMessage);
    }
  }, [state.isLoading, state.isStreaming, state.sessionId, state.mode, apiEndpoint, sdk.config, handleStreamEvent, onError, addError]);

  // Clear messages
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    
    // Generate new session ID
    const newSessionId = crypto.randomUUID();
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
    
    if (persistSession && typeof window !== 'undefined') {
      localStorage.setItem(sessionStorageKey, newSessionId);
    }
  }, [persistSession, sessionStorageKey]);

  // Set mode
  const setMode = useCallback((mode: ShoppingMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...state.messages]
      .reverse()
      .find(msg => msg.role === 'user');

    if (lastUserMessage) {
      // Remove any error messages after the last user message
      const lastUserIndex = state.messages.findIndex(msg => msg.id === lastUserMessage.id);
      const messagesToKeep = state.messages.slice(0, lastUserIndex + 1);
      
      // Reset state with filtered messages
      dispatch({ type: 'CLEAR_MESSAGES' });
      messagesToKeep.forEach(msg => {
        dispatch({ type: 'ADD_MESSAGE', payload: msg });
      });

      // Resend the message
      await sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingClientRef.current) {
        streamingClientRef.current.disconnect();
      }
    };
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    sessionId: state.sessionId,
    mode: state.mode,
    sendMessage,
    clearMessages,
    setMode,
    retryLastMessage,
  };
}