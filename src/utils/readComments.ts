const STORAGE_KEY = "readComments";
const CHANGE_EVENT = "hrl-read-comments-changed";

export function readCommentKey(textId: number, segmentIndex: number, commentAt: string): string {
  return `${textId}:${segmentIndex}:${commentAt}`;
}

export function loadReadCommentSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function persist(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // Silent fallback
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function markCommentRead(textId: number, segmentIndex: number, commentAt: string) {
  const set = loadReadCommentSet();
  set.add(readCommentKey(textId, segmentIndex, commentAt));
  persist(set);
}

export function markCommentUnread(textId: number, segmentIndex: number, commentAt: string) {
  const set = loadReadCommentSet();
  set.delete(readCommentKey(textId, segmentIndex, commentAt));
  persist(set);
}

export function toggleCommentRead(textId: number, segmentIndex: number, commentAt: string) {
  const set = loadReadCommentSet();
  const key = readCommentKey(textId, segmentIndex, commentAt);
  if (set.has(key)) {
    set.delete(key);
  } else {
    set.add(key);
  }
  persist(set);
}

export function subscribeReadComments(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, fn);
  return () => window.removeEventListener(CHANGE_EVENT, fn);
}
