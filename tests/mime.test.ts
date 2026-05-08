import { describe, it, expect } from "vitest";
import { categorize } from "../src/lib/mime";

describe("categorize", () => {
  it("classifies folders", () => {
    expect(categorize("application/vnd.google-apps.folder")).toBe("folder");
  });
  it("classifies images", () => {
    expect(categorize("image/png")).toBe("image");
    expect(categorize("image/jpeg")).toBe("image");
    expect(categorize("image/webp")).toBe("image");
  });
  it("classifies video", () => {
    expect(categorize("video/mp4")).toBe("video");
    expect(categorize("video/webm")).toBe("video");
  });
  it("classifies pdf", () => {
    expect(categorize("application/pdf")).toBe("pdf");
  });
  it("classifies google docs / sheets / slides", () => {
    expect(categorize("application/vnd.google-apps.document")).toBe("gdoc");
    expect(categorize("application/vnd.google-apps.spreadsheet")).toBe("gsheet");
    expect(categorize("application/vnd.google-apps.presentation")).toBe("gslide");
  });
  it("falls back to other", () => {
    expect(categorize("application/zip")).toBe("other");
  });
});
