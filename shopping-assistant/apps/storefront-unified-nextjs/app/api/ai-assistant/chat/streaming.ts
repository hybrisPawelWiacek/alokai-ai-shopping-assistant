import { CommerceGraphExecutor, type ExecutionContext, type ExecutionOptions, type StreamingChunk } from '@/features/ai-shopping-assistant/graphs/graph-executor';

/**
 * SSE event types
 */
enum SSEEventType {
  MESSAGE = 'message',
  TOOL_START = 'tool_start',
  TOOL_END = 'tool_end',
  METADATA = 'metadata',
  ERROR = 'error',
  DONE = 'done'
}

/**
 * Create a streaming response using Server-Sent Events
 */
export function createStreamingResponse(
  executor: CommerceGraphExecutor,
  message: string,
  context: ExecutionContext,
  options: ExecutionOptions
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let keepAliveInterval: NodeJS.Timeout;

  return new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection event
        controller.enqueue(encoder.encode(formatSSE({
          type: 'connection',
          data: { threadId: context.threadId }
        })));

        // Set up keep-alive ping every 15 seconds
        keepAliveInterval = setInterval(() => {
          controller.enqueue(encoder.encode(': ping\n\n'));
        }, 15000);

        // Track streaming state
        let messageBuffer = '';
        let currentToolName: string | null = null;

        // Stream responses
        for await (const chunk of executor.executeStreaming(message, context, options)) {
          switch (chunk.type) {
            case 'text':
              // Buffer text chunks for smoother streaming
              messageBuffer += chunk.content;
              
              // Send buffered content when we have a complete word or punctuation
              if (chunk.content.includes(' ') || chunk.content.match(/[.!?,;]/)) {
                controller.enqueue(encoder.encode(formatSSE({
                  type: SSEEventType.MESSAGE,
                  data: { content: messageBuffer }
                })));
                messageBuffer = '';
              }
              break;

            case 'tool_start':
              currentToolName = chunk.tool;
              controller.enqueue(encoder.encode(formatSSE({
                type: SSEEventType.TOOL_START,
                data: {
                  tool: chunk.tool,
                  args: chunk.args
                }
              })));
              break;

            case 'tool_end':
              controller.enqueue(encoder.encode(formatSSE({
                type: SSEEventType.TOOL_END,
                data: {
                  tool: chunk.tool,
                  result: chunk.result
                }
              })));
              currentToolName = null;
              break;

            case 'metadata':
              controller.enqueue(encoder.encode(formatSSE({
                type: SSEEventType.METADATA,
                data: chunk.data
              })));
              break;

            case 'error':
              controller.enqueue(encoder.encode(formatSSE({
                type: SSEEventType.ERROR,
                data: { error: chunk.error }
              })));
              break;

            case 'end':
              // Send any remaining buffered text
              if (messageBuffer) {
                controller.enqueue(encoder.encode(formatSSE({
                  type: SSEEventType.MESSAGE,
                  data: { content: messageBuffer }
                })));
              }

              // Send completion event with final metadata
              controller.enqueue(encoder.encode(formatSSE({
                type: SSEEventType.DONE,
                data: {
                  threadId: context.threadId,
                  mode: chunk.state.mode,
                  toolsUsed: chunk.state.messages
                    .filter(m => m._getType() === 'tool')
                    .map(m => (m as any).name)
                    .filter((v, i, a) => a.indexOf(v) === i)
                }
              })));
              break;
          }
        }

        // Clean up and close
        clearInterval(keepAliveInterval);
        controller.close();
      } catch (error) {
        // Send error event
        controller.enqueue(encoder.encode(formatSSE({
          type: SSEEventType.ERROR,
          data: {
            error: error instanceof Error ? error.message : 'Stream error occurred'
          }
        })));

        // Clean up
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        controller.close();
      }
    },

    cancel() {
      // Clean up on client disconnect
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    }
  });
}

/**
 * Format Server-Sent Event
 */
function formatSSE(event: { type: string; data: any }): string {
  const lines = [
    `event: ${event.type}`,
    `data: ${JSON.stringify(event.data)}`,
    '', // Empty line to terminate event
    '' // Extra newline for clarity
  ];
  
  return lines.join('\n');
}

/**
 * Create chunked response for large payloads
 */
export function createChunkedResponse(
  data: any,
  chunkSize: number = 1024
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(data);
  
  return new ReadableStream({
    start(controller) {
      let offset = 0;
      
      while (offset < jsonString.length) {
        const chunk = jsonString.slice(offset, offset + chunkSize);
        controller.enqueue(encoder.encode(chunk));
        offset += chunkSize;
      }
      
      controller.close();
    }
  });
}

/**
 * Parse SSE stream on client side (for reference)
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<{ type: string; data: any }, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';

      let event: { type?: string; data?: string } = {};
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          event.type = line.slice(7);
        } else if (line.startsWith('data: ')) {
          event.data = line.slice(6);
        } else if (line === '' && event.type && event.data) {
          // Empty line signals end of event
          yield {
            type: event.type,
            data: JSON.parse(event.data)
          };
          event = {};
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}