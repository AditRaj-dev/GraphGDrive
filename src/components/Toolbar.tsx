import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { revokeAccessToken } from "../lib/auth";
import type { LayoutKind } from "../layouts/types";

const KINDS: { value: LayoutKind; label: string }[] = [
  { value: "hierarchical", label: "Tree" },
  { value: "radial", label: "Radial" },
  { value: "force", label: "Force" },
];

interface ToolbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Toolbar({ sidebarOpen, onToggleSidebar }: ToolbarProps) {
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);
  const token = useStore((s) => s.token);
  const reset = useStore((s) => s.reset);
  const { expandAll } = useDriveTree();

  async function onSignOut() {
    if (token) await revokeAccessToken(token);
    reset();
  }

  return (
    <header className="h-12 px-4 border-b border-stone-200 bg-white flex items-center gap-4 shrink-0" role="banner">
      <span className="font-mono font-bold text-sm text-stone-900 tracking-tight">graph·drive</span>

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
              /* panel-right-close: vertical divider + arrow pointing right */
              <>
                <rect x="1" y="1" width="12" height="12" rx="1.5" />
                <line x1="9" y1="1" x2="9" y2="13" />
                <polyline points="6,4.5 8.5,7 6,9.5" />
              </>
            ) : (
              /* panel-right-open: vertical divider + arrow pointing left */
              <>
                <rect x="1" y="1" width="12" height="12" rx="1.5" />
                <line x1="9" y1="1" x2="9" y2="13" />
                <polyline points="8.5,4.5 6,7 8.5,9.5" />
              </>
            )}
          </svg>
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
