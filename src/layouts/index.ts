import type { LayoutFn, LayoutKind } from "./types";
import { hierarchical } from "./hierarchical";
import { radial } from "./radial";
import { force } from "./force";

export const layouts: Record<LayoutKind, LayoutFn> = { hierarchical, radial, force };
export type { LayoutFn, LayoutKind, LayoutNode, PositionedNode } from "./types";
