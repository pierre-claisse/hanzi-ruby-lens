// Two-password authorisation scheme.
//
// The bundle ships two independent encrypted blobs (`sync_blobs.json`):
//
//   sync_blob     = AES-GCM-encrypt({ pat, gist_id }, Argon2id(syncPassword))
//   pierre_marker = AES-GCM-encrypt("granted",          Argon2id(pierrePassword))
//
// 段予婷 only needs `syncPassword` to unlock sync (pull/save).
// Pierre supplies BOTH `syncPassword` AND `pierrePassword` to additionally
// unlock the `pierre_marker`, which gates Delete / Reset / Import / Export.
//
// Picking "Pierre Claisse" in the login UI without knowing `pierrePassword`
// just fails on the marker unwrap — the toggle is purely a UX selector.
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  NONCE_BYTES,
  randomBytes,
} from "./aesGcm";
import { base64ToBytes, bytesToBase64 } from "./base64";
import { deriveKey, SALT_BYTES } from "./kdf";

export interface EncryptedBlob {
  salt: string;       // base64, 16 bytes
  nonce: string;      // base64, 12 bytes
  ciphertext: string; // base64, opaque length
}

export interface SyncBlobs {
  version: 1;
  sync_blob: EncryptedBlob;
  pierre_marker: EncryptedBlob;
}

export interface SyncSecrets {
  pat: string;
  gist_id: string;
}

async function encrypt(
  password: string,
  payload: Uint8Array,
): Promise<EncryptedBlob> {
  const salt = randomBytes(SALT_BYTES);
  const nonce = randomBytes(NONCE_BYTES);
  const key = await deriveKey(password, salt);
  const ct = await aesGcmEncrypt(key, nonce, payload);
  return {
    salt: bytesToBase64(salt),
    nonce: bytesToBase64(nonce),
    ciphertext: bytesToBase64(ct),
  };
}

async function decrypt(
  password: string,
  blob: EncryptedBlob,
): Promise<Uint8Array | null> {
  const salt = base64ToBytes(blob.salt);
  const nonce = base64ToBytes(blob.nonce);
  const ct = base64ToBytes(blob.ciphertext);
  const key = await deriveKey(password, salt);
  return aesGcmDecrypt(key, nonce, ct);
}

// ── Build-time helpers (used by scripts/build-secrets.mjs and tests) ────────

export async function buildSyncBlobs(opts: {
  pat: string;
  gistId: string;
  syncPassword: string;
  pierrePassword: string;
}): Promise<SyncBlobs> {
  const sync_blob = await encrypt(
    opts.syncPassword,
    new TextEncoder().encode(JSON.stringify({ pat: opts.pat, gist_id: opts.gistId })),
  );
  const pierre_marker = await encrypt(
    opts.pierrePassword,
    new TextEncoder().encode("granted"),
  );
  return { version: 1, sync_blob, pierre_marker };
}

// ── Runtime helpers (used by src/sync/secretsLoader.ts) ────────────────────

/**
 * Try the common-identity login path: the user supplies a single
 * `syncPassword`. Returns the decrypted secrets on success, `null` if the
 * password doesn't unlock the sync blob.
 */
export async function tryUnlockCommon(
  syncPassword: string,
  blob: SyncBlobs,
): Promise<SyncSecrets | null> {
  const plain = await decrypt(syncPassword, blob.sync_blob);
  if (!plain) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(plain)) as SyncSecrets;
    if (typeof obj.pat !== "string" || typeof obj.gist_id !== "string") return null;
    return obj;
  } catch {
    return null;
  }
}

/**
 * Try the Pierre-identity login path: the user supplies BOTH passwords. Both
 * must succeed (sync_blob with syncPassword, pierre_marker with pierrePassword)
 * for the call to return non-null. The returned `secrets` are the same ones
 * common would have seen; the difference is that the caller now knows Pierre
 * privileges are unlocked.
 */
export async function tryUnlockPierre(
  syncPassword: string,
  pierrePassword: string,
  blob: SyncBlobs,
): Promise<{ secrets: SyncSecrets; pierreOk: true } | null> {
  const secrets = await tryUnlockCommon(syncPassword, blob);
  if (!secrets) return null;
  const marker = await decrypt(pierrePassword, blob.pierre_marker);
  if (!marker) return null;
  return { secrets, pierreOk: true };
}
