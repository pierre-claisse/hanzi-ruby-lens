import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("Tag assignment commands", () => {
  describe("assign_tag", () => {
    it("calls invoke with text_ids and tag_id", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await invoke("assign_tag", { textIds: [1, 2], tagId: 5 });
      expect(mockInvoke).toHaveBeenCalledWith("assign_tag", { textIds: [1, 2], tagId: 5 });
    });

    it("supports single text assignment", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await invoke("assign_tag", { textIds: [1], tagId: 3 });
      expect(mockInvoke).toHaveBeenCalledWith("assign_tag", { textIds: [1], tagId: 3 });
    });

    it("is idempotent (no error on duplicate)", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await invoke("assign_tag", { textIds: [1], tagId: 3 });
      await invoke("assign_tag", { textIds: [1], tagId: 3 });
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  describe("remove_tag", () => {
    it("calls invoke with text_ids and tag_id", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await invoke("remove_tag", { textIds: [1, 2], tagId: 5 });
      expect(mockInvoke).toHaveBeenCalledWith("remove_tag", { textIds: [1, 2], tagId: 5 });
    });

    it("supports single text removal", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await invoke("remove_tag", { textIds: [1], tagId: 3 });
      expect(mockInvoke).toHaveBeenCalledWith("remove_tag", { textIds: [1], tagId: 3 });
    });
  });
});
