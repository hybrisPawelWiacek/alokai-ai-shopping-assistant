import { FormEvent, useState } from 'react';

interface ChatInputProps {
  isLoading: boolean;
  onSend: (message: string) => void;
}

export function ChatInput({ isLoading, onSend }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    onSend(trimmedMessage);
    setMessage('');
  };

  return (
    <form className="flex gap-2 border-t p-4" onSubmit={handleSubmit}>
      <input
        className="focus:ring-primary/50 flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2"
        disabled={isLoading}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask your shopping assistant..."
        type="text"
        value={message}
      />
      <button
        className="bg-primary hover:bg-primary/90 rounded-full px-6 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isLoading || !message.trim()}
        type="submit"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Sending...
          </span>
        ) : (
          'Send'
        )}
      </button>
    </form>
  );
}
