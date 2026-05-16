import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "userName";
const EVENT = "hrl-user-name-changed";

function readName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function useUserName() {
  const [name, setNameState] = useState<string>(readName);

  // Keep this hook instance in sync with any other instance in the same window.
  // localStorage's native `storage` event only fires cross-tab; we add a custom
  // same-tab event so all consumers re-read after a write.
  useEffect(() => {
    const refresh = () => setNameState(readName());
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const setName = useCallback((next: string) => {
    const trimmed = next.trim();
    try {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // localStorage unavailable; in-memory state is still updated
    }
    setNameState(trimmed);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { name, setName, isSet: name.length > 0 };
}
