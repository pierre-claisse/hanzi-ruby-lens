import { useState } from "react";

interface TextInputViewProps {
  onSubmit: (title: string, rawInput: string) => void;
  onCancel: () => void;
}

const MAX_LENGTH = 1500;

function containsChinese(text: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text);
}

export function TextInputView({ onSubmit, onCancel }: TextInputViewProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  const canSubmit = title.trim().length > 0 && containsChinese(value);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(title.trim(), value);
  };

  return (
    <div className="flex flex-col h-full px-8 py-6 gap-4">
      <input
        type="text"
        className="w-full p-3 bg-surface border border-content/10 rounded-lg text-content text-base focus:outline-none focus:border-accent/50"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="flex-1 w-full p-4 bg-surface border border-content/10 rounded-lg text-content text-lg resize-none focus:outline-none focus:border-accent/50"
        placeholder="在此輸入或貼上中文..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={MAX_LENGTH}
      />
      <div className="text-content/40 text-sm text-right px-1">
        {value.length}/{MAX_LENGTH}
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-5 py-2 text-content/60 hover:text-content transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-5 py-2 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
