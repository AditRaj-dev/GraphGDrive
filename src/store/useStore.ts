import { create } from "zustand";
import type { TreeMap } from "../lib/tree";
import { ROOT_ID } from "../lib/tree";
import type { LayoutKind } from "../layouts/types";

type State = {
  token: string | null;
  tree: TreeMap;
  selectedId: string | null;
  layout: LayoutKind;
  expanded: Set<string>;
  setToken(token: string | null): void;
  setTree(tree: TreeMap): void;
  select(id: string | null): void;
  setLayout(layout: LayoutKind): void;
  toggleExpand(id: string): void;
  expand(id: string): void;
  reset(): void;
};

export const useStore = create<State>((set) => ({
  token: null,
  tree: {},
  selectedId: null,
  layout: "hierarchical",
  expanded: new Set([ROOT_ID]),
  setToken: (token) => set({ token }),
  setTree: (tree) => set({ tree }),
  select: (id) => set({ selectedId: id }),
  setLayout: (layout) => set({ layout }),
  toggleExpand: (id) => set((s) => {
    const next = new Set(s.expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    return { expanded: next };
  }),
  expand: (id) => set((s) => {
    const next = new Set(s.expanded);
    next.add(id);
    return { expanded: next };
  }),
  reset: () => set({ token: null, tree: {}, selectedId: null, expanded: new Set([ROOT_ID]) }),
}));
