// Mandatory login modal shown on every page load while the AuthProvider is
// in the "locked" state. There is no close affordance — the user MUST
// either sign in or stay on the modal.
//
// Toggle picks the identity:
//   - 段予婷: a single "Sync password" field is shown
//   - Pierre Claisse: two fields appear, "Sync password" and "Pierre password"
//
// On submit we call into AuthProvider's signInAsCommon / signInAsPierre.
// Wrong credentials → inline error, modal stays open.
import { useState, useCallback } from "react";
import { useAuth } from "./AuthProvider";

type Identity = "common" | "pierre";

export function LoginScreen() {
  const { signInAsCommon, signInAsPierre } = useAuth();
  const [identity, setIdentity] = useState<Identity>("common");
  const [syncPassword, setSyncPassword] = useState("");
  const [pierrePassword, setPierrePassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState(false);

  const canSubmit =
    !inFlight &&
    syncPassword.length > 0 &&
    (identity === "common" || pierrePassword.length > 0);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setInFlight(true);
      setError(null);
      try {
        const ok =
          identity === "common"
            ? await signInAsCommon(syncPassword)
            : await signInAsPierre(syncPassword, pierrePassword);
        if (!ok) {
          setError(
            identity === "common"
              ? "Invalid password."
              : "Invalid sync password or Pierre password.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? `Could not load credentials: ${err.message}`
            : "Could not load credentials.",
        );
      } finally {
        setInFlight(false);
      }
    },
    [canSubmit, identity, syncPassword, pierrePassword, signInAsCommon, signInAsPierre],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      // No onMouseDown — clicking outside is intentionally inert.
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-content/20 rounded-xl shadow-xl w-full max-w-md mx-4"
      >
        <div className="px-5 py-4 border-b border-content/10">
          <h2 id="login-title" className="text-lg font-semibold text-content">
            Sign in
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Identity toggle */}
          <fieldset className="space-y-2">
            <legend className="text-xs text-content/50">Sign in as</legend>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIdentity("common")}
                aria-pressed={identity === "common"}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  identity === "common"
                    ? "border-accent bg-accent text-white"
                    : "border-content/20 text-content hover:bg-content/5"
                }`}
              >
                段予婷
              </button>
              <button
                type="button"
                onClick={() => setIdentity("pierre")}
                aria-pressed={identity === "pierre"}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  identity === "pierre"
                    ? "border-accent bg-accent text-white"
                    : "border-content/20 text-content hover:bg-content/5"
                }`}
              >
                Pierre Claisse
              </button>
            </div>
          </fieldset>

          <label className="block">
            <span className="block text-xs text-content/50 mb-1">Sync password</span>
            <input
              type="password"
              autoComplete="off"
              className="w-full px-3 py-2 text-sm bg-content/5 border border-content/20 rounded-lg text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
              value={syncPassword}
              onChange={(e) => setSyncPassword(e.target.value)}
              autoFocus
            />
          </label>

          {identity === "pierre" && (
            <label className="block">
              <span className="block text-xs text-content/50 mb-1">
                Pierre password
              </span>
              <input
                type="password"
                autoComplete="off"
                className="w-full px-3 py-2 text-sm bg-content/5 border border-content/20 rounded-lg text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
                value={pierrePassword}
                onChange={(e) => setPierrePassword(e.target.value)}
              />
            </label>
          )}

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-content/10">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {inFlight ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
