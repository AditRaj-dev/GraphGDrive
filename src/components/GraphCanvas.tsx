import { useCallback, useMemo, useState, type MouseEvent } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, useReactFlow,
  type Node, type Edge, type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FolderNode from "./nodes/FolderNode";
import FileNode from "./nodes/FileNode";
import MoreNode from "./nodes/MoreNode";
import GroupNode from "./nodes/GroupNode";
import CollectionWindow from "./CollectionWindow";
import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { ROOT_ID } from "../lib/tree";
import { layouts } from "../layouts";
import { categorize, isFolder as isFolderMime } from "../lib/mime";
import { thumbnailUrl } from "../lib/drive";
import type { PreviewKind } from "../types/drive";

const FOLDER_LIMIT = 20;

function SmoothedMiniMap() {
  const { setCenter, getZoom } = useReactFlow();
  const darkMode = useStore((s) => s.darkMode);
  return (
    <MiniMap
      pannable
      zoomable
      className="!shadow-sm !rounded-md"
      style={darkMode ? { backgroundColor: "#1c1917", borderColor: "#44403c" } : undefined}
      nodeColor={darkMode ? "#78716c" : "#a8a29e"}
      maskColor={darkMode ? "rgba(0,0,0,0.4)" : "rgba(240,239,236,0.6)"}
      onClick={(_e, pos) => setCenter(pos.x, pos.y, { duration: 300, zoom: getZoom() })}
    />
  );
}

const nodeTypes: NodeTypes = {
  folder: FolderNode as never,
  file: FileNode as never,
  more: MoreNode as never,
  kindgroup: GroupNode as never,
};

// Parse __grp__<parentId>__<kind> — parentId may contain "__"
const KNOWN_KINDS = new Set(["image", "video", "pdf", "gdoc", "gsheet", "gslide", "other", "folder"]);
function parseGroupId(id: string): { parentId: string; kind: PreviewKind } | null {
  if (!id.startsWith("__grp__")) return null;
  const inner = id.slice("__grp__".length);
  for (const kind of KNOWN_KINDS) {
    const suffix = `__${kind}`;
    if (inner.endsWith(suffix)) {
      return { parentId: inner.slice(0, inner.length - suffix.length), kind: kind as PreviewKind };
    }
  }
  return null;
}

type OpenWindow = { groupId: string };

export default function GraphCanvas() {
  const tree = useStore((s) => s.tree);
  const layoutKind = useStore((s) => s.layout);
  const expanded = useStore((s) => s.expanded);
  const selectedId = useStore((s) => s.selectedId);
  const focusRootId = useStore((s) => s.focusRootId);
  const select = useStore((s) => s.select);
  const toggleExpand = useStore((s) => s.toggleExpand);
  const setFocusRoot = useStore((s) => s.setFocusRoot);
  const expand = useStore((s) => s.expand);
  const showAll = useStore((s) => s.showAll);
  const darkMode = useStore((s) => s.darkMode);
  const { loadChildren, expandSubtree, visibleIds } = useDriveTree();

  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

  const openCollection = useCallback((groupId: string) => {
    setOpenWindows((ws) => ws.find((w) => w.groupId === groupId) ? ws : [...ws, { groupId }]);
  }, []);

  const closeCollection = useCallback((groupId: string) => {
    setOpenWindows((ws) => ws.filter((w) => w.groupId !== groupId));
  }, []);

  const { nodes, edges } = useMemo(() => {
    const moreIds = visibleIds.filter((id) => id.startsWith("__more__"));
    const groupIds = visibleIds.filter((id) => id.startsWith("__grp__"));
    const realIds = visibleIds.filter((id) => !id.startsWith("__more__") && !id.startsWith("__grp__"));

    const parentMap = new Map<string, string>();
    for (const id of realIds) {
      const node = tree[id];
      if (!node) continue;
      for (const childId of node.childIds) {
        if (realIds.includes(childId)) parentMap.set(childId, id);
      }
    }

    const treeLayoutNodes = realIds
      .map((id) => tree[id])
      .filter((n) => n !== undefined)
      .map((n) => {
        const folder = isFolderMime(n.file.mimeType);
        const hasThumbnail = !folder &&
          (n.file.mimeType.startsWith("image/") || n.file.mimeType.startsWith("video/"));
        const treeParent = parentMap.get(n.file.id) ?? null;
        return {
          id: n.file.id,
          parentId: n.file.id === focusRootId ? null : treeParent,
          isFolder: folder,
          isMore: false,
          isGroup: false,
          width: 200,
          height: hasThumbnail ? 132 : folder ? 52 : 40,
        };
      });

    const moreLayoutNodes = moreIds.map((id) => ({
      id,
      parentId: id.slice("__more__".length),
      isFolder: false,
      isMore: true,
      isGroup: false,
      width: 200,
      height: 40,
    }));

    const groupLayoutNodes = groupIds.flatMap((id) => {
      const parsed = parseGroupId(id);
      if (!parsed) return [];
      return [{
        id,
        parentId: parsed.parentId,
        isFolder: false,
        isMore: false,
        isGroup: true,
        width: 200,
        height: 104,
      }];
    });

    const layoutNodes = [...treeLayoutNodes, ...moreLayoutNodes, ...groupLayoutNodes];
    const positions = layouts[layoutKind](layoutNodes);
    const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));

    const nodes: Node[] = layoutNodes.map((ln) => {
      const pos = posMap[ln.id] ?? { x: 0, y: 0 };

      if (ln.isMore) {
        const parentId = ln.id.slice("__more__".length);
        const subfolderCount = (tree[parentId]?.childIds ?? [])
          .filter((c) => tree[c]?.file.mimeType === "application/vnd.google-apps.folder").length;
        return { id: ln.id, type: "more", position: pos, data: { count: subfolderCount - FOLDER_LIMIT } };
      }

      if (ln.isGroup) {
        const parsed = parseGroupId(ln.id)!;
        const { parentId, kind } = parsed;
        const groupFiles = (tree[parentId]?.childIds ?? [])
          .map((cid) => tree[cid])
          .filter((n) => n && categorize(n.file.mimeType) === kind);
        const thumbnails = groupFiles
          .slice(0, 3)
          .map((n) => thumbnailUrl(n!.file.id));
        return {
          id: ln.id,
          type: "kindgroup",
          position: pos,
          selectable: false,
          focusable: false,
          data: { kind, count: groupFiles.length, thumbnails },
        };
      }

      const node = tree[ln.id];
      if (!node) return { id: ln.id, position: pos, data: {} };
      if (ln.isFolder) {
        return {
          id: ln.id,
          type: "folder",
          position: pos,
          data: { name: node.file.name, expanded: expanded.has(ln.id), loaded: node.loaded },
        };
      }
      return {
        id: ln.id,
        type: "file",
        position: pos,
        data: {
          name: node.file.name,
          kind: categorize(node.file.mimeType),
          selected: selectedId === ln.id,
          thumbnailUrl: thumbnailUrl(node.file.id),
        },
      };
    });

    const edges: Edge[] = layoutNodes
      .filter((n) => n.parentId)
      .map((n) => ({
        id: `${n.parentId}->${n.id}`,
        source: n.parentId as string,
        target: n.id,
        style: { stroke: darkMode ? "#57534e" : "#d6d3d1", strokeWidth: 1.5 },
      }));

    return { nodes, edges };
  }, [tree, visibleIds, layoutKind, expanded, selectedId, focusRootId, darkMode]);

  const onNodeClick = useCallback(async (event: MouseEvent, node: Node) => {
    // Group nodes: single-click does nothing (double-click opens window)
    if (node.id.startsWith("__grp__")) return;

    if (node.id.startsWith("__more__")) {
      showAll(node.id.slice("__more__".length));
      return;
    }
    const tn = useStore.getState().tree[node.id];
    if (!tn) return;
    if (isFolderMime(tn.file.mimeType)) {
      if (event.shiftKey && event.altKey) {
        setFocusRoot(tn.file.id);
        await expandSubtree(tn.file.id);
        return;
      }
      if (event.shiftKey) {
        setFocusRoot(tn.file.id);
        expand(tn.file.id);
        if (!tn.loaded) loadChildren(tn.file.id); // background
        return;
      }
      // Optimistic: toggle immediately, load children in background if needed
      toggleExpand(tn.file.id);
      if (!tn.loaded) loadChildren(tn.file.id); // background
    } else {
      select(tn.file.id);
    }
  }, [expand, expandSubtree, loadChildren, select, setFocusRoot, showAll, toggleExpand]);

  const onNodeDoubleClick = useCallback((_event: MouseEvent, node: Node) => {
    if (!node.id.startsWith("__grp__")) return;
    openCollection(node.id);
  }, [openCollection]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        proOptions={{ hideAttribution: true }}
        className={darkMode ? "bg-stone-900" : "bg-stone-100"}
      >
        <Background color={darkMode ? "#44403c" : "#d6d3d1"} gap={24} />
        <Controls className={`!shadow-sm ${darkMode ? "[&>button]:!bg-stone-800 [&>button]:!border-stone-700 [&>button]:!text-stone-300 [&>button:hover]:!bg-stone-700" : ""}`} />
        <SmoothedMiniMap />
      </ReactFlow>

      {openWindows.map(({ groupId }) => {
        const parsed = parseGroupId(groupId);
        if (!parsed) return null;
        const { parentId, kind } = parsed;
        const files = (tree[parentId]?.childIds ?? [])
          .map((cid) => tree[cid])
          .filter((n) => n && categorize(n.file.mimeType) === kind)
          .map((n) => ({ id: n!.file.id, name: n!.file.name }));
        return (
          <CollectionWindow
            key={groupId}
            kind={kind}
            files={files}
            onClose={() => closeCollection(groupId)}
            onFileSelect={(id) => select(id)}
          />
        );
      })}
    </div>
  );
}
