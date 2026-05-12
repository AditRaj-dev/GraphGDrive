import { useEffect, useRef, useState } from "react";
import type { TreeNode } from "../types/drive";
import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { ROOT_ID, SHARED_DRIVES_ID, SHARED_WITH_ME_ID, type TreeMap } from "../lib/tree";

function deriveActiveDrive(tree: TreeMap, focusRootId: string): string {
  if (focusRootId === ROOT_ID) return ROOT_ID;
  if (focusRootId.startsWith("shared-drive:")) return focusRootId;
  let cur: string | null = focusRootId;
  while (cur) {
    if (cur === ROOT_ID) return ROOT_ID;
    if (cur.startsWith("shared-drive:")) return cur;
    const tn: TreeNode | undefined = tree[cur];
    if (!tn) return ROOT_ID;
    if (tn.parentId === SHARED_WITH_ME_ID) return cur;
    if (!tn.parentId) return ROOT_ID;
    cur = tn.parentId;
  }
  return ROOT_ID;
}

export default function DriveSelector() {
  const tree = useStore((s) => s.tree);
  const focusRootId = useStore((s) => s.focusRootId);
  const setFocusRoot = useStore((s) => s.setFocusRoot);
  const expand = useStore((s) => s.expand);
  const { loadChildren } = useDriveTree();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sharedDrives = (tree[SHARED_DRIVES_ID]?.childIds ?? [])
    .map((id) => tree[id])
    .filter(Boolean);

  const sharedFolders = (tree[SHARED_WITH_ME_ID]?.childIds ?? [])
    .map((id) => tree[id])
    .filter(Boolean);

  const activeDriveId = deriveActiveDrive(tree, focusRootId);
  const activeName =
    activeDriveId === ROOT_ID
      ? "My Drive"
      : (tree[activeDriveId]?.file.name ?? activeDriveId);

  const q = query.toLowerCase();
  const matchesDrive = (name: string) => name.toLowerCase().includes(q);
  const myDriveVisible = matchesDrive("My Drive");
  const filteredFolders = sharedFolders.filter((n) => matchesDrive(n!.file.name));
  const filteredDrives = sharedDrives.filter((n) => matchesDrive(n!.file.name));
  const hasResults = myDriveVisible || filteredFolders.length > 0 || filteredDrives.length > 0;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery("");
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function selectDrive(id: string) {
    setOpen(false);
    const node = useStore.getState().tree[id];
    if (node && !node.loaded) await loadChildren(id);
    expand(id);
    setFocusRoot(id);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors max-w-[200px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <DriveIcon />
        <span className="truncate">{activeName}</span>
        <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-64 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg z-50 text-xs flex flex-col"
          style={{ maxHeight: "320px" }}
        >
          {/* Search input — sticky at top */}
          <div className="px-2 pt-2 pb-1 border-b border-stone-100 dark:border-stone-700 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-stone-100 dark:bg-stone-800">
              <svg className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6.5" cy="6.5" r="4.5" />
                <line x1="10" y1="10" x2="14" y2="14" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drives..."
                className="flex-1 bg-transparent outline-none text-xs text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-200">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1 py-1">
            {!hasResults && (
              <div className="px-3 py-3 text-stone-400 dark:text-stone-500 text-center">No results</div>
            )}

            {myDriveVisible && (
              <DriveOption
                label="My Drive"
                active={activeDriveId === ROOT_ID}
                icon={<MyDriveIcon />}
                onSelect={() => void selectDrive(ROOT_ID)}
              />
            )}

            {filteredFolders.length > 0 && (
              <>
                <div className="mx-2 my-1 border-t border-stone-100 dark:border-stone-700" />
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Shared with me
                </div>
                {filteredFolders.map((node) => (
                  <DriveOption
                    key={node!.file.id}
                    label={node!.file.name}
                    active={activeDriveId === node!.file.id}
                    icon={<SharedFolderIcon />}
                    onSelect={() => void selectDrive(node!.file.id)}
                  />
                ))}
              </>
            )}

            {filteredDrives.length > 0 && (
              <>
                <div className="mx-2 my-1 border-t border-stone-100 dark:border-stone-700" />
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Shared drives
                </div>
                {filteredDrives.map((node) => (
                  <DriveOption
                    key={node!.file.id}
                    label={node!.file.name}
                    active={activeDriveId === node!.file.id}
                    icon={<SharedDriveIcon />}
                    onSelect={() => void selectDrive(node!.file.id)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DriveOption({ label, active, icon, onSelect }: {
  label: string; active: boolean; icon: React.ReactNode; onSelect: () => void;
}) {
  return (
    <button
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={[
        "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
        active
          ? "bg-stone-100 text-stone-900 dark:bg-stone-800 dark:text-stone-100 font-medium"
          : "text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800",
      ].join(" ")}
    >
      {icon}
      <span className="truncate">{label}</span>
      {active && (
        <svg className="ml-auto w-3 h-3 shrink-0 text-stone-500 dark:text-stone-400" viewBox="0 0 12 12">
          <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
    </button>
  );
}

function DriveIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-stone-500 dark:text-stone-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function MyDriveIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function SharedFolderIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      <path fillOpacity=".6" d="M10 10a2 2 0 100 4 2 2 0 000-4zm-3 2a3 3 0 116 0 3 3 0 01-6 0z" />
    </svg>
  );
}

function SharedDriveIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.97 5.97 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.97 5.97 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
    </svg>
  );
}
