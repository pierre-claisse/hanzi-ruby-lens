interface EmptyStateProps {
  onEnterText: () => void;
}

export function EmptyState({ onEnterText }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
      <p className="text-content/60 text-lg text-center mb-8 max-w-md">
        Paste Chinese text to read with pinyin annotations
      </p>
      <button
        type="button"
        className="px-6 py-3 bg-accent text-white rounded-lg text-base font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        onClick={onEnterText}
      >
        Enter Text
      </button>
    </div>
  );
}
