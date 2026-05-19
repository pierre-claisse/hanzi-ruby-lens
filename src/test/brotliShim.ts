// Vitest shim for `brotli-wasm`. The real package ships a WASM blob that is
// awkward to initialise under happy-dom; here we just delegate to Node's
// built-in zlib brotli, which produces a bit-compatible output (Brotli is a
// public format). Aliased in vitest.config.ts via `resolve.alias`.
import {
  brotliCompressSync,
  brotliDecompressSync,
  constants,
} from "node:zlib";

export function compress(
  input: Uint8Array,
  options?: { quality?: number },
): Uint8Array {
  const out = brotliCompressSync(input, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]:
        options?.quality ?? constants.BROTLI_DEFAULT_QUALITY,
    },
  });
  return new Uint8Array(out);
}

export function decompress(input: Uint8Array): Uint8Array {
  const out = brotliDecompressSync(input);
  return new Uint8Array(out);
}

const ready: Promise<{
  compress: typeof compress;
  decompress: typeof decompress;
}> = Promise.resolve({ compress, decompress });

export default ready;
