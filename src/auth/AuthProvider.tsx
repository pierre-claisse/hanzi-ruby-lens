// React context that holds the unlocked sync credentials and the user's role
// once the LoginScreen has succeeded. Nothing is persisted: a page reload
// returns to `{ status: "locked" }` and the modal pops again.
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  unlockAsCommon,
  unlockAsPierre,
  type UnlockResult,
} from "../sync";

type AuthState =
  | { status: "locked" }
  | {
      status: "unlocked";
      role: "pierre" | "common";
      pat: string;
      gistId: string;
      syncPassword: string;
    };

interface AuthContextValue {
  state: AuthState;
  /** Try the common-identity path. Returns true on success, false on bad pwd. */
  signInAsCommon: (syncPassword: string) => Promise<boolean>;
  /** Try the Pierre-identity path. Returns true on success, false on bad pwd. */
  signInAsPierre: (syncPassword: string, pierrePassword: string) => Promise<boolean>;
  /** Drop the in-memory credentials and re-show the LoginScreen. */
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toState(r: UnlockResult): AuthState {
  return {
    status: "unlocked",
    role: r.role,
    pat: r.secrets.pat,
    gistId: r.secrets.gist_id,
    syncPassword: r.syncPassword,
  };
}

export interface AuthProviderProps {
  children: ReactNode;
  /** Test-only: pre-seed an unlocked state to bypass the LoginScreen. */
  initialState?: AuthState;
}

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState ?? { status: "locked" });

  const signInAsCommon = useCallback(async (syncPassword: string) => {
    const r = await unlockAsCommon(syncPassword);
    if (!r) return false;
    setState(toState(r));
    return true;
  }, []);

  const signInAsPierre = useCallback(
    async (syncPassword: string, pierrePassword: string) => {
      const r = await unlockAsPierre(syncPassword, pierrePassword);
      if (!r) return false;
      setState(toState(r));
      return true;
    },
    [],
  );

  const signOut = useCallback(() => {
    setState({ status: "locked" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, signInAsCommon, signInAsPierre, signOut }),
    [state, signInAsCommon, signInAsPierre, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
