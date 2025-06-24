import type { StreamEvent, ChatRequest } from '../types';

/**
 * Streaming client for Server-Sent Events
 * Handles the connection and parsing of streaming responses from the AI assistant API
 */

export interface StreamingClientOptions {
  url: string;
  headers?: Record<string, string>;
  onMessage: (event: StreamEvent) => void;
  onError: (error: Error) => void;
  onComplete?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export class StreamingClient {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();
  private buffer = '';
  private retryCount = 0;
  private abortController: AbortController | null = null;

  constructor(private options: StreamingClientOptions) {}

  async connect(request: ChatRequest): Promise<void> {
    const {
      url,
      headers = {},
      onMessage,
      onError,
      onComplete,
      retryAttempts = 3,
      retryDelay = 1000,
    } = this.options;

    try {
      this.abortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ ...request, stream: true }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      this.reader = response.body.getReader();
      await this.processStream(onMessage, onComplete);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Connection was intentionally aborted
          return;
        }

        // Retry logic
        if (this.retryCount < retryAttempts) {
          this.retryCount++;
          console.warn(`Retrying connection (${this.retryCount}/${retryAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * this.retryCount));
          return this.connect(request);
        }

        onError(error);
      }
    }
  }

  private async processStream(
    onMessage: (event: StreamEvent) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (!this.reader) return;

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          // Process any remaining buffer
          if (this.buffer.trim()) {
            this.processBuffer(onMessage);
          }
          onComplete?.();
          break;
        }

        // Decode the chunk and add to buffer
        this.buffer += this.decoder.decode(value, { stream: true });
        
        // Process complete messages in the buffer
        this.processBuffer(onMessage);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        throw error;
      }
    }
  }

  private processBuffer(onMessage: (event: StreamEvent) => void): void {
    const lines = this.buffer.split('\n');
    
    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') continue;
      
      if (line.startsWith('data: ')) {
        try {
          const data = line.slice(6).trim();
          
          // Skip the "[DONE]" message if present
          if (data === '[DONE]') continue;
          
          const event = JSON.parse(data) as StreamEvent;
          onMessage(event);
        } catch (error) {
          console.error('Failed to parse SSE data:', error, line);
        }
      }
    }
  }

  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.reader) {
      this.reader.cancel().catch(() => {
        // Ignore cancellation errors
      });
      this.reader = null;
    }

    this.buffer = '';
    this.retryCount = 0;
  }
}

/**
 * Helper function to create a streaming client
 */
export function createStreamingClient(
  apiEndpoint: string,
  headers?: Record<string, string>
): {
  stream: (
    request: ChatRequest,
    callbacks: {
      onMessage: (event: StreamEvent) => void;
      onError: (error: Error) => void;
      onComplete?: () => void;
    }
  ) => Promise<StreamingClient>;
} {
  return {
    stream: async (request, callbacks) => {
      const client = new StreamingClient({
        url: apiEndpoint,
        headers,
        ...callbacks,
      });

      await client.connect(request);
      return client;
    },
  };
}

/**
 * Parse streaming events into structured data
 */
export function parseStreamEvent(event: StreamEvent): {
  type: StreamEvent['type'];
  content?: string;
  actions?: any[];
  ui?: any;
  error?: string;
  metadata?: any;
} {
  switch (event.type) {
    case 'metadata':
      return {
        type: 'metadata',
        metadata: event.data,
      };

    case 'content':
      return {
        type: 'content',
        content: event.data.text || '',
      };

    case 'actions':
      return {
        type: 'actions',
        actions: event.data,
      };

    case 'ui':
      return {
        type: 'ui',
        ui: event.data,
      };

    case 'error':
      return {
        type: 'error',
        error: event.data.message || 'Unknown error',
      };

    case 'done':
      return {
        type: 'done',
        metadata: event.data,
      };

    default:
      return { type: event.type };
  }
}