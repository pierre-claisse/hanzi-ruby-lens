// Fetches the encrypted `sync_blobs.json` shipped alongside the bundle and
// attempts to unlock it with the credentials the user typed in the
// LoginScreen.
//
// Two flows (mirroring the modal's identity toggle):
//   - unlockAsCommon(syncPassword)            → "common" role
//   - unlockAsPierre(syncPassword, pierrePwd) → "pierre" role
//
// The plaintext PAT stays in memory only — never localStorage, never IDB.
import {
  tryUnlockCommon,
  tryUnlockPierre,
  type SyncBlobs,
  type SyncSecrets,
} from "../crypto";

const BLOB_PATH = "sync_blobs.json";

let blobPromise: Promise<SyncBlobs> | null = null;

async function fetchBlob(): Promise<SyncBlobs> {
  if (blobPromise) return blobPromise;
  blobPromise = (async () => {
    // The literal `import.meta.env.BASE_URL` is replaced inline by Vite at
    // build time with the configured `base` (e.g. "/hanzi-ruby-lens/").
    // Wrapping it in a cast or destructuring breaks the substitution and
    // the runtime sees `undefined` → wrong URL → 404.
    const url = `${import.meta.env.BASE_URL}${BLOB_PATH}`;
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

export interface UnlockResult {
  role: "pierre" | "common";
  secrets: SyncSecrets;
  /** The sync password is kept in memory by the AuthProvider so subsequent
   *  pull/save can reuse it without re-prompting. Only valid until reload. */
  syncPassword: string;
}

export async function unlockAsCommon(
  syncPassword: string,
): Promise<UnlockResult | null> {
  const blob = await fetchBlob();
  const secrets = await tryUnlockCommon(syncPassword, blob);
  if (!secrets) return null;
  return { role: "common", secrets, syncPassword };
}

export async function unlockAsPierre(
  syncPassword: string,
  pierrePassword: string,
): Promise<UnlockResult | null> {
  const blob = await fetchBlob();
  const out = await tryUnlockPierre(syncPassword, pierrePassword, blob);
  if (!out) return null;
  return { role: "pierre", secrets: out.secrets, syncPassword };
}

/** Test helper. */
export function __resetSecretsLoaderForTests(): void {
  blobPromise = null;
}
