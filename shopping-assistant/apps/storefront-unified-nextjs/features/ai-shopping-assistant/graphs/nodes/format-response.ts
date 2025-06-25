import type { RunnableConfig } from '@langchain/core/runnables';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import type { CommerceState } from '../../state';
import type { StateUpdateCommand } from '../../types/action-definition';
import { applyCommandsToState } from '../../state';
import { CommerceSecurityJudge } from '../../security';
import { traceLangGraphNode, logger, metrics } from '../../observability';

/**
 * Formats the final response for the user
 * Handles tool results, error messages, and creates user-friendly output
 */
export async function formatResponseNode(
  state: CommerceState,
  config?: RunnableConfig
): Promise<Partial<CommerceState>> {
  return traceLangGraphNode('formatResponse', async (span) => {
    const sessionId = state.context.sessionId || 'unknown';
    const correlationId = state.context.correlationId || sessionId;
    const startTime = performance.now();
    
    logger.info('Graph', 'Formatting response', {
      sessionId,
      correlationId,
      messageCount: state.messages.length,
      hasError: !!state.error
    });
    
    // Add attributes to span
    span.setAttributes({
      'ai.session.id': sessionId,
      'ai.correlation.id': correlationId,
      'ai.mode': state.mode,
      'ai.has_error': !!state.error
    });
    
    // Find the last AI message
    const lastAIMessage = [...state.messages]
      .reverse()
      .find(msg => msg._getType() === 'ai') as AIMessage | undefined;

    if (!lastAIMessage) {
      logger.debug('Graph', 'No AI message found to format', { sessionId, correlationId });
      return {};
    }

    try {
      let formattedResponse: string;
      let additionalData: Record<string, any> = {};

      // Check if we have tool results to format
      if (hasToolResults(state)) {
        const toolResults = extractToolResults(state);
        logger.debug('Graph', 'Formatting tool results', {
          sessionId,
          correlationId,
          tools: Object.keys(toolResults)
        });
        formattedResponse = formatToolResults(toolResults, state);
        additionalData = toolResults;
      } else if (lastAIMessage.tool_calls && lastAIMessage.tool_calls.length > 0) {
        // Tool calls were made but no results yet - this shouldn't happen
        logger.warn('Graph', 'Tool calls without results', {
          sessionId,
          correlationId,
          toolCalls: lastAIMessage.tool_calls.map(tc => tc.name)
        });
        formattedResponse = "I'm processing your request...";
      } else {
        // Regular AI response without tools
        formattedResponse = lastAIMessage.content as string || "I'm here to help you shop!";
      }

    // Apply mode-specific formatting
    formattedResponse = applyModeFormatting(formattedResponse, state);

    // Add contextual suggestions
    const suggestions = generateSuggestions(state);
    if (suggestions.length > 0) {
      formattedResponse += `\n\n**What would you like to do next?**\n${suggestions.map(s => `- ${s}`).join('\n')}`;
    }
    
      // Security validation for output
      const securityJudge = new CommerceSecurityJudge(state.security);
      const outputValidation = await securityJudge.validate(formattedResponse, state, 'output');
      
      if (!outputValidation.isValid) {
        // Filter the output if security issues detected
        formattedResponse = await securityJudge.filterOutput(formattedResponse, state);
        
        // Log security event
        logger.warn('Security', 'Output filtering applied', {
          sessionId,
          correlationId,
          reason: outputValidation.reason,
          severity: outputValidation.severity
        });
        
        metrics.recordSecurityFilter('formatResponse', outputValidation.severity);
      }

    // Create formatted AI message
    const formattedMessage = new AIMessage({
      content: formattedResponse,
      additional_kwargs: {
        ...lastAIMessage.additional_kwargs,
        ...additionalData,
        formatted: true,
        timestamp: new Date().toISOString()
      }
    });

      // Track performance and security
      const duration = performance.now() - startTime;
      const commands: StateUpdateCommand[] = [
        {
          type: 'UPDATE_PERFORMANCE',
          payload: {
            nodeExecutionTimes: {
              formatResponse: [duration]
            }
          }
        }
      ];
      
      // Update security context if validation was performed
      if (outputValidation) {
        commands.push({
          type: 'UPDATE_SECURITY',
          payload: securityJudge.getContext()
        });
      }
      
      // Record metrics
      metrics.recordNodeExecution('formatResponse', duration, true);
      metrics.recordResponseFormatting(state.mode, hasToolResults(state));
      
      // Update span with results
      span.setAttributes({
        'ai.response.length': formattedResponse.length,
        'ai.response.has_tools': hasToolResults(state),
        'ai.response.has_suggestions': generateSuggestions(state).length > 0
      });
      
      logger.info('Graph', 'Response formatted successfully', {
        sessionId,
        correlationId,
        responseLength: formattedResponse.length,
        hasTools: hasToolResults(state),
        suggestionCount: generateSuggestions(state).length
      });

      const stateUpdates = applyCommandsToState(state, commands);
      
      return {
        ...stateUpdates,
        messages: [formattedMessage]
      };
    } catch (error) {
      logger.error('Graph', 'Response formatting failed', {
        sessionId,
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      const duration = performance.now() - startTime;
      metrics.recordNodeExecution('formatResponse', duration, false);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Response formatting failed' });
      
      // Format error response
      const errorMessage = new AIMessage({
        content: "I apologize, but I encountered an issue formatting the response. Please try your request again.",
        additional_kwargs: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });

      return {
        messages: [errorMessage],
        error: error instanceof Error ? error : new Error('Unknown error'),
        performance: {
          nodeExecutionTimes: {
            formatResponse: [duration]
          }
        }
      };
    }
  });
}

/**
 * Checks if the state contains tool results
 */
function hasToolResults(state: CommerceState): boolean {
  // Look for tool messages after the last AI message
  const messages = [...state.messages];
  const lastAIIndex = messages.findLastIndex(msg => msg._getType() === 'ai');
  
  if (lastAIIndex === -1) return false;
  
  return messages.slice(lastAIIndex + 1).some(msg => msg._getType() === 'tool');
}

/**
 * Extracts tool results from the message history
 */
function extractToolResults(state: CommerceState): Record<string, any> {
  const messages = [...state.messages];
  const lastAIIndex = messages.findLastIndex(msg => msg._getType() === 'ai');
  
  const toolMessages = messages
    .slice(lastAIIndex + 1)
    .filter(msg => msg._getType() === 'tool') as ToolMessage[];

  const results: Record<string, any> = {};
  
  toolMessages.forEach(msg => {
    // Tool messages have the result in their content
    const content = typeof msg.content === 'string' ? 
      JSON.parse(msg.content) : msg.content;
    
    // Organize by tool name
    results[msg.name] = content;
  });

  return results;
}

/**
 * Formats tool results into user-friendly messages
 */
function formatToolResults(results: Record<string, any>, state: CommerceState): string {
  const formattedParts: string[] = [];

  // Format search results
  if (results.search_products || results.searchResults) {
    const searchData = results.search_products || results.searchResults;
    if (searchData.totalCount > 0) {
      formattedParts.push(`I found **${searchData.totalCount} products** matching your search.`);
      
      // Add top results preview
      if (searchData.products && searchData.products.length > 0) {
        const topProducts = searchData.products.slice(0, 3);
        formattedParts.push('\n**Top results:**');
        topProducts.forEach((product: any, index: number) => {
          formattedParts.push(`${index + 1}. ${product.name} - ${state.context.currency} ${product.price.regular}`);
        });
      }
    } else {
      formattedParts.push("I couldn't find any products matching your search. Try different keywords or filters.");
    }
  }

  // Format cart updates
  if (results.add_to_cart || results.update_cart) {
    const cartData = results.add_to_cart || results.update_cart;
    formattedParts.push(`✅ Successfully added to cart! You now have **${state.cart.items.length} items** in your cart.`);
    formattedParts.push(`Cart total: ${state.context.currency} ${state.cart.total || 0}`);
  }

  // Format comparison updates
  if (results.add_to_comparison) {
    formattedParts.push(`📊 Added to comparison! You're now comparing **${state.comparison.items.length} products**.`);
  }

  // Format product details
  if (results.get_product_details) {
    const product = results.get_product_details.product;
    formattedParts.push(`**${product.name}**`);
    formattedParts.push(`Price: ${state.context.currency} ${product.price.regular}`);
    if (product.description) {
      formattedParts.push(`\n${product.description.substring(0, 200)}...`);
    }
  }

  // Format checkout
  if (results.checkout) {
    formattedParts.push(`🛒 **Ready to checkout!**`);
    formattedParts.push(`Order total: ${state.context.currency} ${state.cart.total}`);
    formattedParts.push(`Items: ${state.cart.items.length}`);
  }

  return formattedParts.join('\n') || "I've completed your request.";
}

/**
 * Applies mode-specific formatting to responses
 */
function applyModeFormatting(response: string, state: CommerceState): string {
  if (state.mode === 'b2b') {
    // Add B2B specific information
    const b2bNotes: string[] = [];
    
    if (response.includes('price')) {
      b2bNotes.push('💼 *Bulk pricing available for orders over 50 units*');
    }
    
    if (response.includes('added to cart')) {
      b2bNotes.push('📋 *Generate a quote or purchase order from your cart*');
    }
    
    if (b2bNotes.length > 0) {
      response += '\n\n' + b2bNotes.join('\n');
    }
  } else {
    // B2C formatting
    if (response.includes('added to cart')) {
      response += '\n\n🎁 *Free shipping on orders over $50!*';
    }
  }
  
  return response;
}

/**
 * Generates contextual suggestions based on state
 */
function generateSuggestions(state: CommerceState): string[] {
  const suggestions: string[] = [];
  const { detectedIntent } = state.context;
  const hasCart = state.cart.items.length > 0;
  const hasComparison = state.comparison.items.length > 0;

  // Intent-based suggestions
  switch (detectedIntent) {
    case 'search':
      suggestions.push('View product details');
      suggestions.push('Compare similar products');
      suggestions.push('Filter by price or brand');
      break;
      
    case 'add_to_cart':
      suggestions.push('Continue shopping');
      suggestions.push('View cart');
      if (state.mode === 'b2c') {
        suggestions.push('Proceed to checkout');
      } else {
        suggestions.push('Get a quote');
      }
      break;
      
    case 'compare':
      suggestions.push('Add more products to compare');
      suggestions.push('View detailed comparison');
      suggestions.push('Add best option to cart');
      break;
  }

  // State-based suggestions
  if (hasCart && !suggestions.includes('Proceed to checkout')) {
    suggestions.push('Checkout when ready');
  }
  
  if (hasComparison && !suggestions.includes('View detailed comparison')) {
    suggestions.push('See product comparison');
  }

  // Mode-specific suggestions
  if (state.mode === 'b2b') {
    suggestions.push('Check bulk availability');
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}