// Encrypts the gist sync payload at rest on GitHub's servers using the
// `syncPassword` already held in memory by the AuthProvider. Wire shape:
//
//   {
//     "version": 2,
//     "format": "brotli+aes-gcm",
//     "sync_timestamp": "2026-05-19T08:00:00Z" | null,   // clear-text copy
//     "sync_author":    "Pierre Claisse"      | null,   // clear-text copy
//     "salt":  "<base64, 16 B>",
//     "nonce": "<base64, 12 B>",
//     "data":  "<base64 of: AES-GCM(brotli(JSON payload))>"
//   }
//
// The `sync_timestamp`/`sync_author` fields are duplicated in the clear so the
// concurrency check in `saveGist` and the optional display in the size badge
// don't require decrypting (which costs ~200 ms of Argon2). The authoritative
// values still live inside the encrypted JSON (which carries the same fields
// in its ExportPayload); the in-the-clear copies are advisory only and any
// tampering with them would be inconsequential — the AES-GCM tag protects the
// real data.
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  NONCE_BYTES,
  randomBytes,
} from "./aesGcm";
import { base64ToBytes, bytesToBase64 } from "./base64";
import { loadBrotli } from "./brotli";
import { deriveKey, SALT_BYTES } from "./kdf";

export const PAYLOAD_VERSION = 2;
export const PAYLOAD_FORMAT = "brotli+aes-gcm" as const;
const BROTLI_QUALITY = 11;

export interface EncryptedWirePayload {
  version: typeof PAYLOAD_VERSION;
  format: typeof PAYLOAD_FORMAT;
  sync_timestamp: string | null;
  sync_author: string | null;
  salt: string;
  nonce: string;
  data: string;
}

export interface PayloadMeta {
  sync_timestamp: string | null;
  sync_author: string | null;
}

// Caches derived keys per (password, saltBase64) tuple. Without this, every
// pull/save would re-run Argon2id (~200 ms). For a fresh-salt save the cache
// won't hit, but repeated decryptions of the same blob (e.g. successive pulls
// without remote change) do.
const keyCache = new Map<string, Uint8Array>();

async function getKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const saltB64 = bytesToBase64(salt);
  const cacheKey = `${password}|${saltB64}`;
  const hit = keyCache.get(cacheKey);
  if (hit) return hit;
  const key = await deriveKey(password, salt);
  keyCache.set(cacheKey, key);
  return key;
}

export async function encryptPayload(
  jsonPayload: string,
  syncPassword: string,
  meta: PayloadMeta,
): Promise<string> {
  const brotli = await loadBrotli();
  const utf8 = new TextEncoder().encode(jsonPayload);
  const compressed = brotli.compress(utf8, { quality: BROTLI_QUALITY });
  const salt = randomBytes(SALT_BYTES);
  const nonce = randomBytes(NONCE_BYTES);
  const key = await getKey(syncPassword, salt);
  const ciphertext = await aesGcmEncrypt(key, nonce, compressed);
  const wire: EncryptedWirePayload = {
    version: PAYLOAD_VERSION,
    format: PAYLOAD_FORMAT,
    sync_timestamp: meta.sync_timestamp,
    sync_author: meta.sync_author,
    salt: bytesToBase64(salt),
    nonce: bytesToBase64(nonce),
    data: bytesToBase64(ciphertext),
  };
  return JSON.stringify(wire);
}

export interface DecryptResult {
  jsonPayload: string;
  sync_timestamp: string | null;
  sync_author: string | null;
}

export async function decryptPayload(
  blob: string,
  syncPassword: string,
): Promise<DecryptResult | null> {
  const wire = parseWire(blob);
  if (!wire) return null;
  const salt = base64ToBytes(wire.salt);
  const nonce = base64ToBytes(wire.nonce);
  const ct = base64ToBytes(wire.data);
  const key = await getKey(syncPassword, salt);
  const compressed = await aesGcmDecrypt(key, nonce, ct);
  if (!compressed) return null;
  const brotli = await loadBrotli();
  const decompressed = brotli.decompress(compressed);
  return {
    jsonPayload: new TextDecoder().decode(decompressed),
    sync_timestamp: wire.sync_timestamp,
    sync_author: wire.sync_author,
  };
}

export function parseWire(blob: string): EncryptedWirePayload | null {
  try {
    const o = JSON.parse(blob) as Partial<EncryptedWirePayload>;
    if (
      o.version === PAYLOAD_VERSION &&
      o.format === PAYLOAD_FORMAT &&
      typeof o.salt === "string" &&
      typeof o.nonce === "string" &&
      typeof o.data === "string"
    ) {
      return {
        version: PAYLOAD_VERSION,
        format: PAYLOAD_FORMAT,
        sync_timestamp:
          typeof o.sync_timestamp === "string" ? o.sync_timestamp : null,
        sync_author:
          typeof o.sync_author === "string" ? o.sync_author : null,
        salt: o.salt,
        nonce: o.nonce,
        data: o.data,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function isEncryptedPayload(blob: string): boolean {
  return parseWire(blob) !== null;
}

/** Test helper: clear the in-memory key cache so subsequent calls re-derive. */
export function __resetPayloadCipherForTests(): void {
  keyCache.clear();
}
