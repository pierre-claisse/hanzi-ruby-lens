import { describe, it, expect } from "vitest";
import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  randomBytes,
  KEY_BYTES,
  NONCE_BYTES,
  deriveKey,
  SALT_BYTES,
  bytesToBase64,
  base64ToBytes,
  buildSyncBlobs,
  tryUnlock,
} from "../../../src/crypto";

describe("AES-GCM round trip", () => {
  it("encrypts and decrypts a string", async () => {
    const key = randomBytes(KEY_BYTES);
    const nonce = randomBytes(NONCE_BYTES);
    const plain = new TextEncoder().encode("hello, world");
    const ct = await aesGcmEncrypt(key, nonce, plain);
    const dec = await aesGcmDecrypt(key, nonce, ct);
    expect(dec).not.toBeNull();
    expect(new TextDecoder().decode(dec!)).toBe("hello, world");
  });

  it("returns null when the key is wrong (auth tag fail)", async () => {
    const key = randomBytes(KEY_BYTES);
    const nonce = randomBytes(NONCE_BYTES);
    const ct = await aesGcmEncrypt(key, nonce, new TextEncoder().encode("hi"));
    const wrong = randomBytes(KEY_BYTES);
    const dec = await aesGcmDecrypt(wrong, nonce, ct);
    expect(dec).toBeNull();
  });

  it("rejects an invalid key length", async () => {
    await expect(
      aesGcmEncrypt(new Uint8Array(16), randomBytes(NONCE_BYTES), new Uint8Array(0)),
    ).rejects.toThrow(/32 bytes/);
  });

  it("rejects an invalid nonce length", async () => {
    await expect(
      aesGcmEncrypt(randomBytes(KEY_BYTES), new Uint8Array(8), new Uint8Array(0)),
    ).rejects.toThrow(/12 bytes/);
  });
});

describe("base64 round trip", () => {
  it("encodes and decodes arbitrary bytes", () => {
    const bytes = randomBytes(64);
    const b64 = bytesToBase64(bytes);
    const back = base64ToBytes(b64);
    expect(back).toEqual(bytes);
  });
});

describe("Argon2 KDF", () => {
  it("is deterministic for the same password and salt", async () => {
    const salt = randomBytes(SALT_BYTES);
    const k1 = await deriveKey("hello", salt);
    const k2 = await deriveKey("hello", salt);
    expect(k1).toEqual(k2);
    expect(k1.length).toBe(KEY_BYTES);
  });

  it("rejects an invalid salt length", async () => {
    await expect(deriveKey("hello", new Uint8Array(8))).rejects.toThrow(/16 bytes/);
  });
});

describe("envelope: buildSyncBlobs + tryUnlock", () => {
  // Argon2id is slow (~200 ms per call) — these tests do multiple derivations.
  // Allow plenty of time.
  const TIMEOUT = 30_000;

  it(
    "unlocks with the common password (role: common)",
    async () => {
      const blob = await buildSyncBlobs({
        pat: "ghp_xxx",
        gistId: "abc123",
        commonPassword: "common-pw",
        pierrePassword: "pierre-pw",
      });
      const r = await tryUnlock("common-pw", blob);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.role).toBe("common");
        expect(r.secrets.pat).toBe("ghp_xxx");
        expect(r.secrets.gist_id).toBe("abc123");
      }
    },
    TIMEOUT,
  );

  it(
    "unlocks with Pierre's password (role: pierre)",
    async () => {
      const blob = await buildSyncBlobs({
        pat: "ghp_xxx",
        gistId: "abc123",
        commonPassword: "common-pw",
        pierrePassword: "pierre-pw",
      });
      const r = await tryUnlock("pierre-pw", blob);
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.role).toBe("pierre");
        expect(r.secrets.gist_id).toBe("abc123");
      }
    },
    TIMEOUT,
  );

  it(
    "rejects an unknown password",
    async () => {
      const blob = await buildSyncBlobs({
        pat: "ghp_xxx",
        gistId: "abc123",
        commonPassword: "common-pw",
        pierrePassword: "pierre-pw",
      });
      const r = await tryUnlock("wrong-password", blob);
      expect(r.ok).toBe(false);
    },
    TIMEOUT,
  );
});
