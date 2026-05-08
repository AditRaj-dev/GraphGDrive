import type { DriveFile, TreeNode } from "../types/drive";

export const ROOT_ID = "root";

export type TreeMap = Record<string, TreeNode>;

const rootNode = (): TreeNode => ({
  file: { id: ROOT_ID, name: "My Drive", mimeType: "application/vnd.google-apps.folder" },
  childIds: [],
  loaded: false,
});

export function mergeChildren(map: TreeMap, parentId: string, children: DriveFile[]): TreeMap {
  const next: TreeMap = { ...map };
  if (!next[parentId]) {
    next[parentId] = parentId === ROOT_ID
      ? rootNode()
      : { file: { id: parentId, name: parentId, mimeType: "application/vnd.google-apps.folder" }, childIds: [], loaded: false };
  }
  const existingIds = new Set(next[parentId].childIds);
  const newIds: string[] = [];
  for (const child of children) {
    if (!existingIds.has(child.id)) newIds.push(child.id);
    const existing = next[child.id] ?? { file: child, childIds: [] as string[], loaded: false };
    next[child.id] = { ...existing, file: child };
  }
  next[parentId] = {
    ...next[parentId],
    childIds: [...next[parentId].childIds, ...newIds],
    loaded: true,
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
