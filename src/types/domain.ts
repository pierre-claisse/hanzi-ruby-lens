export interface Word {
  characters: string;
  pinyin: string;
}

export type TextSegment =
  | { type: "word"; word: Word }
  | { type: "plain"; text: string };

export interface Text {
  rawInput?: string;
  segments: TextSegment[];
}
