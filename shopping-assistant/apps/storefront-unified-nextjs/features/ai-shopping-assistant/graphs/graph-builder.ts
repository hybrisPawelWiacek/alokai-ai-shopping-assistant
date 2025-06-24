import { StateGraph, END, MemorySaver, Checkpoint } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { RunnableConfig } from '@langchain/core/runnables';
import { CommerceStateAnnotation, type CommerceState } from '../state';
import { CommerceToolRegistry } from '../core/tool-registry';
import { CommerceSecurityJudge } from '../security';
import type { StateUpdateCommand, LogEntry } from '../types/action-definition';
import { IntentPredictor } from '../intelligence';

// Import nodes
import { detectIntentNode } from './nodes/detect-intent';
import { enrichContextNode } from './nodes/enrich-context';
import { selectActionNode } from './nodes/select-action';
import { formatResponseNode } from './nodes/format-response';

/**
 * Graph configuration options
 */
export interface GraphConfig {
  modelName?: string;
  temperature?: number;
  enableStreaming?: boolean;
  enablePersistence?: boolean;
  enableLogging?: boolean;
  logger?: (entry: LogEntry) => void;
  checkpointTTL?: number; // TTL for checkpoints in ms
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Enhanced LangGraph builder with streaming, persistence, and advanced routing
 */
export class CommerceGraphBuilder {
  private graph: StateGraph<typeof CommerceStateAnnotation.State, typeof CommerceStateAnnotation.Update>;
  private model: ChatOpenAI;
  private toolNode: ToolNode<typeof CommerceStateAnnotation.State>;
  private compiled: any = null;
  private memorySaver?: MemorySaver;
  private securityJudge: CommerceSecurityJudge;

  constructor(
    private toolRegistry: CommerceToolRegistry,
    private config: GraphConfig = {}
  ) {
    // Initialize model with streaming support
    this.model = new ChatOpenAI({
      modelName: config.modelName || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.7,
      streaming: config.enableStreaming !== false
    });

    // Initialize security judge
    this.securityJudge = new CommerceSecurityJudge();

    // Create tool node from registry
    this.toolNode = new ToolNode<typeof CommerceStateAnnotation.State>(
      this.toolRegistry.getTools()
    );

    // Initialize memory saver for persistence
    if (config.enablePersistence) {
      this.memorySaver = new MemorySaver();
    }

    // Build the graph
    this.buildGraph();
  }

  /**
   * Builds the complete graph with all nodes and edges
   */
  private buildGraph(): void {
    this.graph = new StateGraph(CommerceStateAnnotation);

    // Add all nodes
    this.addNodes();

    // Add edges with conditional routing
    this.addEdges();

    // Log graph structure
    this.log({
      level: 'debug',
      message: 'Graph structure built',
      metadata: {
        nodes: ['detectIntent', 'enrichContext', 'selectAction', 'toolNode', 'formatResponse', 'errorHandler'],
        persistenceEnabled: this.config.enablePersistence,
        streamingEnabled: this.config.enableStreaming
      }
    });
  }

  /**
   * Adds all nodes to the graph
   */
  private addNodes(): void {
    // Intent detection node
    this.graph.addNode('detectIntent', detectIntentNode);

    // Context enrichment node
    this.graph.addNode('enrichContext', enrichContextNode);

    // Action selection node with tool registry
    this.graph.addNode('selectAction', (state: CommerceState, config?: RunnableConfig) => 
      selectActionNode(state, this.toolRegistry, config)
    );

    // Tool execution node
    this.graph.addNode('toolNode', this.toolNode);

    // Response formatting node
    this.graph.addNode('formatResponse', formatResponseNode);

    // Error handling node
    this.graph.addNode('errorHandler', this.errorHandlerNode.bind(this));

    // Security validation node
    this.graph.addNode('securityCheck', this.securityCheckNode.bind(this));
  }

  /**
   * Adds edges with conditional routing
   */
  private addEdges(): void {
    // Entry point to security check
    this.graph.addEdge('__start__', 'securityCheck');

    // Security check conditional routing
    this.graph.addConditionalEdges(
      'securityCheck',
      this.routeFromSecurity.bind(this),
      {
        proceed: 'detectIntent',
        block: 'errorHandler',
        warn: 'detectIntent'
      }
    );

    // Intent detection to context enrichment
    this.graph.addEdge('detectIntent', 'enrichContext');

    // Context enrichment conditional routing
    this.graph.addConditionalEdges(
      'enrichContext',
      this.routeFromContext.bind(this),
      {
        action: 'selectAction',
        direct: 'formatResponse',
        error: 'errorHandler'
      }
    );

    // Action selection conditional routing
    this.graph.addConditionalEdges(
      'selectAction',
      this.routeFromActionSelection.bind(this),
      {
        tools: 'toolNode',
        response: 'formatResponse',
        error: 'errorHandler'
      }
    );

    // Tool execution conditional routing
    this.graph.addConditionalEdges(
      'toolNode',
      this.routeFromTools.bind(this),
      {
        format: 'formatResponse',
        retry: 'selectAction',
        error: 'errorHandler'
      }
    );

    // Response formatting to end
    this.graph.addEdge('formatResponse', END);

    // Error handler to end
    this.graph.addEdge('errorHandler', END);
  }

  /**
   * Security check node
   */
  private async securityCheckNode(
    state: CommerceState,
    config?: RunnableConfig
  ): Promise<Partial<CommerceState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || lastMessage._getType() !== 'human') {
      return {};
    }

    const validation = await this.securityJudge.validate(lastMessage, state, 'input');
    
    this.log({
      level: validation.isValid ? 'info' : 'warn',
      message: 'Security validation completed',
      metadata: {
        isValid: validation.isValid,
        severity: validation.severity,
        category: validation.category
      }
    });

    return {
      security: this.securityJudge.getContext()
    };
  }

  /**
   * Error handler node
   */
  private async errorHandlerNode(
    state: CommerceState,
    config?: RunnableConfig
  ): Promise<Partial<CommerceState>> {
    const error = state.error || new Error('Unknown error occurred');
    
    this.log({
      level: 'error',
      message: 'Error in graph execution',
      metadata: {
        error: error.message,
        stack: error.stack,
        state: {
          mode: state.mode,
          intent: state.context.detectedIntent,
          messageCount: state.messages.length
        }
      }
    });

    const errorMessage = new AIMessage({
      content: `I apologize, but I encountered an error while processing your request. ${
        state.mode === 'b2b' 
          ? 'Please contact your account representative for assistance.' 
          : 'Please try again or contact support if the issue persists.'
      }`,
      additional_kwargs: {
        error: true,
        errorDetails: error.message,
        timestamp: new Date().toISOString()
      }
    });

    return {
      messages: [errorMessage],
      error: null // Clear error after handling
    };
  }

  /**
   * Routing logic from security check
   */
  private routeFromSecurity(state: CommerceState): 'proceed' | 'block' | 'warn' {
    const { security } = state;
    
    if (security.threatLevel === 'critical' || security.blockedAttempts > 5) {
      return 'block';
    }
    
    if (security.threatLevel === 'high' || security.trustScore < 50) {
      return 'warn';
    }
    
    return 'proceed';
  }

  /**
   * Routing logic from context enrichment
   */
  private routeFromContext(state: CommerceState): 'action' | 'direct' | 'error' {
    if (state.error) {
      return 'error';
    }

    // Check if we have enough context to proceed
    const { detectedIntent, intentConfidence } = state.context;
    
    // Low confidence or unknown intent - provide direct response
    if (!detectedIntent || detectedIntent === 'unknown' || intentConfidence < 0.5) {
      return 'direct';
    }
    
    // Proceed to action selection
    return 'action';
  }

  /**
   * Routing logic from action selection
   */
  private routeFromActionSelection(state: CommerceState): 'tools' | 'response' | 'error' {
    if (state.error) {
      return 'error';
    }

    const lastMessage = state.messages[state.messages.length - 1];
    
    // Check if AI message has tool calls
    if (lastMessage && 
        lastMessage._getType() === 'ai' && 
        'tool_calls' in lastMessage && 
        lastMessage.tool_calls?.length > 0) {
      return 'tools';
    }
    
    return 'response';
  }

  /**
   * Routing logic from tool execution
   */
  private routeFromTools(state: CommerceState): 'format' | 'retry' | 'error' {
    if (state.error) {
      // Check if we should retry
      const retryCount = state.performance?.retryCount || 0;
      const maxRetries = this.config.maxRetries || 3;
      
      if (retryCount < maxRetries) {
        this.log({
          level: 'info',
          message: `Retrying after tool error (attempt ${retryCount + 1}/${maxRetries})`,
          metadata: { error: state.error.message }
        });
        return 'retry';
      }
      
      return 'error';
    }
    
    return 'format';
  }

  /**
   * Compile the graph with optional configuration
   */
  compile(compileConfig?: {
    checkpointId?: string;
    interruptBefore?: string[];
    interruptAfter?: string[];
  }) {
    if (!this.compiled) {
      const baseConfig: any = {};
      
      // Add memory saver for persistence
      if (this.memorySaver) {
        baseConfig.checkpointer = this.memorySaver;
      }
      
      // Add interruption points for debugging
      if (compileConfig?.interruptBefore) {
        baseConfig.interruptBefore = compileConfig.interruptBefore;
      }
      
      if (compileConfig?.interruptAfter) {
        baseConfig.interruptAfter = compileConfig.interruptAfter;
      }
      
      this.compiled = this.graph.compile(baseConfig);
      
      this.log({
        level: 'info',
        message: 'Graph compiled successfully',
        metadata: {
          persistenceEnabled: !!this.memorySaver,
          interruptBefore: compileConfig?.interruptBefore,
          interruptAfter: compileConfig?.interruptAfter
        }
      });
    }
    
    return this.compiled;
  }

  /**
   * Execute the graph with streaming support
   */
  async *stream(
    input: Partial<CommerceState>,
    config?: RunnableConfig & { threadId?: string }
  ): AsyncGenerator<any, void, unknown> {
    const compiledGraph = this.compile();
    
    // Add thread ID for conversation persistence
    const runConfig: RunnableConfig = {
      ...config,
      configurable: {
        ...config?.configurable,
        thread_id: config?.threadId || 'default'
      }
    };
    
    try {
      // Stream results
      for await (const chunk of await compiledGraph.stream(input, runConfig)) {
        yield chunk;
      }
    } catch (error) {
      this.log({
        level: 'error',
        message: 'Error during graph streaming',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  /**
   * Execute the graph without streaming
   */
  async invoke(
    input: Partial<CommerceState>,
    config?: RunnableConfig & { threadId?: string }
  ): Promise<CommerceState> {
    const compiledGraph = this.compile();
    
    const runConfig: RunnableConfig = {
      ...config,
      configurable: {
        ...config?.configurable,
        thread_id: config?.threadId || 'default'
      }
    };
    
    try {
      const result = await compiledGraph.invoke(input, runConfig);
      return result;
    } catch (error) {
      this.log({
        level: 'error',
        message: 'Error during graph invocation',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  /**
   * Get conversation history from checkpoint
   */
  async getHistory(threadId: string = 'default'): Promise<BaseMessage[]> {
    if (!this.memorySaver) {
      return [];
    }
    
    try {
      const checkpoint = await this.memorySaver.get({ configurable: { thread_id: threadId } });
      return checkpoint?.channel_values?.messages || [];
    } catch (error) {
      this.log({
        level: 'error',
        message: 'Error retrieving conversation history',
        metadata: { threadId, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      return [];
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory(threadId: string = 'default'): Promise<void> {
    if (!this.memorySaver) {
      return;
    }
    
    try {
      await this.memorySaver.delete({ configurable: { thread_id: threadId } });
      this.log({
        level: 'info',
        message: 'Conversation history cleared',
        metadata: { threadId }
      });
    } catch (error) {
      this.log({
        level: 'error',
        message: 'Error clearing conversation history',
        metadata: { threadId, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  /**
   * Update graph configuration dynamically
   */
  updateConfig(updates: Partial<GraphConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update model if temperature changed
    if (updates.temperature !== undefined) {
      this.model = new ChatOpenAI({
        modelName: this.config.modelName || 'gpt-4-turbo-preview',
        temperature: updates.temperature,
        streaming: this.config.enableStreaming !== false
      });
    }
    
    // Update persistence
    if (updates.enablePersistence !== undefined) {
      this.memorySaver = updates.enablePersistence ? new MemorySaver() : undefined;
      this.compiled = null; // Force recompilation
    }
    
    this.log({
      level: 'info',
      message: 'Graph configuration updated',
      metadata: { updates }
    });
  }

  /**
   * Helper: Log with configured logger
   */
  private log(entry: Omit<LogEntry, 'timestamp'>): void {
    if (!this.config.enableLogging) return;
    
    const fullEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    
    if (this.config.logger) {
      this.config.logger(fullEntry);
    } else {
      console.log(`[${fullEntry.level}] ${fullEntry.message}`, fullEntry.metadata || {});
    }
  }

  /**
   * Get graph visualization data
   */
  getVisualization(): any {
    const compiledGraph = this.compile();
    return compiledGraph.getGraph();
  }
}