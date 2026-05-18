import { useMemo } from "react";

export interface Identity {
  name: string;
  /** IANA time zone, e.g. "Europe/Paris", "Asia/Taipei", "America/New_York". */
  timeZone: string;
}

const PIERRE_NAME = "Pierre Claisse";
const CELESTE_NAME = "段予婷";

/**
 * Identity is derived from the role chosen at login (Pierre vs 段予婷). The
 * associated time zone is detected from the browser via
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`, NOT bound to the
 * identity — both users may travel.
 *
 * Same `role` semantics as the desktop "authorized device": `pierre`
 * unlocks Delete / Reset / Import / Export.
 */
export function useIdentity(role: "pierre" | "common"): Identity {
  return useMemo(() => {
    let timeZone = "UTC";
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      // Fall back to UTC if Intl isn't available (extremely old browsers).
    }
    return {
      name: role === "pierre" ? PIERRE_NAME : CELESTE_NAME,
      timeZone,
    };
  }, [role]);
}
