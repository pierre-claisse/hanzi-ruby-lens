// Fetches the encrypted `sync_blobs.json` shipped alongside the bundle and
// runs it through `tryUnlock` with a user-supplied password. Outcome:
//
//   - decrypt fails              → `{ ok: false }` (wrong password)
//   - decrypt OK, common pwd     → `{ ok: true, role: "common", … }`
//   - decrypt OK, pierre pwd     → `{ ok: true, role: "pierre", … }`
//
// The result feeds the React `AuthProvider` (Phase 5). The plaintext PAT
// stays in memory only — never localStorage, never IDB.
import { tryUnlock, type SyncBlobs, type UnlockOutcome } from "../crypto";

const BLOB_PATH = "sync_blobs.json";

let blobPromise: Promise<SyncBlobs> | null = null;

async function fetchBlob(): Promise<SyncBlobs> {
  if (blobPromise) return blobPromise;
  blobPromise = (async () => {
    // Fetch is relative to the PWA base — e.g.
    // https://pierre-claisse.github.io/hanzi-ruby-lens/sync_blobs.json
    // Vite injects `BASE_URL` (string, not always typed) at build time.
    const meta = import.meta as unknown as { env?: { BASE_URL?: string } };
    const base = meta.env?.BASE_URL ?? "/";
    const url = `${base}${BLOB_PATH}`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      throw new Error(
        `Failed to load ${BLOB_PATH}: HTTP ${resp.status} ${resp.statusText}`,
      );
    }
    return (await resp.json()) as SyncBlobs;
  })();
  return blobPromise;
}

export async function unlockWithPassword(
  password: string,
): Promise<UnlockOutcome> {
  const blob = await fetchBlob();
  return tryUnlock(password, blob);
}

/** Test helper. */
export function __resetSecretsLoaderForTests(): void {
  blobPromise = null;
}
