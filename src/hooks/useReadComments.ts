import { useState, useEffect, useCallback } from "react";
import {
  loadReadCommentSet,
  subscribeReadComments,
  readCommentKey,
  markCommentRead,
  markCommentUnread,
  toggleCommentRead,
} from "../utils/readComments";

interface UseReadCommentsReturn {
  isRead: (textId: number, segmentIndex: number, commentAt: string) => boolean;
  markRead: (textId: number, segmentIndex: number, commentAt: string) => void;
  markUnread: (textId: number, segmentIndex: number, commentAt: string) => void;
  toggle: (textId: number, segmentIndex: number, commentAt: string) => void;
}

export function useReadComments(): UseReadCommentsReturn {
  const [readSet, setReadSet] = useState<Set<string>>(() => loadReadCommentSet());

  useEffect(() => {
    return subscribeReadComments(() => {
      setReadSet(loadReadCommentSet());
    });
  }, []);

  const isRead = useCallback(
    (textId: number, segmentIndex: number, commentAt: string) =>
      readSet.has(readCommentKey(textId, segmentIndex, commentAt)),
    [readSet],
  );

  return {
    isRead,
    markRead: markCommentRead,
    markUnread: markCommentUnread,
    toggle: toggleCommentRead,
  };
}
