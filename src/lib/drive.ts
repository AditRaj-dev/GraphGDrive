import type { DriveFile } from "../types/drive";

const FIELDS = "nextPageToken,files(id,name,mimeType,parents,iconLink,thumbnailLink,modifiedTime,size)";
const BASE = "https://www.googleapis.com/drive/v3";

export type ListResult = { files: DriveFile[]; nextPageToken?: string };

export type DriveClient = {
  listChildren(parentId: string, pageToken?: string): Promise<ListResult>;
  fetchBytes(fileId: string): Promise<Blob>;
  embedUrl(file: DriveFile): string | null;
};

export function createDriveClient(getToken: () => string): DriveClient {
  const authHeaders = (): HeadersInit => ({ Authorization: `Bearer ${getToken()}` });

  return {
    async listChildren(parentId, pageToken) {
      const params = new URLSearchParams({
        q: `'${parentId}' in parents and trashed=false`,
        pageSize: "200",
        fields: FIELDS,
        orderBy: "folder,name",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const url = `${BASE}/files?${params}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
      return res.json();
    },

    async fetchBytes(fileId) {
      const url = `${BASE}/files/${fileId}?alt=media`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
      return res.blob();
    },

    embedUrl(file) {
      const map: Record<string, string> = {
        "application/vnd.google-apps.document": "document",
        "application/vnd.google-apps.spreadsheet": "spreadsheets",
        "application/vnd.google-apps.presentation": "presentation",
      };
      const segment = map[file.mimeType];
      return segment ? `https://docs.google.com/${segment}/d/${file.id}/preview` : null;
    },
  };
}
