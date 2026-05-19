// Locks in a property Pierre relies on as a last-resort backup escape hatch:
// the manual Export / Import flow (DataManagementDropdown → Tauri shim) must
// always round-trip via plain, human-readable JSON — no compression, no
// encryption. So if the app ever becomes unusable, the latest exported file
// can be opened in a text editor and the Chinese + pinyin data extracted
// directly.
//
// The Gist sync path (SyncDropdown) is a separate concern — that one is
// encrypted+compressed (see payloadCipher.test.ts).
import { describe, it, expect, beforeEach } from "vitest";
import { invoke } from "../../../src/tauriShim/core";
import { insertText, listTexts } from "../../../src/db";
import { resetDb } from "../db/helpers";

describe("manual export/import (Tauri shim)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("export_database produces a Blob download whose content is plain readable JSON", async () => {
    await insertText("Test", "你好", [
      { type: "word", word: { characters: "你好", pinyin: "nǐ hǎo" } },
    ]);

    // Capture the click on the <a download> the shim creates so we can read
    // the Blob it would have triggered the browser to save.
    let capturedHref: string | null = null;
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      capturedHref = this.href;
    };
    try {
      await invoke("export_database", { filePath: "out.json" });
    } finally {
      HTMLAnchorElement.prototype.click = origClick;
    }
    expect(capturedHref).toMatch(/^blob:/);

    // Locate the Blob the shim created: re-export and intercept the URL.
    let capturedBlob: Blob | null = null;
    const origCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b: Blob | MediaSource) => {
      capturedBlob = b as Blob;
      return origCreate(b);
    };
    try {
      await invoke("export_database", { filePath: "out.json" });
    } finally {
      URL.createObjectURL = origCreate;
    }
    expect(capturedBlob).not.toBeNull();
    const text = await (capturedBlob as unknown as Blob).text();

    // 1. Parses as plain JSON.
    const parsed = JSON.parse(text) as {
      version: number;
      texts: Array<{ title: string; raw_input: string; segments: string }>;
    };
    expect(parsed.version).toBe(1);
    expect(parsed.texts).toHaveLength(1);

    // 2. Chinese + pinyin are stored in the clear (not base64, not
    //    encrypted, not gzipped). A human opening the file can find them.
    expect(text).toContain("你好");
    expect(text).toContain("nǐ hǎo");

    // 3. NOT the v2 wrapper — make sure nobody accidentally wires the
    //    encrypted format into this path.
    expect(parsed).not.toHaveProperty("format");
    expect(parsed).not.toHaveProperty("data");
    expect(text).not.toContain("brotli+aes-gcm");
  });

  it("import_database accepts the same plain JSON exported above (round-trip)", async () => {
    const payload = {
      version: 1,
      exported_at: "2026-05-19T08:00:00Z",
      texts: [
        {
          id: 42,
          title: "课文一",
          segments: JSON.stringify([
            { type: "word", word: { characters: "学习", pinyin: "xué xí" } },
          ]),
          raw_input: "学习",
          created_at: "2026-05-18T10:00:00Z",
          modified_at: null,
          locked: 0,
        },
      ],
      tags: [],
      text_tags: [],
      sessions: [],
      session_texts: [],
      sync_author: null,
      sync_timestamp: null,
    };
    const fileContent = JSON.stringify(payload);
    await invoke("import_database", { fileContent });
    const after = await listTexts([], false);
    expect(after).toHaveLength(1);
    expect(after[0].title).toBe("课文一");
  });
});
