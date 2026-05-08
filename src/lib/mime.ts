import type { PreviewKind } from "../types/drive";

export function categorize(mimeType: string): PreviewKind {
  if (mimeType === "application/vnd.google-apps.folder") return "folder";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.google-apps.document") return "gdoc";
  if (mimeType === "application/vnd.google-apps.spreadsheet") return "gsheet";
  if (mimeType === "application/vnd.google-apps.presentation") return "gslide";
  return "other";
}

export function isFolder(mimeType: string): boolean {
  return categorize(mimeType) === "folder";
}
