import { pick } from 'lodash-es';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { AIAssistant } from '@/features/ai-assistant/components/AIAssistant';

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
        <AIAssistant />
      </NextIntlClientProvider>
    </div>
  );
}
