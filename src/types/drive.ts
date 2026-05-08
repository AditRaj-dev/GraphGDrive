export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
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
};
