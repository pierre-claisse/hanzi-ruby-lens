import { useEffect, useState } from "react";

/**
 * Reactive `navigator.onLine`. Updates whenever the browser fires the
 * `online`/`offline` events. Used to grey out the Pull/Save buttons when
 * the user has no network — the GitHub Gist API isn't reachable then.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  return online;
}
