// Thin async wrapper around brotli-wasm so the WASM blob is loaded lazily on
// first sync (rather than at boot) and works the same way under Node (tests)
// and in the browser.
//
// Web entry (`brotli-wasm/index.web.js`) exposes `default` as a Promise that
// resolves to the module exports after WASM init.
// Node entry (`brotli-wasm/index.node.js`) exposes `compress`/`decompress`
// directly (auto-initialised at require time) and a resolved-Promise default.
//
// The loader detects both shapes.

type BrotliApi = {
  compress: (input: Uint8Array, options?: { quality?: number }) => Uint8Array;
  decompress: (input: Uint8Array) => Uint8Array;
};

let cached: BrotliApi | null = null;
let inFlight: Promise<BrotliApi> | null = null;

function isApi(obj: unknown): obj is BrotliApi {
  return (
    !!obj &&
    typeof obj === "object" &&
    typeof (obj as BrotliApi).compress === "function" &&
    typeof (obj as BrotliApi).decompress === "function"
  );
}

export async function loadBrotli(): Promise<BrotliApi> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const mod = (await import("brotli-wasm")) as unknown as {
      default?: unknown;
      compress?: BrotliApi["compress"];
      decompress?: BrotliApi["decompress"];
    };
    // Web entry: `default` is a thenable that resolves to the API.
    if (mod.default && typeof (mod.default as PromiseLike<unknown>).then === "function") {
      const api = (await (mod.default as PromiseLike<unknown>)) as unknown;
      if (isApi(api)) {
        cached = api;
        return cached;
      }
    }
    // Node entry: compress/decompress are direct exports.
    if (isApi(mod)) {
      cached = { compress: mod.compress, decompress: mod.decompress };
      return cached;
    }
    throw new Error("brotli-wasm: could not resolve API surface");
  })();
  return inFlight;
}

/** Test helper: clear the memoised handle so subsequent calls re-run init. */
export function __resetBrotliForTests(): void {
  cached = null;
  inFlight = null;
}
