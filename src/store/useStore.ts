import { create } from "zustand";
import type { TreeMap } from "../lib/tree";
import { ROOT_ID } from "../lib/tree";
import type { LayoutKind } from "../layouts/types";

type State = {
  token: string | null;
  tree: TreeMap;
  selectedId: string | null;
  focusRootId: string;
  layout: LayoutKind;
  expanded: Set<string>;
  showAllIds: Set<string>;
  setToken(token: string | null): void;
  setTree(tree: TreeMap): void;
  select(id: string | null): void;
  setFocusRoot(id: string): void;
  setLayout(layout: LayoutKind): void;
  toggleExpand(id: string): void;
  expand(id: string): void;
  showAll(id: string): void;
  reset(): void;
};

export const useStore = create<State>((set) => ({
  token: null,
  tree: {},
  selectedId: null,
  focusRootId: ROOT_ID,
  layout: "hierarchical",
  expanded: new Set([ROOT_ID]),
  showAllIds: new Set<string>(),
  setToken: (token) => set({ token }),
  setTree: (tree) => set({ tree }),
  select: (id) => set({ selectedId: id }),
  setFocusRoot: (id) => set({ focusRootId: id }),
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
  showAll: (id) => set((s) => ({ showAllIds: new Set([...s.showAllIds, id]) })),
  reset: () => set({ token: null, tree: {}, selectedId: null, focusRootId: ROOT_ID, expanded: new Set([ROOT_ID]), showAllIds: new Set() }),
}));
