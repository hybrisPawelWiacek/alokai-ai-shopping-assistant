import { StateGraph, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { RunnableConfig } from '@langchain/core/runnables';
import { CommerceStateAnnotation, type CommerceState } from '../state';
import { ActionRegistryV2 } from '../actions/registry-v2';
import type { StateUpdateCommand, LogEntry } from '../types/action-definition';
import { detectIntentNode } from './nodes/detect-intent';
import { enrichContextNode } from './nodes/enrich-context';
import { selectActionNode } from './nodes/select-action';
import { formatResponseNode } from './nodes/format-response';

/**
 * Enhanced LangGraph workflow using configuration-based action registry
 * Supports dynamic reloading, mode-specific actions, and observability
 */
export class CommerceAgentGraphV2 {
  private graph: StateGraph<typeof CommerceStateAnnotation.State, typeof CommerceStateAnnotation.Update>;
  private model: ChatOpenAI;
  private toolNode: ToolNode<typeof CommerceStateAnnotation.State>;
  private compiled: any = null;

  constructor(
    private actionRegistry: ActionRegistryV2,
    private config: {
      modelName?: string;
      temperature?: number;
      enableLogging?: boolean;
      logger?: (entry: LogEntry) => void;
    } = {}
  ) {
    // Initialize model
    this.model = new ChatOpenAI({
      modelName: config.modelName || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      streaming: true
    });

    // Create tool node from registry
    this.toolNode = new ToolNode<typeof CommerceStateAnnotation.State>(
      this.actionRegistry.getTools()
    );

    // Initialize graph
    this.graph = new StateGraph(CommerceStateAnnotation)
      .addNode('detectIntent', detectIntentNode)
      .addNode('enrichContext', enrichContextNode)
      .addNode('selectAction', (state: CommerceState, config?: RunnableConfig) => 
        this.selectActionWithConfig(state, config)
      )
      .addNode('tools', this.toolNode)
      .addNode('formatResponse', formatResponseNode)
      .addNode('handleError', this.handleErrorNode.bind(this));

    // Build the workflow
    this.buildWorkflow();
  }

  private selectActionWithConfig(
    state: CommerceState,
    config?: RunnableConfig
  ): Promise<Partial<CommerceState>> {
    // Get mode-specific tools
    const availableTools = this.actionRegistry.getToolsForMode(state.mode);
    
    // Create a temporary registry with only available tools
    const filteredRegistry = {
      getTools: () => availableTools,
      getToolsForIntent: (intent: string) => {
        // Map intents to categories
        const intentCategoryMap: Record<string, string> = {
          'search': 'search',
          'add_to_cart': 'cart',
          'checkout': 'checkout',
          'compare': 'search',
          'get_details': 'search',
          'ask_question': 'support'
        };
        
        const category = intentCategoryMap[intent];
        if (category) {
          return this.actionRegistry.getToolsByCategory(category)
            .filter(tool => availableTools.includes(tool));
        }
        return [];
      }
    };
    
    // Call the original selectActionNode with filtered registry
    return selectActionNode(state, filteredRegistry as any, config);
  }

  private buildWorkflow(): void {
    // Entry point
    this.graph.addEdge('__start__', 'detectIntent');
    
    // Main flow
    this.graph.addEdge('detectIntent', 'enrichContext');
    this.graph.addEdge('enrichContext', 'selectAction');
    
    // Conditional routing after action selection
    this.graph.addConditionalEdges(
      'selectAction',
      (state: CommerceState) => this.routeAfterSelection(state),
      {
        'tools': 'tools',
        'respond': 'formatResponse',
        'error': 'handleError'
      }
    );
    
    // Tool execution routing
    this.graph.addConditionalEdges(
      'tools',
      (state: CommerceState) => this.routeAfterTools(state),
      {
        'continue': 'selectAction',
        'respond': 'formatResponse',
        'error': 'handleError'
      }
    );
    
    // Terminal nodes
    this.graph.addEdge('formatResponse', END);
    this.graph.addEdge('handleError', END);
  }

  private routeAfterSelection(state: CommerceState): string {
    const lastMessage = state.messages[state.messages.length - 1];
    
    if (state.error) {
      return 'error';
    }
    
    if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length > 0) {
      return 'tools';
    }
    
    return 'respond';
  }

  private routeAfterTools(state: CommerceState): string {
    if (state.error) {
      return 'error';
    }
    
    // Check if we need more actions
    const hasMoreActions = state.context.suggestedActions?.length > 0;
    if (hasMoreActions && state.messages.length < 10) { // Prevent infinite loops
      return 'continue';
    }
    
    return 'respond';
  }

  private async handleErrorNode(
    state: CommerceState,
    config?: RunnableConfig
  ): Promise<Partial<CommerceState>> {
    const errorMessage = state.error?.message || 'An unexpected error occurred';
    
    // Log error if logging is enabled
    if (this.config.enableLogging && this.config.logger) {
      this.config.logger({
        timestamp: new Date().toISOString(),
        level: 'error',
        component: 'CommerceAgentGraph',
        message: errorMessage,
        metadata: {
          sessionId: state.context.sessionId,
          error: state.error
        }
      });
    }
    
    return {
      messages: [
        ...state.messages,
        new AIMessage({
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or contact support if the issue persists.`,
          additional_kwargs: {
            error: true,
            errorType: state.error?.name || 'UnknownError'
          }
        })
      ],
      error: null // Clear error after handling
    };
  }

  /**
   * Update the action registry (e.g., after configuration reload)
   */
  updateRegistry(newRegistry: ActionRegistryV2): void {
    this.actionRegistry = newRegistry;
    
    // Recreate tool node with new tools
    this.toolNode = new ToolNode<typeof CommerceStateAnnotation.State>(
      newRegistry.getTools()
    );
    
    // Rebuild the graph
    this.graph = new StateGraph(CommerceStateAnnotation);
    this.buildWorkflow();
    this.compiled = null; // Force recompilation
  }

  /**
   * Execute the commerce workflow
   */
  async execute(
    input: { messages: BaseMessage[] },
    config?: RunnableConfig
  ): Promise<CommerceState> {
    if (!this.compiled) {
      this.compiled = this.graph.compile();
    }
    
    const startTime = performance.now();
    
    try {
      // Add performance tracking
      const trackedConfig = {
        ...config,
        callbacks: [
          ...(config?.callbacks || []),
          {
            handleLLMStart: (llm: any, prompts: string[]) => {
              if (this.config.logger) {
                this.config.logger({
                  timestamp: new Date().toISOString(),
                  level: 'debug',
                  component: 'LLM',
                  message: 'LLM call started',
                  metadata: { model: llm.name }
                });
              }
            },
            handleToolStart: (tool: any, input: string) => {
              if (this.config.logger) {
                this.config.logger({
                  timestamp: new Date().toISOString(),
                  level: 'debug',
                  component: 'Tool',
                  message: `Tool ${tool.name} started`,
                  metadata: { tool: tool.name }
                });
              }
            }
          }
        ]
      };
      
      const result = await this.compiled.invoke(input, trackedConfig);
      
      // Log execution time
      if (this.config.logger) {
        this.config.logger({
          timestamp: new Date().toISOString(),
          level: 'info',
          component: 'CommerceAgentGraph',
          message: 'Workflow completed',
          metadata: {
            executionTimeMs: performance.now() - startTime,
            messageCount: result.messages.length
          }
        });
      }
      
      return result;
    } catch (error) {
      // Log error
      if (this.config.logger) {
        this.config.logger({
          timestamp: new Date().toISOString(),
          level: 'error',
          component: 'CommerceAgentGraph',
          message: 'Workflow execution failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTimeMs: performance.now() - startTime
          }
        });
      }
      
      throw error;
    }
  }

  /**
   * Stream the commerce workflow execution
   */
  async stream(
    input: { messages: BaseMessage[] },
    config?: RunnableConfig
  ): Promise<AsyncIterableIterator<CommerceState>> {
    if (!this.compiled) {
      this.compiled = this.graph.compile();
    }
    
    return this.compiled.stream(input, config);
  }
}