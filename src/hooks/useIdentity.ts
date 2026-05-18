import { useMemo } from "react";

export interface Identity {
  name: string;
  timeZone: string;
}

const PIERRE: Identity = { name: "Pierre Claisse", timeZone: "Europe/Paris" };
const CELESTE: Identity = { name: "段予婷", timeZone: "Asia/Taipei" };

/**
 * Identity is fully derived from `isAuthorizedDevice` — the authorized machine
 * is Pierre, every other machine is Céleste. There is no user input. The
 * associated time zone is used to display timestamps and compute the calendar's
 * "today".
 */
export function useIdentity(isAuthorizedDevice: boolean): Identity {
  return useMemo(() => (isAuthorizedDevice ? PIERRE : CELESTE), [isAuthorizedDevice]);
}
