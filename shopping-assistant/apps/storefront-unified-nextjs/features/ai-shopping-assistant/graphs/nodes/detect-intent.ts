import type { RunnableConfig } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import type { CommerceState } from '../../state';
import type { StateUpdateCommand } from '../../types/action-definition';
import { applyCommandsToState } from '../../state';
import { ModeDetector } from '../../intelligence';
import { CommerceSecurityJudge } from '../../security';
import { traceLangGraphNode, logger, metrics } from '../../observability';

export interface IntentDetectionResult {
  mode: 'b2c' | 'b2b';
  intent: 'search' | 'compare' | 'add_to_cart' | 'get_details' | 'checkout' | 'ask_question';
  confidence: number;
  entities?: {
    productTypes?: string[];
    quantities?: number[];
    priceRanges?: { min?: number; max?: number };
  };
}

/**
 * Detects user intent and shopping mode from the conversation
 */
export async function detectIntentNode(
  state: CommerceState,
  config?: RunnableConfig
): Promise<Partial<CommerceState>> {
  return traceLangGraphNode('detectIntent', async (span) => {
    const sessionId = state.context.sessionId || 'unknown';
    const correlationId = state.context.correlationId || sessionId;
    
    logger.info('Graph', 'Detecting user intent', {
      sessionId,
      correlationId,
      messageCount: state.messages.length
    });
    
    const startTime = performance.now();
    const lastMessage = state.messages[state.messages.length - 1];
    if (!lastMessage || lastMessage._getType() !== 'human') {
      logger.debug('Graph', 'No human message found, skipping intent detection', { sessionId, correlationId });
      return {};
    }

  // Initialize security judge with current context
  const securityJudge = new CommerceSecurityJudge(state.security);
  
  // Validate input before processing
  const validationResult = await securityJudge.validate(lastMessage, state, 'input');
  
  if (!validationResult.isValid) {
    // Create security alert command
    const commands: StateUpdateCommand[] = [
      {
        type: 'UPDATE_SECURITY',
        payload: securityJudge.getContext()
      },
      {
        type: 'SET_ERROR',
        payload: new Error(`Security validation failed: ${validationResult.reason}`)
      }
    ];
    
    // If critical threat, block processing
    if (validationResult.severity === 'critical' || securityJudge.shouldBlock()) {
      commands.push({
        type: 'UPDATE_CONTEXT',
        payload: {
          detectedIntent: 'blocked',
          intentConfidence: 1.0,
          blockedReason: validationResult.reason
        }
      });
      return applyCommandsToState(state, commands);
    }
  }
  
  // Use sanitized input if available
  const messageContent = validationResult.sanitizedInput || lastMessage.content as string;

  // First, use ModeDetector for initial mode detection
  const modeDetection = ModeDetector.analyzeConversation(state.messages, state);
  
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.3, // Lower temperature for more consistent classification
    responseFormat: { type: 'json_object' }
  });

  const systemPrompt = `You are analyzing an e-commerce query to determine shopping mode and intent.

Current Mode Detection: ${modeDetection.mode} (${Math.round(modeDetection.confidence * 100)}% confidence)
Mode Indicators: ${modeDetection.indicators.join(', ')}

Shopping Modes:
- B2C (consumer): Personal shopping, single items, consumer language
- B2B (business): Bulk orders, wholesale pricing, business accounts, tax exemption

Intent Types:
- search: Looking for products (e.g., "show me laptops", "I need running shoes")
- compare: Comparing products (e.g., "difference between X and Y", "which is better")
- add_to_cart: Adding items to cart (e.g., "add 2 of these", "I'll take it")
- get_details: Requesting specific product info (e.g., "tell me more about", "what are the specs")
- checkout: Ready to purchase (e.g., "proceed to checkout", "I want to buy")
- ask_question: General questions (e.g., "how does shipping work", "what's your return policy")

Also extract entities like:
- Product types mentioned
- Quantities (especially important for B2B detection)
- Price ranges mentioned

Take into account the mode detection results but make your own assessment based on the current message.

Respond in JSON format:
{
  "mode": "b2c" | "b2b",
  "intent": "search" | "compare" | "add_to_cart" | "get_details" | "checkout" | "ask_question",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "entities": {
    "productTypes": ["laptop", "monitor"],
    "quantities": [100],
    "priceRanges": { "min": 500, "max": 1000 }
  }
}`;

  try {
    const response = await model.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: messageContent }
    ], config);

    const analysis = JSON.parse(response.content as string) as IntentDetectionResult & { reasoning: string };
    
    // Blend mode detection results with LLM analysis
    const finalMode = analysis.confidence > modeDetection.confidence ? analysis.mode : modeDetection.mode;
    const finalConfidence = Math.max(analysis.confidence, modeDetection.confidence);
    
      // Create state update commands
      const commands: StateUpdateCommand[] = [
        { type: 'SET_MODE', payload: { mode: finalMode } },
        { 
          type: 'UPDATE_CONTEXT', 
          payload: { 
            detectedIntent: analysis.intent,
            intentConfidence: analysis.confidence,
            intentEntities: analysis.entities,
            modeDetectionSignals: modeDetection.signals,
            modeIndicators: modeDetection.indicators
          } 
        }
      ];
      
      // Update security context if validation was performed
      if (validationResult) {
        commands.push({
          type: 'UPDATE_SECURITY',
          payload: securityJudge.getContext()
        });
      }

      // Add performance tracking
      const duration = performance.now() - startTime;
      commands.push({
        type: 'UPDATE_PERFORMANCE',
        payload: {
          nodeExecutionTimes: {
            detectIntent: [duration]
          }
        }
      });
      
      // Record metrics
      metrics.recordNodeExecution('detectIntent', duration, true);
      metrics.recordIntentDetection(analysis.intent, finalMode);

      return applyCommandsToState(state, commands);
    } catch (error) {
      logger.error('AI', 'Intent detection failed', {
        sessionId,
        correlationId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      const duration = performance.now() - startTime;
      metrics.recordNodeExecution('detectIntent', duration, false);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : 'Intent detection failed' });
      
      const errorCommand: StateUpdateCommand = {
        type: 'SET_ERROR',
        payload: new Error(`Intent detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      };
      
      const perfCommand: StateUpdateCommand = {
        type: 'UPDATE_PERFORMANCE',
        payload: {
          nodeExecutionTimes: {
            detectIntent: [duration]
          }
        }
      };
      
      return applyCommandsToState(state, [errorCommand, perfCommand]);
    }
  });
}