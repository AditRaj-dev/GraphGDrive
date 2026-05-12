import { useCallback, useMemo } from "react";
import { createDriveClient } from "../lib/drive";
import { mergeChildren, mergeSharedDrives, mergeSharedFolders, ROOT_ID } from "../lib/tree";
import { categorize } from "../lib/mime";
import { useStore } from "../store/useStore";
import type { DriveFile } from "../types/drive";

const FOLDER_MIME = "application/vnd.google-apps.folder";
// Max parallel Drive API requests — stays well inside quota limits
const PARALLEL = 6;

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

  // Fetch all pages for one folder and return the file list (no store update)
  const fetchFolder = useCallback(async (parentId: string): Promise<{ files: DriveFile[]; groupLooseFiles: boolean }> => {
    const parent = useStore.getState().tree[parentId];
    const driveId = parent?.file.driveId;
    const apiParentId = parent?.file.virtualKind === "sharedDrive" && driveId ? driveId : parentId;
    const groupLooseFiles = parentId === ROOT_ID || parent?.file.virtualKind === "sharedDrive";
    let pageToken: string | undefined;
    const files: DriveFile[] = [];
    do {
      const res = await client.listChildren(apiParentId, pageToken, driveId ? { driveId } : undefined);
      files.push(...res.files);
      pageToken = res.nextPageToken;
    } while (pageToken);
    return { files, groupLooseFiles };
  }, [client]);

  // Load one folder and immediately update the store (used for single-click expand)
  const loadChildren = useCallback(async (parentId: string) => {
    if (!token) return;
    const { files, groupLooseFiles } = await fetchFolder(parentId);
    // Always read latest tree before merging to avoid stale closure
    const acc = mergeChildren(useStore.getState().tree, parentId, files, { groupLooseFiles });
    setTree(acc);
  }, [fetchFolder, setTree, token]);

  // Load multiple folders in parallel, merge all results in one store write
  const loadChildrenBatch = useCallback(async (parentIds: string[]) => {
    if (!token || parentIds.length === 0) return;
    // Fetch in parallel, chunked to respect PARALLEL limit
    const results: { parentId: string; files: DriveFile[]; groupLooseFiles: boolean }[] = [];
    for (let i = 0; i < parentIds.length; i += PARALLEL) {
      const chunk = parentIds.slice(i, i + PARALLEL);
      const fetched = await Promise.all(
        chunk.map(async (parentId) => {
          const { files, groupLooseFiles } = await fetchFolder(parentId);
          return { parentId, files, groupLooseFiles };
        })
      );
      results.push(...fetched);
      // Merge and commit after each chunk so the graph updates progressively
      let acc = useStore.getState().tree;
      for (const { parentId, files, groupLooseFiles } of fetched) {
        acc = mergeChildren(acc, parentId, files, { groupLooseFiles });
      }
      setTree(acc);
    }
    return results;
  }, [fetchFolder, setTree, token]);

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
      const level = queue.splice(0); // take all items at current level
      const toLoad = level.filter((id) => {
        const n = useStore.getState().tree[id];
        return n?.file.mimeType === FOLDER_MIME && !n.loaded;
      });
      if (toLoad.length) await loadChildrenBatch(toLoad);
      for (const id of level) {
        const node = useStore.getState().tree[id];
        if (!node || node.file.mimeType !== FOLDER_MIME) continue;
        expand(id);
        queue.push(...(useStore.getState().tree[id]?.childIds ?? []));
      }
    }
  }, [ensureRoot, expand, loadChildrenBatch, token]);

  // Expand a specific folder and all its descendants in parallel level-by-level
  const expandSubtree = useCallback(async (rootId: string) => {
    if (!token) return;
    let level = [rootId];
    while (level.length > 0) {
      const toLoad = level.filter((id) => !useStore.getState().tree[id]?.loaded);
      if (toLoad.length) await loadChildrenBatch(toLoad);
      const nextLevel: string[] = [];
      for (const id of level) {
        expand(id);
        for (const childId of useStore.getState().tree[id]?.childIds ?? []) {
          if (useStore.getState().tree[childId]?.file.mimeType === FOLDER_MIME) {
            nextLevel.push(childId);
          }
        }
      }
      level = nextLevel;
    }
  }, [expand, loadChildrenBatch, token]);

  const FOLDER_LIMIT = 20;

  const visibleIds = useMemo(() => {
    if (!tree[focusRootId]) return [];
    const out: string[] = [focusRootId];

    const walk = (id: string) => {
      const node = tree[id];
      if (!node) return;
      if (node.file.mimeType !== FOLDER_MIME) return;
      if (!expanded.has(id)) return;

      const children = node.childIds;
      const showAll = showAllIds.has(id);

      const subfolders = children.filter((c) => tree[c]?.file.mimeType === FOLDER_MIME);
      const files = children.filter((c) => tree[c] && tree[c]!.file.mimeType !== FOLDER_MIME);

      const visibleFolders = showAll ? subfolders : subfolders.slice(0, FOLDER_LIMIT);
      for (const fid of visibleFolders) { out.push(fid); walk(fid); }
      if (!showAll && subfolders.length > FOLDER_LIMIT) out.push(`__more__${id}`);

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
