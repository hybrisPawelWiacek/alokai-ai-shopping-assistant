import { Metadata } from 'next';
import { ShoppingAssistantWidget, ShoppingAssistantProvider, ChatInterface } from '@/components/ai-shopping-assistant';

export const metadata: Metadata = {
  title: 'AI Shopping Assistant Demo',
  description: 'Demo page for the AI Shopping Assistant',
};

export default function AIAssistantDemoPage() {
  return (
    <ShoppingAssistantProvider defaultEnabled={true} defaultMode="b2c">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">AI Shopping Assistant Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Embedded Chat Interface */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Embedded Chat Interface</h2>
            <p className="text-neutral-600 mb-4">
              This shows how to embed the chat interface directly into a page.
            </p>
            <ChatInterface 
              height="500px"
              showModeToggle={true}
              welcomeMessage="Welcome! I'm here to help you find the perfect products. What are you looking for today?"
            />
          </div>

          {/* Widget Demo */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Widget Integration</h2>
            <p className="text-neutral-600 mb-4">
              The AI Assistant can also be added as a floating widget on any page. Look for the button in the bottom right corner.
            </p>
            
            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Integration Code:</h3>
              <pre className="bg-neutral-900 text-white p-4 rounded overflow-x-auto text-sm">
{`// Add to your layout or page:
import { ShoppingAssistantWidget } from '@/components/ai-shopping-assistant';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ShoppingAssistantWidget 
        position="bottom-right"
        triggerText="Need Help?"
      />
    </>
  );
}`}
              </pre>
            </div>

            <div className="mt-6 bg-primary-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Features:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-primary-700 mr-2">•</span>
                  <span>Real-time streaming responses for better UX</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-700 mr-2">•</span>
                  <span>Rich UI components for product display</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-700 mr-2">•</span>
                  <span>B2C and B2B mode support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-700 mr-2">•</span>
                  <span>Integrated with Alokai's Unified Data Layer</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-700 mr-2">•</span>
                  <span>Secure API with rate limiting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Custom Action Example */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Custom Action Rendering</h2>
          <p className="text-neutral-600 mb-4">
            You can customize how actions are rendered by providing a renderCustomAction prop:
          </p>
          
          <div className="bg-neutral-50 p-6 rounded-lg">
            <pre className="bg-neutral-900 text-white p-4 rounded overflow-x-auto text-sm">
{`<ChatInterface
  renderCustomAction={(action) => {
    if (action.type === 'special_offer') {
      return (
        <div className="bg-secondary-100 p-3 rounded">
          <h4 className="font-semibold">{action.data.title}</h4>
          <p>{action.data.description}</p>
          <button className="mt-2 text-secondary-700 underline">
            Claim Offer
          </button>
        </div>
      );
    }
    return null; // Use default rendering
  }}
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Floating Widget */}
      <ShoppingAssistantWidget 
        position="bottom-right"
        triggerText="Need Help?"
      />
    </ShoppingAssistantProvider>
  );
}