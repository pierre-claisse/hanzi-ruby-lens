// Test helper: render the `<App />` (or any subtree) inside a pre-unlocked
// `<AuthProvider />` plus a `<SyncSizeProvider />`. Skips the LoginScreen so
// existing integration tests can keep asserting against the library /
// reading / calendar views without having to type a password.
import type { ReactNode } from "react";
import { AuthProvider } from "../../src/auth";
import { SyncSizeProvider } from "../../src/sync";

interface Options {
  role?: "pierre" | "common";
  pat?: string;
  gistId?: string;
  syncPassword?: string;
}

export function UnlockedAuth({
  children,
  role = "pierre",
  pat = "test-pat",
  gistId = "test-gist",
  syncPassword = "test-pwd",
}: Options & { children: ReactNode }) {
  return (
    <AuthProvider
      initialState={{
        status: "unlocked",
        role,
        pat,
        gistId,
        syncPassword,
      }}
    >
      <SyncSizeProvider>{children}</SyncSizeProvider>
    </AuthProvider>
  );
}
