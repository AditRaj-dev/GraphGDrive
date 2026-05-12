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
  sidebarOpen: boolean;
  selectedIds: Set<string>;
  darkMode: boolean;
  setToken(token: string | null): void;
  setTree(tree: TreeMap): void;
  select(id: string | null): void;
  setFocusRoot(id: string): void;
  setLayout(layout: LayoutKind): void;
  toggleExpand(id: string): void;
  expand(id: string): void;
  showAll(id: string): void;
  reset(): void;
  setSidebarOpen(open: boolean): void;
  toggleSelectedId(id: string): void;
  clearSelectedIds(): void;
  toggleDarkMode(): void;
};

export const useStore = create<State>((set) => ({
  token: null,
  tree: {},
  selectedId: null,
  focusRootId: ROOT_ID,
  layout: "hierarchical",
  expanded: new Set([ROOT_ID]),
  showAllIds: new Set<string>(),
  sidebarOpen: true,
  selectedIds: new Set<string>(),
  darkMode: localStorage.getItem("darkMode") === "true",
  setToken: (token) => set({ token }),
  setTree: (tree) => set({ tree }),
  select: (id) => set(id !== null ? { selectedId: id, sidebarOpen: true } : { selectedId: id }),
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
  reset: () => set({ token: null, tree: {}, selectedId: null, focusRootId: ROOT_ID, expanded: new Set([ROOT_ID]), showAllIds: new Set(), sidebarOpen: true, selectedIds: new Set() }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSelectedId: (id) => set((s) => {
    const next = new Set(s.selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    return { selectedIds: next };
  }),
  clearSelectedIds: () => set({ selectedIds: new Set() }),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem("darkMode", String(next));
    return { darkMode: next };
  }),
}));
