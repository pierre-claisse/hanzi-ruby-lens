import type { Word } from "../types/domain";

interface RubyWordProps {
  word: Word;
  showPinyin?: boolean;
}

export function RubyWord({ word, showPinyin = true }: RubyWordProps) {
  return (
    <ruby className="font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out hover:bg-vermillion/24 focus-visible:ring-2 focus-visible:ring-vermillion">
      {word.characters}
      <rp>(</rp>
      <rt className={`text-vermillion transition-opacity duration-200 ease-in-out ${showPinyin ? 'opacity-100' : 'opacity-0'}`}>
        {word.pinyin}
      </rt>
      <rp>)</rp>
    </ruby>
  );
}
