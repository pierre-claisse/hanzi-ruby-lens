import type { Word } from "../types/domain";

interface RubyWordProps {
  word: Word;
}

export function RubyWord({ word }: RubyWordProps) {
  return (
    <ruby className="font-hanzi rounded px-0.5 transition-colors duration-200 ease-in-out hover:bg-vermillion/12 focus-visible:ring-2 focus-visible:ring-vermillion">
      {word.characters}
      <rp>(</rp>
      <rt className="text-vermillion">{word.pinyin}</rt>
      <rp>)</rp>
    </ruby>
  );
}
