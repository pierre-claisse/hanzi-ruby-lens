// GitHub Gist REST client.
//
// Wire format on the gist file is one of two shapes:
//
//   - v2 (Brotli-compressed, AES-GCM-encrypted JSON wrapped in a thin clear
//     envelope — see src/crypto/payloadCipher.ts). All saves write this.
//   - legacy v1: plain JSON serialisation of `ExportPayload`. Read-only path
//     for migrating the existing gist on first pull after this upgrade. Never
//     written by the PWA.
//
// `pullGist` auto-detects the format, decrypts/decompresses if needed, and
// returns the resulting JSON-encoded `ExportPayload` plus the wire size
// (bytes that actually live in the gist — relevant for the 1 MB ceiling).
//
// `saveGist` always writes v2. The optimistic-concurrency check still reads
// `sync_timestamp` from the wrapper, which is the same in both formats.
import {
  encryptPayload,
  decryptPayload,
  isEncryptedPayload,
} from "../crypto/payloadCipher";

const GITHUB_API = "https://api.github.com";
const FILE_NAME = "hanzi-ruby-lens.json";
const USER_AGENT = "hanzi-ruby-lens-pwa/0.1";

export type SyncErrorKind =
  | "auth"
  | "not_found"
  | "conflict"
  | "network"
  | "server"
  | "other";

export class SyncError extends Error {
  constructor(
    public readonly kind: SyncErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SyncError";
  }
}

function authHeaders(pat: string): HeadersInit {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };
}

interface GistFile {
  content: string;
  truncated?: boolean;
  raw_url?: string;
}

interface GistResp {
  files: Record<string, GistFile>;
}

async function getJson(resp: Response, label: string): Promise<unknown> {
  try {
    return await resp.json();
  } catch (e) {
    throw new SyncError(
      "other",
      `Failed to parse ${label} JSON: ${(e as Error).message}`,
    );
  }
}

/** Fetches the raw `hanzi-ruby-lens.json` file content from the gist, whatever
 *  the wire format. */
async function fetchGist(pat: string, gistId: string): Promise<string> {
  let resp: Response;
  try {
    resp = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      method: "GET",
      headers: authHeaders(pat),
    });
  } catch (e) {
    throw new SyncError("network", (e as Error).message);
  }

  if (resp.status === 401)
    throw new SyncError("auth", "GitHub rejected the embedded PAT (401)", 401);
  if (resp.status === 403)
    throw new SyncError("auth", "GitHub forbids access with this PAT (403)", 403);
  if (resp.status === 404)
    throw new SyncError("not_found", `Gist ${gistId} not found`, 404);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new SyncError("server", text || resp.statusText, resp.status);
  }

  const body = (await getJson(resp, "gist")) as GistResp;
  const file = body.files?.[FILE_NAME];
  if (!file) {
    throw new SyncError(
      "other",
      `Gist does not contain file '${FILE_NAME}'`,
    );
  }
  if (file.truncated && file.raw_url) {
    // GitHub truncates content > 1 MB in the gist JSON; the raw URL serves
    // the full file. For v2 this should never happen (ceiling is the same
    // 1 MB but compression buys ~25x headroom), kept for legacy safety.
    let rawResp: Response;
    try {
      rawResp = await fetch(file.raw_url, {
        headers: { "User-Agent": USER_AGENT },
      });
    } catch (e) {
      throw new SyncError("network", (e as Error).message);
    }
    if (!rawResp.ok) {
      throw new SyncError(
        "server",
        `raw_url fetch failed: ${rawResp.status} ${rawResp.statusText}`,
        rawResp.status,
      );
    }
    return rawResp.text();
  }
  return file.content;
}

export interface PullResult {
  /** JSON-encoded `ExportPayload` (after any decryption/decompression). */
  jsonPayload: string;
  /** Wrapper-level metadata, also embedded inside `jsonPayload`. */
  sync_timestamp: string | null;
  sync_author: string | null;
  /** Size in bytes of the wire content (what actually counts towards the
   *  1 MB gist ceiling). For v2: compressed+encrypted+wrapped. */
  wireSize: number;
  /** True when the gist still holds the legacy plain-JSON format. Used to
   *  prompt the user (or the next save) to migrate. */
  legacy: boolean;
}

export async function pullGist(
  pat: string,
  gistId: string,
  syncPassword: string,
): Promise<PullResult> {
  const wire = await fetchGist(pat, gistId);
  const wireSize = new Blob([wire]).size;

  if (isEncryptedPayload(wire)) {
    const result = await decryptPayload(wire, syncPassword);
    if (!result) {
      throw new SyncError(
        "auth",
        "Could not decrypt remote gist content (wrong sync password?)",
      );
    }
    return {
      jsonPayload: result.jsonPayload,
      sync_timestamp: result.sync_timestamp,
      sync_author: result.sync_author,
      wireSize,
      legacy: false,
    };
  }

  // Legacy v1: plain ExportPayload JSON. Read the meta from the top level.
  let parsed: { sync_timestamp?: unknown; sync_author?: unknown };
  try {
    parsed = JSON.parse(wire) as typeof parsed;
  } catch (e) {
    throw new SyncError(
      "other",
      `Invalid remote payload: ${(e as Error).message}`,
    );
  }
  return {
    jsonPayload: wire,
    sync_timestamp:
      typeof parsed.sync_timestamp === "string" ? parsed.sync_timestamp : null,
    sync_author:
      typeof parsed.sync_author === "string" ? parsed.sync_author : null,
    wireSize,
    legacy: true,
  };
}

/**
 * Extract the `sync_timestamp` field from the wire blob (either format —
 * both expose it at the top level). Used by the conflict check below and
 * exposed for tests.
 */
export function extractSyncTimestamp(json: string): string | null {
  try {
    const obj = JSON.parse(json) as { sync_timestamp?: unknown };
    if (typeof obj.sync_timestamp === "string") return obj.sync_timestamp;
    return null;
  } catch {
    return null;
  }
}

export interface SaveResult {
  /** Size in bytes of the wire content after this save. */
  wireSize: number;
}

/**
 * Save `jsonPayload` to the configured gist as v2 (compressed+encrypted),
 * with optimistic concurrency on `sync_timestamp`.
 *
 *  - GET the current remote, read its `sync_timestamp` (works for v1 and v2).
 *  - If it differs from `lastSyncTimestamp`, throw SyncError("conflict").
 *  - Otherwise encrypt the payload and PATCH the gist.
 */
export async function saveGist(
  pat: string,
  gistId: string,
  jsonPayload: string,
  syncPassword: string,
  lastSyncTimestamp: string | null,
  meta: { sync_timestamp: string | null; sync_author: string | null },
): Promise<SaveResult> {
  const remoteJson = await fetchGist(pat, gistId);
  const remoteTs = extractSyncTimestamp(remoteJson);
  if (remoteTs !== null && remoteTs !== lastSyncTimestamp) {
    throw new SyncError(
      "conflict",
      "The remote data has been updated since your last pull",
    );
  }

  const wireContent = await encryptPayload(jsonPayload, syncPassword, meta);
  const wireSize = new Blob([wireContent]).size;

  let resp: Response;
  try {
    resp = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders(pat),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: { [FILE_NAME]: { content: wireContent } },
      }),
    });
  } catch (e) {
    throw new SyncError("network", (e as Error).message);
  }

  if (resp.status === 401)
    throw new SyncError("auth", "GitHub rejected the embedded PAT (401)", 401);
  if (resp.status === 403)
    throw new SyncError("auth", "GitHub forbids write with this PAT (403)", 403);
  if (resp.status === 404)
    throw new SyncError("not_found", `Gist ${gistId} not found`, 404);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new SyncError("server", text || resp.statusText, resp.status);
  }

  return { wireSize };
}
