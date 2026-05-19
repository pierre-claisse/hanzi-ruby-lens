import { describe, it, expect, beforeEach } from "vitest";
import {
  encryptPayload,
  decryptPayload,
  isEncryptedPayload,
  parseWire,
  __resetPayloadCipherForTests,
} from "../../../src/crypto/payloadCipher";

const PW = "test-sync-password";
const META = {
  sync_timestamp: "2026-05-19T08:00:00Z",
  sync_author: "Pierre Claisse",
};

beforeEach(() => {
  __resetPayloadCipherForTests();
});

describe("payloadCipher", () => {
  it("round-trips a small JSON payload", async () => {
    const json = JSON.stringify({ texts: [], tags: [], sessions: [] });
    const wire = await encryptPayload(json, PW, META);
    const decoded = await decryptPayload(wire, PW);
    expect(decoded).not.toBeNull();
    expect(decoded!.jsonPayload).toBe(json);
    expect(decoded!.sync_timestamp).toBe(META.sync_timestamp);
    expect(decoded!.sync_author).toBe(META.sync_author);
  });

  it("round-trips a payload with Chinese characters", async () => {
    const json = JSON.stringify({
      texts: [
        { id: 1, title: "第一課", segments: "[]", raw_input: "我喜欢学中文" },
      ],
    });
    const wire = await encryptPayload(json, PW, META);
    const decoded = await decryptPayload(wire, PW);
    expect(decoded!.jsonPayload).toBe(json);
  });

  it("returns null when decrypting with the wrong password", async () => {
    const json = JSON.stringify({ texts: [] });
    const wire = await encryptPayload(json, "correct", META);
    const decoded = await decryptPayload(wire, "wrong");
    expect(decoded).toBeNull();
  });

  it("returns null when given malformed JSON", async () => {
    const decoded = await decryptPayload("not-json", PW);
    expect(decoded).toBeNull();
  });

  it("returns null when given a non-v2 envelope", async () => {
    const decoded = await decryptPayload(JSON.stringify({ texts: [] }), PW);
    expect(decoded).toBeNull();
  });

  it("returns null when the ciphertext has been tampered with", async () => {
    const json = JSON.stringify({ texts: [] });
    const wire = await encryptPayload(json, PW, META);
    const obj = JSON.parse(wire) as { data: string };
    // Flip one base64 character.
    const ch = obj.data[0];
    obj.data = (ch === "A" ? "B" : "A") + obj.data.slice(1);
    const tampered = JSON.stringify(obj);
    const decoded = await decryptPayload(tampered, PW);
    expect(decoded).toBeNull();
  });

  it("produces a wire payload markedly smaller than the raw JSON", async () => {
    // Pad with a repetitive but realistic-shaped JSON to exercise compression.
    const segments = Array.from({ length: 500 }, (_, i) => ({
      type: "word",
      word: { characters: "我", pinyin: "wǒ", _i: i },
    }));
    const json = JSON.stringify({ texts: [{ id: 1, segments }] });
    const wire = await encryptPayload(json, PW, META);
    expect(wire.length).toBeLessThan(json.length / 4);
  });

  it("isEncryptedPayload detects v2 envelopes and rejects everything else", async () => {
    const json = JSON.stringify({ texts: [] });
    const wire = await encryptPayload(json, PW, META);
    expect(isEncryptedPayload(wire)).toBe(true);
    expect(isEncryptedPayload(json)).toBe(false);
    expect(isEncryptedPayload("not-json")).toBe(false);
    expect(isEncryptedPayload(JSON.stringify({ version: 99 }))).toBe(false);
  });

  it("parseWire returns null for malformed input", () => {
    expect(parseWire("not-json")).toBeNull();
    expect(parseWire(JSON.stringify({ version: 2 }))).toBeNull();
    expect(
      parseWire(
        JSON.stringify({
          version: 2,
          format: "brotli+aes-gcm",
          salt: "x",
        }),
      ),
    ).toBeNull();
  });
});
