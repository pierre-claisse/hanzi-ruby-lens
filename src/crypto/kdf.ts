// Argon2id key derivation, matching the parameters of the (now-retired)
// Rust `argon2 = "0.5"` default profile:
//   - algorithm: Argon2id, version 0x13
//   - m_cost   : 19_456 KiB
//   - t_cost   : 2
//   - parallel : 1
//   - dkLen    : 32 (output key for AES-256-GCM)
//
// `@noble/hashes/argon2` is a pure-JS implementation. Slower than a WASM
// build (~200ms vs ~50ms on modern hardware) but happens once per login,
// requires no WASM init, and works the same way under Node and the browser.
import { argon2idAsync } from "@noble/hashes/argon2.js";
import { KEY_BYTES } from "./aesGcm";

export const ARGON2_M_KIB = 19_456;
export const ARGON2_T_COST = 2;
export const ARGON2_P_COST = 1;
export const SALT_BYTES = 16;

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  if (salt.length !== SALT_BYTES) {
    throw new Error(`Argon2 salt must be ${SALT_BYTES} bytes, got ${salt.length}`);
  }
  const out = await argon2idAsync(password, salt, {
    t: ARGON2_T_COST,
    m: ARGON2_M_KIB,
    p: ARGON2_P_COST,
    dkLen: KEY_BYTES,
  });
  return new Uint8Array(out);
}
