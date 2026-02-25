export interface Word {
  characters: string;
  pinyin: string;
}

export type TextSegment =
  | { type: "word"; word: Word }
  | { type: "plain"; text: string };

export interface Text {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string | null;
  rawInput: string;
  segments: TextSegment[];
  locked: boolean;
}

export interface Tag {
  id: number;
  label: string;
  color: string;
}

export interface TextPreview {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string | null;
  tags: Tag[];
  locked: boolean;
}
