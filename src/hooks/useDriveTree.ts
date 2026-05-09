import { useCallback, useMemo } from "react";
import { createDriveClient } from "../lib/drive";
import { mergeChildren, mergeSharedDrives, mergeSharedFolders, ROOT_ID } from "../lib/tree";
import { categorize } from "../lib/mime";
import { useStore } from "../store/useStore";

export function useDriveTree() {
  const token = useStore((s) => s.token);
  const tree = useStore((s) => s.tree);
  const expanded = useStore((s) => s.expanded);
  const focusRootId = useStore((s) => s.focusRootId);
  const showAllIds = useStore((s) => s.showAllIds);
  const setTree = useStore((s) => s.setTree);
  const expand = useStore((s) => s.expand);

  const client = useMemo(
    () => createDriveClient(() => token ?? ""),
    [token]
  );

  const loadChildren = useCallback(async (parentId: string) => {
    if (!token) return;
    let pageToken: string | undefined;
    let acc = useStore.getState().tree;
    const parent = acc[parentId];
    const driveId = parent?.file.driveId;
    const apiParentId = parent?.file.virtualKind === "sharedDrive" && driveId ? driveId : parentId;
    const groupLooseFiles = parentId === ROOT_ID || parent?.file.virtualKind === "sharedDrive";
    do {
      const res = await client.listChildren(apiParentId, pageToken, driveId ? { driveId } : undefined);
      acc = mergeChildren(acc, parentId, res.files, { groupLooseFiles });
      pageToken = res.nextPageToken;
    } while (pageToken);
    setTree(acc);
  }, [client, setTree, token]);

  const loadSharedDrives = useCallback(async () => {
    if (!token) return;
    let pageToken: string | undefined;
    let acc = useStore.getState().tree;
    do {
      const res = await client.listSharedDrives(pageToken);
      acc = mergeSharedDrives(acc, res.drives);
      pageToken = res.nextPageToken;
    } while (pageToken);
    setTree(acc);
  }, [client, setTree, token]);

  const loadSharedFolders = useCallback(async () => {
    if (!token) return;
    let pageToken: string | undefined;
    let acc = useStore.getState().tree;
    do {
      const res = await client.listSharedFolders(pageToken);
      acc = mergeSharedFolders(acc, res.files);
      pageToken = res.nextPageToken;
    } while (pageToken);
    setTree(acc);
  }, [client, setTree, token]);

  const ensureRoot = useCallback(async () => {
    if (!useStore.getState().tree[ROOT_ID]?.loaded) await loadChildren(ROOT_ID);
    await Promise.all([loadSharedDrives(), loadSharedFolders()]);
  }, [loadChildren, loadSharedDrives, loadSharedFolders]);

  const expandAll = useCallback(async () => {
    if (!token) return;
    await ensureRoot();
    const queue: string[] = [...(useStore.getState().tree[ROOT_ID]?.childIds ?? [])];
    while (queue.length) {
      const id = queue.shift()!;
      const node = useStore.getState().tree[id];
      if (!node) continue;
      const isFolder = node.file.mimeType === "application/vnd.google-apps.folder";
      if (isFolder) {
        if (!node.loaded) await loadChildren(id);
        expand(id);
      }
      queue.push(...(useStore.getState().tree[id]?.childIds ?? []));
    }
  }, [ensureRoot, expand, loadChildren, token]);

  // Expand a specific folder and all its descendants (without touching the rest of the tree)
  const expandSubtree = useCallback(async (rootId: string) => {
    if (!token) return;
    const queue: string[] = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      const node = useStore.getState().tree[id];
      if (!node) continue;
      const isFolder = node.file.mimeType === "application/vnd.google-apps.folder";
      if (isFolder) {
        if (!node.loaded) await loadChildren(id);
        expand(id);
        queue.push(...(useStore.getState().tree[id]?.childIds ?? []));
      }
    }
  }, [expand, loadChildren, token]);

  const FOLDER_LIMIT = 20;

  const visibleIds = useMemo(() => {
    if (!tree[focusRootId]) return [];
    const out: string[] = [focusRootId];

    const walk = (id: string) => {
      const node = tree[id];
      if (!node) return;
      if (node.file.mimeType !== "application/vnd.google-apps.folder") return;
      if (!expanded.has(id)) return;

      const children = node.childIds;
      const showAll = showAllIds.has(id);

      // Split into subfolders and files
      const subfolders = children.filter((c) => tree[c]?.file.mimeType === "application/vnd.google-apps.folder");
      const files = children.filter((c) => tree[c] && tree[c]!.file.mimeType !== "application/vnd.google-apps.folder");

      // Cap subfolders (files are grouped, so they don't inflate node count)
      const visibleFolders = showAll ? subfolders : subfolders.slice(0, FOLDER_LIMIT);
      for (const fid of visibleFolders) { out.push(fid); walk(fid); }
      if (!showAll && subfolders.length > FOLDER_LIMIT) out.push(`__more__${id}`);

      // Group files by kind → one sentinel per kind, or expand if toggled
      const byKind = new Map<string, string[]>();
      for (const fid of files) {
        const kind = categorize(tree[fid]!.file.mimeType);
        if (!byKind.has(kind)) byKind.set(kind, []);
        byKind.get(kind)!.push(fid);
      }
      for (const [kind] of byKind) {
        out.push(`__grp__${id}__${kind}`);
      }
    };

    walk(focusRootId);
    return out;
  }, [tree, expanded, focusRootId, showAllIds]);

  return { ensureRoot, loadChildren, loadSharedDrives, expandAll, expandSubtree, visibleIds };
}
