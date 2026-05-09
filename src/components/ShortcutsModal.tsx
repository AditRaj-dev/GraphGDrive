import { useEffect } from "react";

type Props = { onClose(): void };

const SECTIONS = [
  {
    title: "Folders",
    rows: [
      { keys: ["Click"], desc: "Expand / collapse folder" },
      { keys: ["Shift", "Click"], desc: "Focus graph on this folder" },
      { keys: ["Shift", "Alt", "Click"], desc: "Focus + expand entire subtree" },
    ],
  },
  {
    title: "Files",
    rows: [
      { keys: ["Click"], desc: "Select file (opens preview pane)" },
    ],
  },
  {
    title: "Collections (grouped files)",
    rows: [
      { keys: ["Double-click"], desc: "Open collection in floating window" },
      { keys: ["Drag title bar"], desc: "Move the window" },
      { keys: ["Drag edge / corner"], desc: "Resize the window" },
    ],
  },
  {
    title: "Graph navigation",
    rows: [
      { keys: ["Scroll"], desc: "Zoom in / out" },
      { keys: ["Click + drag"], desc: "Pan the canvas" },
      { keys: ["Click … N more"], desc: "Show all hidden subfolders" },
    ],
  },
  {
    title: "App",
    rows: [
      { keys: ["?"], desc: "Open / close this shortcuts panel" },
    ],
  },
];

export default function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-xl shadow-2xl border border-stone-200 w-[480px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <h2 className="font-semibold text-sm text-stone-800 tracking-wide">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* body */}
        <div className="overflow-auto px-5 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.rows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-stone-500">{row.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {row.keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          {ki > 0 && <span className="text-stone-300 text-[10px]">+</span>}
                          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 text-[11px] font-mono text-stone-600 shadow-sm">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-stone-100 shrink-0">
          <p className="text-[10px] text-stone-400">Press <kbd className="px-1 py-0.5 rounded border border-stone-200 bg-stone-50 font-mono text-[10px]">?</kbd> or <kbd className="px-1 py-0.5 rounded border border-stone-200 bg-stone-50 font-mono text-[10px]">Esc</kbd> to close</p>
        </div>
      </div>
    </div>
  );
}
