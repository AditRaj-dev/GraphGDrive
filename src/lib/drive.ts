import type { DriveFile, SharedDrive } from "../types/drive";

const FIELDS = "nextPageToken,files(id,name,mimeType,parents,iconLink,thumbnailLink,modifiedTime,size,driveId)";
const DRIVE_FIELDS = "nextPageToken,drives(id,name)";
const BASE = "https://www.googleapis.com/drive/v3";

export type ListResult = { files: DriveFile[]; nextPageToken?: string };
export type SharedDriveResult = { drives: SharedDrive[]; nextPageToken?: string };
export type ListOptions = { driveId?: string };

export type DriveClient = {
  listChildren(parentId: string, pageToken?: string, options?: ListOptions): Promise<ListResult>;
  listSharedDrives(pageToken?: string): Promise<SharedDriveResult>;
  listSharedFolders(pageToken?: string): Promise<ListResult>;
  fetchBytes(fileId: string): Promise<Blob>;
  embedUrl(file: DriveFile): string | null;
};

export function createDriveClient(getToken: () => string): DriveClient {
  const authHeaders = (): HeadersInit => ({ Authorization: `Bearer ${getToken()}` });

  return {
    async listChildren(parentId, pageToken, options) {
      const params = new URLSearchParams({
        q: `'${parentId}' in parents and trashed=false`,
        pageSize: "200",
        fields: FIELDS,
        orderBy: "folder,name",
        includeItemsFromAllDrives: "true",
        supportsAllDrives: "true",
      });
      if (options?.driveId) {
        params.set("corpora", "drive");
        params.set("driveId", options.driveId);
      }
      if (pageToken) params.set("pageToken", pageToken);
      const url = `${BASE}/files?${params}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
      return res.json();
    },

    async listSharedFolders(pageToken) {
      const params = new URLSearchParams({
        q: "sharedWithMe=true and mimeType='application/vnd.google-apps.folder' and trashed=false",
        pageSize: "200",
        fields: FIELDS,
        orderBy: "name",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`${BASE}/files?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Shared folders list failed: ${res.status} ${await res.text()}`);
      return res.json();
    },

    async listSharedDrives(pageToken) {
      const params = new URLSearchParams({
        pageSize: "100",
        fields: DRIVE_FIELDS,
      });
      if (pageToken) params.set("pageToken", pageToken);
      const url = `${BASE}/drives?${params}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Shared drives list failed: ${res.status} ${await res.text()}`);
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
