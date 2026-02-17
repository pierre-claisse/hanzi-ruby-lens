interface ProcessingStateProps {
  isProcessing: boolean;
  error: string | null;
  onProcess: () => void;
  onRetry: () => void;
  onEdit: () => void;
}

export function ProcessingState({
  isProcessing,
  error,
  onProcess,
  onRetry,
  onEdit,
}: ProcessingStateProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        <p className="text-content/60 text-lg text-center mb-8">{error}</p>
        <div className="flex gap-4">
          <button
            type="button"
            className="px-5 py-2 text-content/60 hover:text-content border border-content/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            onClick={onRetry}
          >
            Retry
          </button>
          <button
            type="button"
            className="px-5 py-2 text-content/60 hover:text-content border border-content/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-8">
        <div className="mb-6 h-8 w-8 rounded-full border-2 border-content/20 border-t-content/60 animate-spin" />
        <p className="text-content/60 text-lg text-center">Processing text...</p>
      </div>
    );
  }

  // Idle: text saved but not yet processed (e.g., app restart with unprocessed text)
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8">
      <p className="text-content/60 text-lg text-center mb-8">
        Text saved, ready to process
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          className="px-5 py-2 text-content/60 hover:text-content border border-content/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          onClick={onProcess}
        >
          Process
        </button>
        <button
          type="button"
          className="px-5 py-2 text-content/60 hover:text-content border border-content/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
