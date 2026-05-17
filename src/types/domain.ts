export interface Word {
  characters: string;
  pinyin: string;
  comment?: string;
  commentAuthor?: string;
  commentAt?: string;
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

export interface CommentRef {
  segmentIndex: number;
  commentAt: string;
}

export interface TextPreview {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string | null;
  tags: Tag[];
  locked: boolean;
  comments: CommentRef[];
}

export type SessionKind = "live_lesson" | "study_session";

export interface Session {
  id: number;
  date: string;           // YYYY-MM-DD GMT+8
  startTime: string;      // HH:MM GMT+8
  endTime: string;        // HH:MM GMT+8
  kind: SessionKind;
  done: boolean;
  notes: string | null;
  author: string | null;
  textIds: number[];
  createdAt: string;
  modifiedAt: string | null;
}
