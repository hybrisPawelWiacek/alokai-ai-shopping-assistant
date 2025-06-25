import { pick } from 'lodash-es';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { ChatInterface, ShoppingAssistantProvider } from '@/components/ai-shopping-assistant';

export const metadata = {
  description: 'Get help with your shopping needs using our AI assistant',
  title: 'AI Shopping Assistant',
};

export default async function AssistantPage() {
  const messages = await getMessages();
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">AI Shopping Assistant</h1>
      <NextIntlClientProvider messages={pick(messages, [
        'AddToCartButton',
        'ProductCard',
        'SearchResults',
        'Cart',
        'Error'
      ])}>
        <ShoppingAssistantProvider defaultEnabled={true} defaultMode="b2c">
          <div className="bg-white rounded-lg shadow-lg">
            <ChatInterface 
              height="600px"
              showModeToggle={true}
              welcomeMessage="Hello! I'm your AI shopping assistant. I can help you find products, manage your cart, and answer questions about our store. How can I assist you today?"
              placeholder="Type your question here..."
            />
          </div>
        </ShoppingAssistantProvider>
      </NextIntlClientProvider>
    </div>
  );
}
