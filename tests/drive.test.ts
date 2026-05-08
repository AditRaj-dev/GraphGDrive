import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDriveClient } from "../src/lib/drive";

describe("DriveClient.listChildren", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("calls files.list with the right query and bearer header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ files: [{ id: "x", name: "x", mimeType: "image/png" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createDriveClient(() => "TOKEN");
    const res = await client.listChildren("root");
    const url = fetchMock.mock.calls[0][0] as string;
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(url).toContain("files");
    expect(url).toContain("q=%27root%27+in+parents+and+trashed%3Dfalse");
    expect(url).toContain("fields=");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer TOKEN");
    expect(res.files[0].id).toBe("x");
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 401, text: async () => "unauthorized",
    }));
    const client = createDriveClient(() => "TOKEN");
    await expect(client.listChildren("root")).rejects.toThrow(/401/);
  });
});

describe("DriveClient.embedUrl", () => {
  it("builds google docs preview url", () => {
    const client = createDriveClient(() => "");
    expect(client.embedUrl({
      id: "abc", name: "doc", mimeType: "application/vnd.google-apps.document",
    })).toBe("https://docs.google.com/document/d/abc/preview");
  });
  it("returns null for non-google types", () => {
    const client = createDriveClient(() => "");
    expect(client.embedUrl({
      id: "abc", name: "img", mimeType: "image/png",
    })).toBeNull();
  });
});
