import { Eye, EyeClosed } from "lucide-react";

interface PinyinToggleProps {
  visible: boolean;
  onToggle: (visible: boolean) => void;
}

export function PinyinToggle({ visible, onToggle }: PinyinToggleProps) {
  const handleToggle = () => {
    onToggle(!visible);
  };

  return (
    <button
      onClick={handleToggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={visible ? "Hide Pinyin" : "Show Pinyin"}
      aria-pressed={visible}
      className="p-1.5 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2 transition-colors cursor-pointer"
    >
      {visible ? (
        <Eye className="w-5 h-5" aria-hidden="true" />
      ) : (
        <EyeClosed className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  );
}
