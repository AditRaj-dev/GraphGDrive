import { useCallback, useMemo } from "react";
import { createDriveClient } from "../lib/drive";
import { mergeChildren, ROOT_ID } from "../lib/tree";
import { useStore } from "../store/useStore";

export function useDriveTree() {
  const token = useStore((s) => s.token);
  const tree = useStore((s) => s.tree);
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
    do {
      const res = await client.listChildren(parentId, pageToken);
      acc = mergeChildren(acc, parentId, res.files);
      pageToken = res.nextPageToken;
    } while (pageToken);
    setTree(acc);
  }, [client, setTree, token]);

  const ensureRoot = useCallback(async () => {
    if (!useStore.getState().tree[ROOT_ID]?.loaded) await loadChildren(ROOT_ID);
  }, [loadChildren]);

  const expandAll = useCallback(async () => {
    if (!token) return;
    await ensureRoot();
    const queue: string[] = [...(useStore.getState().tree[ROOT_ID]?.childIds ?? [])];
    while (queue.length) {
      const id = queue.shift()!;
      const node = useStore.getState().tree[id];
      if (!node) continue;
      const isFolder = node.file.mimeType === "application/vnd.google-apps.folder";
      if (isFolder && !node.loaded) {
        await loadChildren(id);
        expand(id);
      }
      queue.push(...(useStore.getState().tree[id]?.childIds ?? []));
    }
  }, [ensureRoot, expand, loadChildren, token]);

  const visibleIds = useMemo(() => {
    const expanded = useStore.getState().expanded;
    if (!tree[ROOT_ID]) return [];
    const out: string[] = [ROOT_ID];
    const walk = (id: string) => {
      const node = tree[id];
      if (!node) return;
      const isFolder = node.file.mimeType === "application/vnd.google-apps.folder";
      if (isFolder && expanded.has(id)) {
        for (const c of node.childIds) {
          out.push(c);
          walk(c);
        }
      }
    };
    walk(ROOT_ID);
    return out;
  }, [tree]);

  return { ensureRoot, loadChildren, expandAll, visibleIds };
}
