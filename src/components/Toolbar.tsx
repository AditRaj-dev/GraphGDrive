import { useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { revokeAccessToken } from "../lib/auth";
import { ROOT_ID } from "../lib/tree";
import type { LayoutKind } from "../layouts/types";
import DriveSelector from "./DriveSelector";
import { downloadFilesAsZip } from "../lib/download";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

const KINDS: { value: LayoutKind; label: string }[] = [
  { value: "hierarchical", label: "Tree" },
  { value: "radial", label: "Radial" },
  { value: "force", label: "Force" },
];

type ShakeState = {
  lastX: number;
  direction: -1 | 0 | 1;
  flips: number;
  distance: number;
  triggered: boolean;
};

const SHAKE_FLIPS = 3;
const SHAKE_DISTANCE = 32;

interface ToolbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onShowShortcuts: () => void;
}

export default function Toolbar({ sidebarOpen, onToggleSidebar, onShowShortcuts }: ToolbarProps) {
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);
  const token = useStore((s) => s.token);
  const reset = useStore((s) => s.reset);
  const focusRootId = useStore((s) => s.focusRootId);
  const setFocusRoot = useStore((s) => s.setFocusRoot);
  const tree = useStore((s) => s.tree);
  const selectedIds = useStore((s) => s.selectedIds);
  const clearSelectedIds = useStore((s) => s.clearSelectedIds);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const { expandAll } = useDriveTree();
  const [downloading, setDownloading] = useState(false);
  const selectionShake = useRef<ShakeState | null>(null);
  const suppressSelectionClick = useRef(false);

  const isFocused = focusRootId !== ROOT_ID;
  const focusedName = isFocused ? (tree[focusRootId]?.file.name ?? focusRootId) : null;

  async function onSignOut() {
    if (token) await revokeAccessToken(token);
    reset();
  }

  async function onDownload() {
    if (!token || selectedIds.size === 0) return;
    setDownloading(true);
    try {
      const entries = [...selectedIds].map((id) => ({
        id,
        name: tree[id]?.file.name ?? id,
      }));
      await downloadFilesAsZip(entries, token, "selected-files.zip");
      clearSelectedIds();
    } finally {
      setDownloading(false);
    }
  }

  function onSelectionPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (downloading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    suppressSelectionClick.current = false;
    selectionShake.current = {
      lastX: e.clientX,
      direction: 0,
      flips: 0,
      distance: 0,
      triggered: false,
    };
  }

  function onSelectionPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const state = selectionShake.current;
    if (!state || state.triggered) return;

    const dx = e.clientX - state.lastX;
    const nextDirection = Math.abs(dx) < 4 ? state.direction : dx > 0 ? 1 : -1;
    state.distance += Math.abs(dx);
    state.lastX = e.clientX;

    if (nextDirection !== 0 && state.direction !== 0 && nextDirection !== state.direction) {
      state.flips += 1;
    }
    state.direction = nextDirection;

    if (state.flips >= SHAKE_FLIPS && state.distance >= SHAKE_DISTANCE) {
      state.triggered = true;
      suppressSelectionClick.current = true;
      clearSelectedIds();
    }
  }

  function onSelectionPointerEnd() {
    selectionShake.current = null;
  }

  return (
    <header className="h-12 px-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center gap-4 shrink-0" role="banner">
      <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100 tracking-tight">graph·drive</span>

      <DriveSelector />

      {/* Back to full drive when focused on a subfolder */}
      {isFocused && (
        <button
          onClick={() => setFocusRoot(ROOT_ID)}
          className="flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 transition-colors"
          aria-label="Back to full drive"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7,2 3,6 7,10" />
          </svg>
          <span className="max-w-[140px] truncate">{focusedName}</span>
        </button>
      )}

      <div className="flex items-center gap-1" role="group" aria-label="Layout">
        {KINDS.map((k) => (
          <button
            key={k.value}
            onClick={() => setLayout(k.value)}
            aria-pressed={layout === k.value}
            className={[
              "h-7 px-3 rounded text-xs font-medium transition-colors",
              layout === k.value
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700",
            ].join(" ")}
          >
            {k.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => void expandAll()}
        className="h-7 px-3 rounded text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors"
      >
        Expand all
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="h-7 w-7 flex items-center justify-center rounded bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors"
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
        {/* Download selected files */}
        {selectedIds.size > 0 && (
          <button
            onPointerDown={onSelectionPointerDown}
            onPointerMove={onSelectionPointerMove}
            onPointerUp={onSelectionPointerEnd}
            onPointerCancel={onSelectionPointerEnd}
            onClick={(e) => {
              if (suppressSelectionClick.current) {
                suppressSelectionClick.current = false;
                e.preventDefault();
                return;
              }
              void onDownload();
            }}
            disabled={downloading}
            title={`Download ${selectedIds.size} selected file${selectedIds.size !== 1 ? "s" : ""} as zip. Drag and shake to clear selection.`}
            className="h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors touch-none cursor-grab active:cursor-grabbing"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2,4 6,8 10,4" />
              <line x1="6" y1="8" x2="6" y2="1" />
              <line x1="1" y1="11" x2="11" y2="11" />
            </svg>
            {downloading ? "Zipping..." : `${selectedIds.size} file${selectedIds.size !== 1 ? "s" : ""}`}
          </button>
        )}

        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Hide preview panel" : "Show preview panel"}
          aria-pressed={sidebarOpen}
          className="h-7 w-7 flex items-center justify-center rounded bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {sidebarOpen ? (
              <>
                <rect x="1" y="1" width="12" height="12" rx="1.5" />
                <line x1="9" y1="1" x2="9" y2="13" />
                <polyline points="6,4.5 8.5,7 6,9.5" />
              </>
            ) : (
              <>
                <rect x="1" y="1" width="12" height="12" rx="1.5" />
                <line x1="9" y1="1" x2="9" y2="13" />
                <polyline points="8.5,4.5 6,7 8.5,9.5" />
              </>
            )}
          </svg>
        </button>

        <button
          onClick={onShowShortcuts}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="h-7 w-7 flex items-center justify-center rounded bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 transition-colors font-mono text-xs font-semibold"
        >
          ?
        </button>

        <button
          onClick={() => void onSignOut()}
          className="h-7 px-3 rounded text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
