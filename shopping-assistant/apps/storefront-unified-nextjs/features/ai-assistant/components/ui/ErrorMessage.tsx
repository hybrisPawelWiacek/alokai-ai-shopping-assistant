interface ErrorMessageProps {
  message: string;
  suggestions?: string[];
}

export default function ErrorMessage({ message, suggestions }: ErrorMessageProps) {
  return (
    <div className="rounded-lg bg-red-50 p-4 text-red-800">
      <p>{message}</p>
      {suggestions && suggestions.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-sm">
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
