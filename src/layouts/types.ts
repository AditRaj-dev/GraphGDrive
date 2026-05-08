export type LayoutKind = "hierarchical" | "radial" | "force";

export type LayoutNode = { id: string; parentId: string | null; isFolder: boolean };
export type PositionedNode = { id: string; x: number; y: number };

export type LayoutFn = (nodes: LayoutNode[]) => PositionedNode[];
