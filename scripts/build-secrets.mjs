// Build-time encryption of the sync secrets. Reads env vars (set as
// GitHub Actions secrets), produces `public/sync_blobs.json`, which
// Vite then copies into the deployed `dist/`. The file is gitignored.
//
//   SYNC_PAT              GitHub PAT with gist scope
//   SYNC_GIST_ID          target gist id
//   SYNC_COMMON_PASSWORD  password shared with 段予婷 (unlocks pull/save)
//   SYNC_PIERRE_PASSWORD  Pierre-only password (also unlocks pull/save AND
//                         the pierre_marker that grants Delete/Reset/etc.)
//
// Run locally for development with all four vars in the environment; CI
// runs this via `.github/workflows/deploy.yml`.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { argon2idAsync } from "@noble/hashes/argon2";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, "..", "public", "sync_blobs.json");

const ARGON2 = { t: 2, m: 19_456, p: 1, dkLen: 32 };
const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const KEY_BYTES = 32;

function envOrFail(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function randomBytes(n) {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function deriveKey(password, salt) {
  const out = await argon2idAsync(password, salt, ARGON2);
  return new Uint8Array(out);
}

async function importAesKey(raw) {
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
}

async function aesGcmEncrypt(rawKey, nonce, plain) {
  const k = await importAesKey(rawKey);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, plain);
  return new Uint8Array(ct);
}

async function wrap(password, payload) {
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

async function main() {
  const pat = envOrFail("SYNC_PAT");
  const gistId = envOrFail("SYNC_GIST_ID");
  const commonPassword = envOrFail("SYNC_COMMON_PASSWORD");
  const pierrePassword = envOrFail("SYNC_PIERRE_PASSWORD");

  const dataKey = randomBytes(KEY_BYTES);

  const secretsNonce = randomBytes(NONCE_BYTES);
  const secretsPlain = new TextEncoder().encode(
    JSON.stringify({ pat, gist_id: gistId }),
  );
  const secretsCt = await aesGcmEncrypt(dataKey, secretsNonce, secretsPlain);

  const wrappedCommon = await wrap(commonPassword, dataKey);
  const wrappedPierre = await wrap(pierrePassword, dataKey);
  const pierreMarker = await wrap(
    pierrePassword,
    new TextEncoder().encode("granted"),
  );

  const blob = {
    version: 1,
    secrets: {
      nonce: bytesToBase64(secretsNonce),
      ciphertext: bytesToBase64(secretsCt),
    },
    key_wraps: [wrappedCommon, wrappedPierre],
    pierre_marker: pierreMarker,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(blob));
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${OUT_PATH} (${(JSON.stringify(blob).length / 1024).toFixed(2)} KB)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
