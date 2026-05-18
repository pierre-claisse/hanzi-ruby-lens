// Envelope encryption helpers.
//
// A random 32-byte `data key` encrypts the actual secret payload once. The
// data key is then wrapped (encrypted) by every authorised password — the
// `key_wraps` array. A separate `pierre_marker` blob is wrapped only by
// Pierre's password, so a successful unwrap of *that* one is what flips the
// app into Pierre mode.
//
// At login, we try every entry in `key_wraps` with the typed password. If
// any succeeds we have the data key and can decrypt the secrets. Then we
// also try `pierre_marker`; if that succeeds, role = "pierre".
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  KEY_BYTES,
  NONCE_BYTES,
  randomBytes,
} from "./aesGcm";
import { base64ToBytes, bytesToBase64 } from "./base64";
import { deriveKey, SALT_BYTES } from "./kdf";

export interface WrappedBlob {
  salt: string;       // base64, 16 bytes
  nonce: string;      // base64, 12 bytes
  ciphertext: string; // base64, opaque length
}

export interface SecretsCiphertext {
  nonce: string;
  ciphertext: string;
}

export interface SyncBlobs {
  version: 1;
  /** AES-GCM-encrypted `{ pat, gist_id }` keyed by `data_key`. */
  secrets: SecretsCiphertext;
  /** One entry per authorised password. Each holds `data_key` re-encrypted. */
  key_wraps: WrappedBlob[];
  /** Decrypts iff the user provided Pierre's password. Plaintext = "granted". */
  pierre_marker: WrappedBlob;
}

export interface SyncSecrets {
  pat: string;
  gist_id: string;
}

// ── Build-time helpers (used by `scripts/build-secrets.mjs`) ─────────────────

async function wrap(
  password: string,
  payload: Uint8Array,
): Promise<WrappedBlob> {
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

/**
 * Build the on-disk JSON blob. Called from `scripts/build-secrets.mjs` at
 * deploy time only; not part of the runtime bundle.
 */
export async function buildSyncBlobs(opts: {
  pat: string;
  gistId: string;
  commonPassword: string;
  pierrePassword: string;
}): Promise<SyncBlobs> {
  const dataKey = randomBytes(KEY_BYTES);

  // Encrypt the actual secrets once with the data key.
  const secretsNonce = randomBytes(NONCE_BYTES);
  const secretsPlain = new TextEncoder().encode(
    JSON.stringify({ pat: opts.pat, gist_id: opts.gistId }),
  );
  const secretsCt = await aesGcmEncrypt(dataKey, secretsNonce, secretsPlain);

  // Wrap the data key with each authorised password.
  const wrappedCommon = await wrap(opts.commonPassword, dataKey);
  const wrappedPierre = await wrap(opts.pierrePassword, dataKey);

  // Pierre marker — independent secret, only Pierre's password can unwrap it.
  const pierreMarker = await wrap(
    opts.pierrePassword,
    new TextEncoder().encode("granted"),
  );

  return {
    version: 1,
    secrets: {
      nonce: bytesToBase64(secretsNonce),
      ciphertext: bytesToBase64(secretsCt),
    },
    key_wraps: [wrappedCommon, wrappedPierre],
    pierre_marker: pierreMarker,
  };
}

// ── Runtime helpers (used by `src/sync/secretsLoader.ts`) ────────────────────

async function tryUnwrap(
  password: string,
  blob: WrappedBlob,
): Promise<Uint8Array | null> {
  const salt = base64ToBytes(blob.salt);
  const nonce = base64ToBytes(blob.nonce);
  const ct = base64ToBytes(blob.ciphertext);
  const key = await deriveKey(password, salt);
  return aesGcmDecrypt(key, nonce, ct);
}

export type UnlockOutcome =
  | { ok: false }
  | { ok: true; role: "pierre" | "common"; secrets: SyncSecrets };

/**
 * Attempt to unlock the blob with the given password.
 *
 *  - If none of `key_wraps` decrypts → `{ ok: false }` (wrong password).
 *  - If a key_wrap decrypts, we use that data key on `secrets`. We then try
 *    `pierre_marker` with the same password; success ⇒ role = "pierre".
 */
export async function tryUnlock(
  password: string,
  blob: SyncBlobs,
): Promise<UnlockOutcome> {
  let dataKey: Uint8Array | null = null;
  for (const wrap of blob.key_wraps) {
    dataKey = await tryUnwrap(password, wrap);
    if (dataKey) break;
  }
  if (!dataKey) return { ok: false };

  const secretsPlain = await aesGcmDecrypt(
    dataKey,
    base64ToBytes(blob.secrets.nonce),
    base64ToBytes(blob.secrets.ciphertext),
  );
  if (!secretsPlain) return { ok: false };

  let secrets: SyncSecrets;
  try {
    secrets = JSON.parse(new TextDecoder().decode(secretsPlain)) as SyncSecrets;
  } catch {
    return { ok: false };
  }
  if (typeof secrets.pat !== "string" || typeof secrets.gist_id !== "string") {
    return { ok: false };
  }

  const pierre = await tryUnwrap(password, blob.pierre_marker);
  const role: "pierre" | "common" = pierre ? "pierre" : "common";
  return { ok: true, role, secrets };
}
