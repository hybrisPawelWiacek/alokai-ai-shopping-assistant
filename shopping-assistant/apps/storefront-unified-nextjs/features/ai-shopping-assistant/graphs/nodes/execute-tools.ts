import type { RunnableConfig } from '@langchain/core/runnables';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import type { CommerceState } from '../../state';
import type { StateUpdateCommand } from '../../types/action-definition';
import { applyCommandsToState } from '../../state';
import { CommerceToolRegistry } from '../../core/tool-registry';

/**
 * Wrapper for the prebuilt ToolNode that adds performance tracking
 * Executes tools based on AI model's tool calls
 */
export async function executeToolsNode(
  state: CommerceState,
  toolNode: ToolNode<typeof state>,
  config?: RunnableConfig
): Promise<Partial<CommerceState>> {
  const startTime = performance.now();
  
  try {
    // Execute the tool node
    const result = await toolNode.invoke(state, config);
    
    // Track performance
    const commands: StateUpdateCommand[] = [
      {
        type: 'UPDATE_PERFORMANCE',
        payload: {
          nodeExecutionTimes: {
            executeTools: [performance.now() - startTime]
          },
          toolExecutionCount: 1
        }
      }
    ];
    
    const stateUpdates = applyCommandsToState(state, commands);
    
    // Merge the tool execution results with performance updates
    return {
      ...stateUpdates,
      ...(result as Partial<CommerceState>)
    };
  } catch (error) {
    // Track performance even on error
    const commands: StateUpdateCommand[] = [
      {
        type: 'UPDATE_PERFORMANCE',
        payload: {
          nodeExecutionTimes: {
            executeTools: [performance.now() - startTime]
          }
        }
      },
      {
        type: 'SET_ERROR',
        payload: error instanceof Error ? error : new Error('Tool execution failed')
      }
    ];
    
    return applyCommandsToState(state, commands);
  }
}