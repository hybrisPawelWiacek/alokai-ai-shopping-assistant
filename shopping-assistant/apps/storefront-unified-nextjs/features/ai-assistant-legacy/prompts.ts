import type { AssistantContext } from './types';
import { actions } from './actions';

const actionsList = Object.entries(actions)
  .map(([name, { description, parameters }]) => {
    const paramsList = Object.entries(parameters)
      .map(([paramName, paramDesc]) => `    - ${paramName}: ${paramDesc}`)
      .join('\n');
    return `${name}: ${description}\nParameters:\n${paramsList}`;
  })
  .join('\n\n');

export const SYSTEM_PROMPT = `You are a helpful e-commerce assistant. Your goal is to help users find and purchase products.

When responding to users, follow these rules:
1. Always use the provided actions to get information about products and cart.
2. When showing search results or products, use the provided UI components.
3. Format your responses in a natural, conversational way.
4. Keep responses concise and focused on the user's query.
5. If you need to reference product details, use the exact values from the product data.
6. IMPORTANT: When showing search results or cart results, the products will be stored in your message history. Use this history to reference products when users ask about them later.
7. When referencing a product from previous search results or product views, include its exact name, ID, and price to maintain context.

Example response format for cart queries:
For adding a previously shown product:
{
  "content": "I'll add the Hammer drill 6383 priced at $32.00 to your cart.",
  "actions": [
    {
      "type": "ADD_TO_CART",
      "payload": {
        "productId": "6383",
        "quantity": 1
      }
    },
    {
      "type": "GET_CART"
    }
  ]
}

For showing search results:
{
  "content": "Here are the drill results.",
  "actions": [{
    "type": "SEARCH_PRODUCTS",
    "payload": {
      "query": "drill"
    }
  }]
}

Available actions:
${actionsList}

Your responses must be in JSON format with these fields:
{
  "content": "Your response message",
  "actions": [
    {
      "type": "ACTION_TYPE",
      "payload": {
        // action-specific parameters
      }
    }
  ]
}`;

export function generatePrompt(userMessage: string, context: AssistantContext): string {
  const contextInfo = [];

  if (context.currentPage) {
    contextInfo.push(`Current page: ${context.currentPage}`);
  }

  if (context.cartItems?.length) {
    contextInfo.push(
      'Current cart:',
      ...context.cartItems.map((item) => `- Product ${item.productId}: ${item.quantity} units (lineItemId: ${item.lineItemId})`),
    );
  }

  if (context.lastAction) {
    contextInfo.push(
      `Last action performed: ${context.lastAction.type} with payload: ${JSON.stringify(context.lastAction.payload)}`,
    );
  }

  let conversationHistory = '';
  if (context.messageHistory?.length) {
    conversationHistory = `
    Previous conversation:
    ${context.messageHistory.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
    `;
    console.log('conversationHistory', conversationHistory);
  }

  return `${SYSTEM_PROMPT}

Current Context:
  ${contextInfo.join('\n')}
  ${conversationHistory}
  User Message: "${userMessage}"

  Remember to respond in JSON format with a helpful message and any necessary actions.`;
}

export function generateErrorPrompt(error: Error): string {
  return `${SYSTEM_PROMPT}

    An error occurred: ${error.message}

    Please provide a helpful error message to the user and suggest alternative actions if appropriate.

    Remember to respond in JSON format with a helpful message. Do not include actions in the error response.`;
}
