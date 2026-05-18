// Thin async wrapper around jieba-wasm so the segmenter is loaded lazily
// (the WASM blob is ~3 MB) and works the same way under Node (tests) and
// in the browser.
//
// Node entry: CJS, auto-loads the WASM at import time → `cut` is immediately
// callable.
// Browser entry: ESM with a `default` init function we must await before
// any other export will work.

type CutFn = (text: string, hmm?: boolean | null) => string[];

let cached: CutFn | null = null;
let inFlight: Promise<CutFn> | null = null;

export async function loadJieba(): Promise<CutFn> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    // Dynamic import so the WASM isn't part of the initial bundle.
    const mod = (await import("jieba-wasm")) as unknown as {
      cut?: CutFn;
      default?: unknown;
    };
    // Detect web entry: `default` is the init function. Node entry has
    // `default` as the whole module object (or undefined) — either way it's
    // not a function.
    if (typeof mod.default === "function") {
      await (mod.default as () => Promise<unknown>)();
    }
    if (typeof mod.cut !== "function") {
      throw new Error("jieba-wasm: cut() not exported after init");
    }
    cached = mod.cut;
    return cached;
  })();
  return inFlight;
}

export async function segmentChinese(
  text: string,
  hmm = true,
): Promise<string[]> {
  const cut = await loadJieba();
  return cut(text, hmm);
}
