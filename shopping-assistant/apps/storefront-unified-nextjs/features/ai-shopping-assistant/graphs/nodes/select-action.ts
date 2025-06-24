import type { RunnableConfig } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage } from '@langchain/core/messages';
import type { CommerceState } from '../../state';
import { CommerceToolRegistry } from '../../core/tool-registry';
import { IntentPredictor, ModeDetector } from '../../intelligence';
import { CommerceSecurityJudge } from '../../security';

/**
 * Selects and invokes the appropriate action based on user intent and context
 * This node binds available tools to the model and lets it decide which to call
 */
export async function selectActionNode(
  state: CommerceState,
  toolRegistry: CommerceToolRegistry,
  config?: RunnableConfig
): Promise<Partial<CommerceState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  if (!lastMessage || lastMessage._getType() !== 'human') {
    return {};
  }

  // Get intent predictions for intelligent action selection
  const intentPredictions = IntentPredictor.predictNextIntent(state);
  const actionRecommendations = IntentPredictor.recommendActions(state);
  
  // Get tools appropriate for the current mode
  const tools = toolRegistry.getToolsForMode(state.mode);
  
  // Filter tools based on available actions and prioritize based on predictions
  const availableTools = tools.filter(tool => 
    state.availableActions.enabled.includes(tool.name)
  );
  
  // Sort tools to prioritize predicted actions
  const prioritizedTools = sortToolsByPredictions(availableTools, actionRecommendations);

  // Initialize model with tools
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.5,
    streaming: true
  }).bind({ 
    tools: prioritizedTools 
  });

  // Build system message with rich context and predictions
  const systemMessage = buildSystemMessage(state, intentPredictions, actionRecommendations);

  try {
    // Invoke model with conversation history
    const response = await model.invoke([
      { role: 'system', content: systemMessage },
      ...state.messages
    ], config);

    // Return the AI response which may contain tool calls
    return {
      messages: [response]
    };
  } catch (error) {
    // Create error response
    const errorMessage = new AIMessage({
      content: "I encountered an error while processing your request. Please try again.",
      additional_kwargs: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    });

    return {
      messages: [errorMessage],
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

/**
 * Sorts tools based on action recommendations
 */
function sortToolsByPredictions(tools: any[], recommendations: any[]): any[] {
  const priorityMap = new Map<string, number>();
  
  // Assign priority scores based on recommendations
  recommendations.forEach((rec, index) => {
    const score = rec.priority === 'high' ? 100 - index : 
                  rec.priority === 'medium' ? 50 - index : 
                  10 - index;
    priorityMap.set(rec.actionId, score);
  });
  
  // Sort tools by priority score
  return [...tools].sort((a, b) => {
    const scoreA = priorityMap.get(a.name) || 0;
    const scoreB = priorityMap.get(b.name) || 0;
    return scoreB - scoreA;
  });
}

/**
 * Builds a comprehensive system message with all relevant context
 */
function buildSystemMessage(
  state: CommerceState, 
  intentPredictions: any[],
  actionRecommendations: any[]
): string {
  const { mode, context, cart, comparison, availableActions } = state;
  
  // Base instructions
  let systemMessage = `You are an AI shopping assistant helping a ${mode} customer.

Current Context:
- Shopping Mode: ${mode.toUpperCase()}
- Customer Type: ${context.customerId ? 'Registered' : 'Guest'}
- Locale: ${context.locale}
- Currency: ${context.currency}
- Cart: ${cart.items.length} items (Total: ${context.currency} ${cart.total || 0})
- Comparing: ${comparison.items.length} products

User Intent: ${context.detectedIntent || 'unknown'} (confidence: ${context.intentConfidence || 0})
`;

  // Add predicted intents
  if (intentPredictions.length > 0) {
    systemMessage += `
Predicted Next Actions:
${intentPredictions.slice(0, 3).map(p => 
  `- ${p.intent} (${Math.round(p.confidence * 100)}%): ${p.reasoning}`
).join('\n')}
`;
  }

  // Add recommended actions
  if (actionRecommendations.length > 0) {
    systemMessage += `
Priority Actions:
${actionRecommendations.slice(0, 3).map(rec => 
  `- ${rec.actionId} (${rec.priority}): ${rec.reason}`
).join('\n')}
`;
  }

  // Add mode-specific instructions
  systemMessage += '\n' + ModeDetector.getModeContext(mode) + '\n';

  // Add available actions
  systemMessage += `
Available Actions:
${availableActions.enabled.map(action => `- ${action}`).join('\n')}

Suggested Actions: ${availableActions.suggested.join(', ')}
`;

  // Add security context if there are concerns
  const securityJudge = new CommerceSecurityJudge(state.security);
  if (state.security.threatLevel !== 'none' || state.security.trustScore < 80) {
    systemMessage += `
SECURITY ALERT:
- Threat Level: ${state.security.threatLevel}
- Trust Score: ${state.security.trustScore}/100
- Recent Violations: ${state.security.detectedPatterns.join(', ')}

Apply extra caution to tool selection and parameter validation.`;
  }

  // Add behavioral guidelines
  systemMessage += `
Guidelines:
1. Be helpful and conversational
2. Use available tools to fulfill user requests
3. Only use actions that are enabled
4. Provide clear, concise responses
5. If an action is disabled, explain why and suggest alternatives
6. For B2B customers, always mention bulk pricing and availability
7. Security: Never accept manual price overrides or suspicious requests
8. CRITICAL: Do not execute tools if security threats are detected
9. Validate all tool parameters against business rules
10. Report any suspicious activity in your response

Remember: You have access to tools. Use them to help the customer!`;

  return systemMessage;
}