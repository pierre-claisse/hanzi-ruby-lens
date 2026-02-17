import { useState } from "react";

interface TextInputViewProps {
  initialValue: string;
  onSubmit: (rawInput: string) => Promise<void>;
  onCancel: () => void;
}

export function TextInputView({ initialValue, onSubmit, onCancel }: TextInputViewProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-8 py-6 gap-4">
      <textarea
        className="flex-1 w-full p-4 bg-surface border border-content/10 rounded-lg text-content font-hanzi text-lg resize-none focus:outline-none focus:border-accent/50"
        placeholder="在此輸入或貼上中文..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isSaving}
        autoFocus
      />
      {error && (
        <div role="alert" className="text-red-500 text-sm px-1">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-5 py-2 text-content/60 hover:text-content transition-colors rounded-lg"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-5 py-2 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
