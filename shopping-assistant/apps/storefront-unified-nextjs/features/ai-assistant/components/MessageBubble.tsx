import { AssistantMessage } from '../types';

interface MessageBubbleProps {
  message: AssistantMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary rounded-br-none text-white' : 'rounded-bl-none bg-gray-100 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
      </div>
    </div>
  );
}
