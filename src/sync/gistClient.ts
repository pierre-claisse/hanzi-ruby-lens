// GitHub Gist REST client. Replaces the Rust `sync::http_get_gist` /
// `http_patch_gist` pair, with the same shape:
//
//   - `pullGist` → GET, returns the JSON-encoded ExportPayload string.
//     Handles the API's 1 MB truncation by falling back to `raw_url`.
//   - `saveGist` → GET-then-PATCH with application-side `sync_timestamp`
//     comparison for optimistic concurrency. GitHub Gists do NOT support
//     `If-Match`, so we re-fetch and check before PATCH.
//
// All error cases are normalised into a typed union the UI can switch on.
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
    // API truncates content > 1 MB; the raw URL has the full payload.
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

export async function pullGist(pat: string, gistId: string): Promise<string> {
  return fetchGist(pat, gistId);
}

/**
 * Extract the `sync_timestamp` field from an ExportPayload JSON string. Used
 * for application-side optimistic concurrency. Returns null when the field is
 * missing or the JSON is malformed.
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

/**
 * Save the given JSON payload to the configured Gist with optimistic
 * concurrency on `sync_timestamp`.
 *
 *  - GET the current remote content; read its `sync_timestamp`.
 *  - If that field exists and differs from `lastSyncTimestamp`, throw
 *    `SyncError("conflict")` — the remote has been touched since our last
 *    sync.
 *  - Otherwise PATCH the gist.
 *
 * Race window between the GET and the PATCH is intentional; with two users
 * it's acceptable. A "real" backend would use a strong CAS.
 */
export async function saveGist(
  pat: string,
  gistId: string,
  jsonPayload: string,
  lastSyncTimestamp: string | null,
): Promise<void> {
  const remoteJson = await fetchGist(pat, gistId);
  const remoteTs = extractSyncTimestamp(remoteJson);
  if (remoteTs !== null && remoteTs !== lastSyncTimestamp) {
    throw new SyncError(
      "conflict",
      "The remote data has been updated since your last pull",
    );
  }

  let resp: Response;
  try {
    resp = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        ...authHeaders(pat),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: { [FILE_NAME]: { content: jsonPayload } },
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
}
