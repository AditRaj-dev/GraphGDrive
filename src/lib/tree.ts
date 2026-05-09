import type { DriveFile, SharedDrive, TreeNode } from "../types/drive";

export const ROOT_ID = "root";
export const SHARED_DRIVES_ID = "__shared_drives__";
export const looseFilesId = (parentId: string) => `${parentId}::__loose_files__`;

const FOLDER_MIME = "application/vnd.google-apps.folder";

export type TreeMap = Record<string, TreeNode>;

const rootNode = (): TreeNode => ({
  file: { id: ROOT_ID, name: "My Drive", mimeType: FOLDER_MIME },
  childIds: [],
  loaded: false,
  parentId: null,
});

const fallbackFolder = (id: string): TreeNode => ({
  file: { id, name: id, mimeType: FOLDER_MIME },
  childIds: [],
  loaded: false,
  parentId: null,
});

export type MergeChildrenOptions = { groupLooseFiles?: boolean };

export function mergeChildren(
  map: TreeMap,
  parentId: string,
  children: DriveFile[],
  options: MergeChildrenOptions = {}
): TreeMap {
  const next: TreeMap = { ...map };
  if (!next[parentId]) {
    next[parentId] = parentId === ROOT_ID ? rootNode() : fallbackFolder(parentId);
  }
  const looseFiles = options.groupLooseFiles
    ? children.filter((child) => child.mimeType !== FOLDER_MIME)
    : [];
  const visibleChildren = options.groupLooseFiles
    ? children.filter((child) => child.mimeType === FOLDER_MIME)
    : children;
  const existingIds = new Set(next[parentId].childIds);
  const newIds: string[] = [];
  for (const child of visibleChildren) {
    if (!existingIds.has(child.id)) newIds.push(child.id);
    const existing = next[child.id] ?? { file: child, childIds: [] as string[], loaded: false, parentId };
    next[child.id] = { ...existing, file: child, parentId };
  }
  if (looseFiles.length > 0) {
    const looseId = looseFilesId(parentId);
    if (!existingIds.has(looseId)) newIds.push(looseId);
    const existingLoose = next[looseId] ?? {
      file: { id: looseId, name: "Files not in a folder", mimeType: FOLDER_MIME, virtualKind: "looseFiles" },
      childIds: [] as string[],
      loaded: true,
      parentId,
    };
    const existingLooseIds = new Set(existingLoose.childIds);
    const newLooseIds: string[] = [];
    for (const child of looseFiles) {
      if (!existingLooseIds.has(child.id)) newLooseIds.push(child.id);
      const existing = next[child.id] ?? { file: child, childIds: [] as string[], loaded: false, parentId: looseId };
      next[child.id] = { ...existing, file: { ...child, parents: [looseId] }, parentId: looseId };
    }
    next[looseId] = {
      ...existingLoose,
      childIds: [...existingLoose.childIds, ...newLooseIds],
      loaded: true,
      parentId,
    };
  }
  next[parentId] = {
    ...next[parentId],
    childIds: [...next[parentId].childIds, ...newIds],
    loaded: true,
  };
  return next;
}

export function mergeSharedDrives(map: TreeMap, drives: SharedDrive[]): TreeMap {
  const next: TreeMap = { ...map };
  if (!next[ROOT_ID]) next[ROOT_ID] = rootNode();
  if (drives.length === 0) return next;

  if (!next[ROOT_ID].childIds.includes(SHARED_DRIVES_ID)) {
    next[ROOT_ID] = { ...next[ROOT_ID], childIds: [...next[ROOT_ID].childIds, SHARED_DRIVES_ID] };
  }

  const existing = next[SHARED_DRIVES_ID] ?? {
    file: { id: SHARED_DRIVES_ID, name: "Shared drives", mimeType: FOLDER_MIME, virtualKind: "sharedDrives" },
    childIds: [] as string[],
    loaded: true,
    parentId: ROOT_ID,
  };
  const existingIds = new Set(existing.childIds);
  const newIds: string[] = [];

  for (const drive of drives) {
    const id = `shared-drive:${drive.id}`;
    if (!existingIds.has(id)) newIds.push(id);
    next[id] = {
      ...(next[id] ?? { childIds: [] as string[], loaded: false }),
      file: { id, name: drive.name, mimeType: FOLDER_MIME, driveId: drive.id, virtualKind: "sharedDrive" },
      parentId: SHARED_DRIVES_ID,
    };
  }

  next[SHARED_DRIVES_ID] = {
    ...existing,
    childIds: [...existing.childIds, ...newIds],
    loaded: true,
    parentId: ROOT_ID,
  };
  return next;
}

export function descendants(map: TreeMap, id: string): string[] {
  const out: string[] = [];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    const node = map[cur];
    if (!node) continue;
    for (const c of node.childIds) {
      out.push(c);
      stack.push(c);
    }
  }
  return out;
}
