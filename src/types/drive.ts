export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  iconLink?: string;
  modifiedTime?: string;
  size?: string;
  driveId?: string;
  virtualKind?: "looseFiles" | "sharedDrives" | "sharedDrive";
};

export type SharedDrive = {
  id: string;
  name: string;
};

export type PreviewKind =
  | "folder"
  | "image"
  | "video"
  | "pdf"
  | "gdoc"
  | "gsheet"
  | "gslide"
  | "other";

export type TreeNode = {
  file: DriveFile;
  childIds: string[];
  loaded: boolean;
  parentId?: string | null;
};
