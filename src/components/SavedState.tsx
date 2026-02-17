interface SavedStateProps {
  onEdit: () => void;
}

export function SavedState({ onEdit }: SavedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
      <p className="text-content/60 text-lg text-center mb-8">
        Text saved, awaiting processing
      </p>
      <button
        type="button"
        className="px-5 py-2 text-content/60 hover:text-content border border-content/10 rounded-lg transition-colors"
        onClick={onEdit}
      >
        Edit
      </button>
    </div>
  );
}
