import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pullGist,
  saveGist,
  extractSyncTimestamp,
  SyncError,
} from "../../../src/sync";

const PAT = "ghp_x";
const GIST = "abc123";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

describe("extractSyncTimestamp", () => {
  it("returns the field when present", () => {
    const json = JSON.stringify({ sync_timestamp: "2026-05-18T10:00:00Z" });
    expect(extractSyncTimestamp(json)).toBe("2026-05-18T10:00:00Z");
  });

  it("returns null when absent", () => {
    expect(extractSyncTimestamp(JSON.stringify({}))).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    expect(extractSyncTimestamp("not json")).toBeNull();
  });
});

describe("pullGist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the file content for a normal response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        files: {
          "hanzi-ruby-lens.json": { content: `{"texts":[],"sync_timestamp":"x"}` },
        },
      }),
    );
    const out = await pullGist(PAT, GIST);
    expect(out).toContain("sync_timestamp");
  });

  it("follows raw_url on truncated content", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          files: {
            "hanzi-ruby-lens.json": {
              content: "truncated…",
              truncated: true,
              raw_url: "https://gist.example/raw",
            },
          },
        }),
      )
      .mockResolvedValueOnce(textResponse(`{"texts":[],"full":true}`));
    const out = await pullGist(PAT, GIST);
    expect(out).toContain("full");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws SyncError(auth) on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 401 }),
    );
    await expect(pullGist(PAT, GIST)).rejects.toBeInstanceOf(SyncError);
    await expect(pullGist(PAT, GIST)).rejects.toMatchObject({ kind: "auth" });
  });

  it("throws SyncError(not_found) on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 404 }),
    );
    await expect(pullGist(PAT, GIST)).rejects.toMatchObject({
      kind: "not_found",
    });
  });

  it("throws SyncError(network) when fetch itself rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(pullGist(PAT, GIST)).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("throws when the gist has no hanzi-ruby-lens.json", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ files: { "other.json": { content: "x" } } }),
    );
    await expect(pullGist(PAT, GIST)).rejects.toMatchObject({ kind: "other" });
  });
});

describe("saveGist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("issues GET then PATCH when remote sync_timestamp matches", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      // GET
      .mockResolvedValueOnce(
        jsonResponse({
          files: {
            "hanzi-ruby-lens.json": {
              content: `{"sync_timestamp":"2026-05-18T10:00:00Z"}`,
            },
          },
        }),
      )
      // PATCH
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    await saveGist(PAT, GIST, `{"foo":1}`, "2026-05-18T10:00:00Z");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, patchCall] = fetchMock.mock.calls;
    expect(patchCall[1]?.method).toBe("PATCH");
  });

  it("skips PATCH and throws conflict when remote sync_timestamp differs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        files: {
          "hanzi-ruby-lens.json": {
            content: `{"sync_timestamp":"2026-05-18T11:00:00Z"}`,
          },
        },
      }),
    );
    await expect(
      saveGist(PAT, GIST, `{"foo":1}`, "2026-05-18T10:00:00Z"),
    ).rejects.toMatchObject({ kind: "conflict" });
  });

  it("allows the first-ever save when remote has no sync_timestamp", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          files: {
            "hanzi-ruby-lens.json": { content: `{}` }, // no sync_timestamp
          },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    await saveGist(PAT, GIST, `{"foo":1}`, null);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("propagates auth errors from the PATCH", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          files: { "hanzi-ruby-lens.json": { content: `{}` } },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 401 }));
    await expect(saveGist(PAT, GIST, "{}", null)).rejects.toMatchObject({
      kind: "auth",
    });
  });
});
