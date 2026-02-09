import type { Word } from "../types/domain";

interface RubyWordProps {
  word: Word;
}

export function RubyWord({ word }: RubyWordProps) {
  return (
    <ruby className="font-hanzi rounded transition-colors duration-200 ease-in-out hover:bg-vermillion/8">
      {word.characters}
      <rp>(</rp>
      <rt className="text-vermillion">{word.pinyin}</rt>
      <rp>)</rp>
    </ruby>
  );
}
