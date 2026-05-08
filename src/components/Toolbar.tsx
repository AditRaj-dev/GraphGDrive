import { useStore } from "../store/useStore";
import { useDriveTree } from "../hooks/useDriveTree";
import { revokeAccessToken } from "../lib/auth";
import type { LayoutKind } from "../layouts/types";

const KINDS: { value: LayoutKind; label: string }[] = [
  { value: "hierarchical", label: "Tree" },
  { value: "radial", label: "Radial" },
  { value: "force", label: "Force" },
];

export default function Toolbar() {
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

      <div className="ml-auto">
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
