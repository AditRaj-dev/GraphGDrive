import { useCallback, useMemo } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import FolderNode from "./nodes/FolderNode";
import FileNode from "./nodes/FileNode";
import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { ROOT_ID } from "../lib/tree";
import { layouts } from "../layouts";
import { categorize, isFolder as isFolderMime } from "../lib/mime";

const nodeTypes: NodeTypes = { folder: FolderNode as never, file: FileNode as never };

export default function GraphCanvas() {
  const tree = useStore((s) => s.tree);
  const layoutKind = useStore((s) => s.layout);
  const expanded = useStore((s) => s.expanded);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const toggleExpand = useStore((s) => s.toggleExpand);
  const { loadChildren, visibleIds } = useDriveTree();

  const { nodes, edges } = useMemo(() => {
    const layoutNodes = visibleIds
      .map((id) => tree[id])
      .filter((n) => n !== undefined)
      .map((n) => ({
        id: n.file.id,
        parentId: n.file.id === ROOT_ID ? null : (n.file.parents?.[0] ?? null),
        isFolder: isFolderMime(n.file.mimeType),
      }));
    const positions = layouts[layoutKind](layoutNodes);
    const posMap = Object.fromEntries(positions.map((p) => [p.id, p]));

    const nodes: Node[] = layoutNodes.map((ln) => {
      const node = tree[ln.id];
      const pos = posMap[ln.id] ?? { x: 0, y: 0 };
      if (!node) return { id: ln.id, position: pos, data: {} };
      if (ln.isFolder) {
        return {
          id: ln.id,
          type: "folder",
          position: { x: pos.x, y: pos.y },
          data: { name: node.file.name, expanded: expanded.has(ln.id), loaded: node.loaded },
        };
      }
      return {
        id: ln.id,
        type: "file",
        position: { x: pos.x, y: pos.y },
        data: { name: node.file.name, kind: categorize(node.file.mimeType), selected: selectedId === ln.id },
      };
    });

    const edges: Edge[] = layoutNodes
      .filter((n) => n.parentId)
      .map((n) => ({
        id: `${n.parentId as string}->${n.id}`,
        source: n.parentId as string,
        target: n.id,
        style: { stroke: "#d6d3d1", strokeWidth: 1.5 },
      }));

    return { nodes, edges };
  }, [tree, visibleIds, layoutKind, expanded, selectedId]);

  const onNodeClick = useCallback(async (_: unknown, node: Node) => {
    const tn = useStore.getState().tree[node.id];
    if (!tn) return;
    if (isFolderMime(tn.file.mimeType)) {
      if (!tn.loaded) await loadChildren(tn.file.id);
      toggleExpand(tn.file.id);
    } else {
      select(tn.file.id);
    }
  }, [loadChildren, select, toggleExpand]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-stone-100"
      >
        <Background color="#d6d3d1" gap={24} />
        <Controls className="!shadow-sm" />
        <MiniMap pannable zoomable className="!shadow-sm !rounded-md" />
      </ReactFlow>
    </div>
  );
}
