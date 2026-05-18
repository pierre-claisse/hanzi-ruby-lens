// Thin wrapper around Web Crypto's AES-256-GCM. Same threat model as the
// previous Rust `aes-gcm` crate: random 12-byte nonce per encryption, 128-bit
// auth tag appended to the ciphertext.

const ALGO = { name: "AES-GCM", length: 256 } as const;
export const NONCE_BYTES = 12;
export const KEY_BYTES = 32;

async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
  if (rawKey.length !== KEY_BYTES) {
    throw new Error(`AES-GCM key must be ${KEY_BYTES} bytes, got ${rawKey.length}`);
  }
  return crypto.subtle.importKey(
    "raw",
    rawKey as unknown as BufferSource,
    ALGO,
    false,
    ["encrypt", "decrypt"],
  );
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

export async function aesGcmEncrypt(
  key: Uint8Array,
  nonce: Uint8Array,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  if (nonce.length !== NONCE_BYTES) {
    throw new Error(`AES-GCM nonce must be ${NONCE_BYTES} bytes`);
  }
  const k = await importKey(key);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce as unknown as BufferSource },
    k,
    plaintext as unknown as BufferSource,
  );
  return new Uint8Array(ct);
}

/**
 * Returns the decrypted plaintext, or `null` if the auth tag check fails (wrong
 * key, tampered ciphertext, etc.). Crypto errors that aren't authentication
 * failures still throw.
 */
export async function aesGcmDecrypt(
  key: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array | null> {
  const k = await importKey(key);
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce as unknown as BufferSource },
      k,
      ciphertext as unknown as BufferSource,
    );
    return new Uint8Array(pt);
  } catch (e) {
    // The spec promises an OperationError on auth-tag mismatch. Anything else
    // is a programmer error and should bubble up.
    if (e instanceof Error && e.name === "OperationError") return null;
    throw e;
  }
}
