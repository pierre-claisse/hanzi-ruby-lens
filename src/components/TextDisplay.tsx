import type { Text } from "../types/domain";
import { RubyWord } from "./RubyWord";

interface TextDisplayProps {
  text: Text;
  showPinyin?: boolean;
  zoomLevel?: number;
}

export function TextDisplay({ text, showPinyin = true, zoomLevel = 100 }: TextDisplayProps) {
  const fontSize = `${1.5 * zoomLevel / 100}rem`;

  if (text.segments.length === 0) {
    return (
      <div className="font-hanzi leading-[2.5] select-none cursor-default" style={{ fontSize }}>
        <p className="text-center text-content/50 py-16">No text to display.</p>
      </div>
    );
  }

  return (
    <div className="font-hanzi leading-[2.5] select-none cursor-default" style={{ fontSize }}>
      {text.segments.map((segment, index) =>
        segment.type === "word" ? (
          <RubyWord key={index} word={segment.word} showPinyin={showPinyin} />
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </div>
  );
}
