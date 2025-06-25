import { StateGraph, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import type { RunnableConfig } from '@langchain/core/runnables';
import { CommerceStateAnnotation, type CommerceState } from '../state';
import { CommerceToolRegistry } from '../core/tool-registry';
import type { StateUpdateCommand, LogEntry } from '../types/action-definition';
import { detectIntentNode } from './nodes/detect-intent';
import { enrichContextNode } from './nodes/enrich-context';
import { selectActionNode } from './nodes/select-action';
import { formatResponseNode } from './nodes/format-response';
import { executeToolsNode } from './nodes/execute-tools';

/**
 * Main LangGraph workflow for the commerce AI assistant
 * Uses conditional routing and prebuilt ToolNode for tool execution
 */
export class CommerceAgentGraph {
  private graph: StateGraph<typeof CommerceStateAnnotation.State, typeof CommerceStateAnnotation.Update>;
  private model: ChatOpenAI;
  private toolNode: ToolNode<typeof CommerceStateAnnotation.State>;
  private compiled: any = null;

  constructor(
    private toolRegistry: CommerceToolRegistry,
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
      this.toolRegistry.getTools()
    );

    // Initialize graph
    this.graph = new StateGraph(CommerceStateAnnotation)
      .addNode('detectIntent', detectIntentNode)
      .addNode('enrichContext', enrichContextNode)
      .addNode('selectAction', (state: CommerceState, config?: RunnableConfig) => 
        selectActionNode(state, this.toolRegistry, config)
      )
      .addNode('toolNode', (state: CommerceState, config?: RunnableConfig) =>
        executeToolsNode(state, this.toolNode, config)
      )
      .addNode('formatResponse', formatResponseNode);

    // Set up graph flow
    this.setupGraphFlow();
  }

  /**
   * Sets up the graph flow with conditional edges
   */
  private setupGraphFlow(): void {
    // Entry point
    this.graph.addEdge('__start__', 'detectIntent');
    
    // Intent detection to context enrichment
    this.graph.addEdge('detectIntent', 'enrichContext');
    
    // Context enrichment to action selection
    this.graph.addEdge('enrichContext', 'selectAction');
    
    // Conditional routing from selectAction
    this.graph.addConditionalEdges(
      'selectAction',
      this.shouldCallTool.bind(this),
      {
        continue: 'toolNode',
        end: 'formatResponse'
      }
    );
    
    // Tool execution to response formatting
    this.graph.addEdge('toolNode', 'formatResponse');
    
    // Format response to end
    this.graph.addEdge('formatResponse', END);
  }


  /**
   * Conditional edge: Determine if we should call tools
   */
  private shouldCallTool(state: CommerceState): 'continue' | 'end' {
    const lastMessage = state.messages[state.messages.length - 1];
    
    // Check if the last message has tool calls
    if (lastMessage && 
        lastMessage._getType() === 'ai' && 
        'tool_calls' in lastMessage && 
        lastMessage.tool_calls?.length > 0) {
      return 'continue';
    }
    
    return 'end';
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
   * Compile the graph for execution
   */
  compile() {
    if (!this.compiled) {
      this.compiled = this.graph.compile();
    }
    return this.compiled;
  }

  /**
   * Update tools in the registry and recompile
   */
  updateTools(tools: any[]): void {
    // Update registry
    this.toolRegistry.updateTools(tools);
    
    // Recreate tool node with new tools
    this.toolNode = new ToolNode<typeof CommerceStateAnnotation.State>(
      this.toolRegistry.getTools()
    );
    
    // Force recompilation
    this.compiled = null;
  }
}