import type { Text } from "../types/domain";
import { RubyWord } from "./RubyWord";
import { MinWidthOverlay } from "./MinWidthOverlay";

interface TextDisplayProps {
  text: Text;
}

export function TextDisplay({ text }: TextDisplayProps) {
  if (text.segments.length === 0) {
    return (
      <div className="font-hanzi text-2xl leading-[2.8]">
        <p className="text-center text-ink/50 py-16">No text to display.</p>
        <MinWidthOverlay />
      </div>
    );
  }

  return (
    <div className="font-hanzi text-2xl leading-[2.8]">
      {text.segments.map((segment, index) =>
        segment.type === "word" ? (
          <RubyWord key={index} word={segment.word} />
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
      <MinWidthOverlay />
    </div>
  );
}
