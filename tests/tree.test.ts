import { describe, it, expect } from "vitest";
import { mergeChildren, ROOT_ID } from "../src/lib/tree";
import type { DriveFile } from "../src/types/drive";

const f = (id: string, parent: string, mime = "image/png"): DriveFile => ({
  id, name: id, mimeType: mime, parents: [parent],
});

describe("mergeChildren", () => {
  it("inserts children of root and marks root loaded", () => {
    const out = mergeChildren({}, ROOT_ID, [f("a", ROOT_ID), f("b", ROOT_ID)]);
    expect(out[ROOT_ID].childIds).toEqual(["a", "b"]);
    expect(out[ROOT_ID].loaded).toBe(true);
    expect(out["a"].file.name).toBe("a");
  });

  it("preserves siblings when merging a new folder", () => {
    let map = mergeChildren({}, ROOT_ID, [
      f("folderA", ROOT_ID, "application/vnd.google-apps.folder"),
      f("folderB", ROOT_ID, "application/vnd.google-apps.folder"),
    ]);
    map = mergeChildren(map, "folderA", [f("a1", "folderA")]);
    expect(map[ROOT_ID].childIds).toEqual(["folderA", "folderB"]);
    expect(map["folderA"].childIds).toEqual(["a1"]);
    expect(map["folderA"].loaded).toBe(true);
    expect(map["folderB"].loaded).toBe(false);
  });

  it("is idempotent: merging the same children twice does not duplicate", () => {
    let map = mergeChildren({}, ROOT_ID, [f("a", ROOT_ID)]);
    map = mergeChildren(map, ROOT_ID, [f("a", ROOT_ID)]);
    expect(map[ROOT_ID].childIds).toEqual(["a"]);
  });
});
