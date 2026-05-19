import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pullGist,
  saveGist,
  extractSyncTimestamp,
  SyncError,
} from "../../../src/sync";
import {
  encryptPayload,
  __resetPayloadCipherForTests,
} from "../../../src/crypto/payloadCipher";

const PAT = "ghp_x";
const GIST = "abc123";
const SYNC_PW = "test-sync-password";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

beforeEach(() => {
  __resetPayloadCipherForTests();
});

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

  it("returns the legacy (plain JSON) content as-is, marked legacy=true", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        files: {
          "hanzi-ruby-lens.json": {
            content: `{"texts":[],"sync_timestamp":"2026-05-18T10:00:00Z","sync_author":"A"}`,
          },
        },
      }),
    );
    const out = await pullGist(PAT, GIST, SYNC_PW);
    expect(out.legacy).toBe(true);
    expect(out.sync_timestamp).toBe("2026-05-18T10:00:00Z");
    expect(out.sync_author).toBe("A");
    expect(out.jsonPayload).toContain("texts");
    expect(out.wireSize).toBeGreaterThan(0);
  });

  it("decrypts a v2 wire payload and returns the inner JSON", async () => {
    const innerJson = JSON.stringify({
      texts: [{ id: 1 }],
      sync_timestamp: "2026-05-19T10:00:00Z",
      sync_author: "Pierre",
    });
    const wire = await encryptPayload(innerJson, SYNC_PW, {
      sync_timestamp: "2026-05-19T10:00:00Z",
      sync_author: "Pierre",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        files: { "hanzi-ruby-lens.json": { content: wire } },
      }),
    );
    const out = await pullGist(PAT, GIST, SYNC_PW);
    expect(out.legacy).toBe(false);
    expect(out.sync_timestamp).toBe("2026-05-19T10:00:00Z");
    expect(out.sync_author).toBe("Pierre");
    expect(JSON.parse(out.jsonPayload)).toMatchObject({ texts: [{ id: 1 }] });
  });

  it("throws SyncError(auth) when the v2 password is wrong", async () => {
    const innerJson = JSON.stringify({ texts: [] });
    const wire = await encryptPayload(innerJson, "correct-password", {
      sync_timestamp: null,
      sync_author: null,
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        files: { "hanzi-ruby-lens.json": { content: wire } },
      }),
    );
    await expect(pullGist(PAT, GIST, "wrong-password")).rejects.toMatchObject({
      kind: "auth",
    });
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
    const out = await pullGist(PAT, GIST, SYNC_PW);
    expect(out.jsonPayload).toContain("full");
    expect(out.legacy).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws SyncError(auth) on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 401 }),
    );
    await expect(pullGist(PAT, GIST, SYNC_PW)).rejects.toBeInstanceOf(SyncError);
    await expect(pullGist(PAT, GIST, SYNC_PW)).rejects.toMatchObject({
      kind: "auth",
    });
  });

  it("throws SyncError(not_found) on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 404 }),
    );
    await expect(pullGist(PAT, GIST, SYNC_PW)).rejects.toMatchObject({
      kind: "not_found",
    });
  });

  it("throws SyncError(network) when fetch itself rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("offline"));
    await expect(pullGist(PAT, GIST, SYNC_PW)).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("throws when the gist has no hanzi-ruby-lens.json", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ files: { "other.json": { content: "x" } } }),
    );
    await expect(pullGist(PAT, GIST, SYNC_PW)).rejects.toMatchObject({
      kind: "other",
    });
  });
});

describe("saveGist", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const META = {
    sync_timestamp: "2026-05-18T10:00:00Z",
    sync_author: "Pierre",
  };

  it("issues GET then PATCH when remote sync_timestamp matches (encrypted body)", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          files: {
            "hanzi-ruby-lens.json": {
              content: `{"sync_timestamp":"2026-05-18T10:00:00Z"}`,
            },
          },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    const result = await saveGist(
      PAT,
      GIST,
      `{"foo":1,"sync_timestamp":"2026-05-18T10:00:00Z","sync_author":"Pierre"}`,
      SYNC_PW,
      "2026-05-18T10:00:00Z",
      META,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, patchCall] = fetchMock.mock.calls;
    expect(patchCall[1]?.method).toBe("PATCH");
    expect(result.wireSize).toBeGreaterThan(0);
    // The PATCH body must contain an encrypted wrapper, not the plain JSON.
    const patchBody = JSON.parse(patchCall[1]?.body as string) as {
      files: { "hanzi-ruby-lens.json": { content: string } };
    };
    const content = patchBody.files["hanzi-ruby-lens.json"].content;
    const parsed = JSON.parse(content) as { version?: number; format?: string };
    expect(parsed.version).toBe(2);
    expect(parsed.format).toBe("brotli+aes-gcm");
    expect(content).not.toContain('"foo":1');
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
      saveGist(PAT, GIST, `{"foo":1}`, SYNC_PW, "2026-05-18T10:00:00Z", META),
    ).rejects.toMatchObject({ kind: "conflict" });
  });

  it("allows the first-ever save when remote has no sync_timestamp", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          files: {
            "hanzi-ruby-lens.json": { content: `{}` },
          },
        }),
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }));
    await saveGist(PAT, GIST, `{"foo":1}`, SYNC_PW, null, META);
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
    await expect(
      saveGist(PAT, GIST, "{}", SYNC_PW, null, META),
    ).rejects.toMatchObject({
      kind: "auth",
    });
  });
});
