import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { revokeAccessToken } from "../lib/auth";
import { ROOT_ID } from "../lib/tree";
import type { LayoutKind } from "../layouts/types";
import DriveSelector from "./DriveSelector";

const KINDS: { value: LayoutKind; label: string }[] = [
  { value: "hierarchical", label: "Tree" },
  { value: "radial", label: "Radial" },
  { value: "force", label: "Force" },
];

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
  const { expandAll } = useDriveTree();

  const isFocused = focusRootId !== ROOT_ID;
  const focusedName = isFocused ? (tree[focusRootId]?.file.name ?? focusRootId) : null;

  async function onSignOut() {
    if (token) await revokeAccessToken(token);
    reset();
  }

  return (
    <header className="h-12 px-4 border-b border-stone-200 bg-white flex items-center gap-4 shrink-0" role="banner">
      <span className="font-mono font-bold text-sm text-stone-900 tracking-tight">graph·drive</span>

      <DriveSelector />

      {/* Back to full drive when focused on a subfolder */}
      {isFocused && (
        <button
          onClick={() => setFocusRoot(ROOT_ID)}
          className="flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
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
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            ].join(" ")}
          >
            {k.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => void expandAll()}
        className="h-7 px-3 rounded text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
      >
        Expand all
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Hide preview panel" : "Show preview panel"}
          aria-pressed={sidebarOpen}
          className="h-7 w-7 flex items-center justify-center rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
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
          className="h-7 w-7 flex items-center justify-center rounded bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors font-mono text-xs font-semibold"
        >
          ?
        </button>

        <button
          onClick={() => void onSignOut()}
          className="h-7 px-3 rounded text-xs font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
