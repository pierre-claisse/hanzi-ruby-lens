import { Languages } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

interface TranslateButtonProps {
  rawInput: string;
}

const MAX_ENCODED_LENGTH = 5000;

export function TranslateButton({ rawInput }: TranslateButtonProps) {
  const disabled = rawInput === "";

  const handleClick = () => {
    const baseUrl = "https://translate.google.com/?sl=zh-TW&tl=en&text=";

    let textToEncode = rawInput;
    let encoded = encodeURIComponent(textToEncode);
    while (encoded.length > MAX_ENCODED_LENGTH && textToEncode.length > 0) {
      textToEncode = textToEncode.slice(0, -1);
      encoded = encodeURIComponent(textToEncode);
    }

    openUrl(baseUrl + encoded);
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label="Translate text"
      title="Google Translate"
      className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface"
    >
      <Languages className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
