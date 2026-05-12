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
      { keys: ["Click"], desc: "Select file and open preview" },
      { keys: ["Ctrl", "Click"], desc: "Add or remove file from selection" },
      { keys: ["Cmd", "Click"], desc: "Add or remove file from selection on Mac" },
      { keys: ["Drag selected-files button"], desc: "Shake to clear the selection" },
    ],
  },
  {
    title: "Collections",
    rows: [
      { keys: ["Double-click"], desc: "Open collection window" },
      { keys: ["Ctrl", "Click"], desc: "Add or remove collection item from selection" },
      { keys: ["Cmd", "Click"], desc: "Add or remove collection item from selection on Mac" },
      { keys: ["Drag selected-files button"], desc: "Shake to clear the selection" },
      { keys: ["Drag title bar"], desc: "Move the window" },
      { keys: ["Drag edge / corner"], desc: "Resize the window" },
    ],
  },
  {
    title: "Graph navigation",
    rows: [
      { keys: ["Scroll"], desc: "Zoom in / out" },
      { keys: ["Click + drag"], desc: "Pan the canvas" },
      { keys: ["Click ... N more"], desc: "Show all hidden subfolders" },
    ],
  },
  {
    title: "App",
    rows: [
      { keys: ["?"], desc: "Open / close this shortcuts panel" },
      { keys: ["Esc"], desc: "Close this panel" },
    ],
  },
];

const keyClass =
  "inline-flex items-center px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-300 shadow-sm";

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
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

      <div
        className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 w-[520px] max-w-full max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-700 shrink-0">
          <h2 className="font-semibold text-sm text-stone-800 dark:text-stone-100 tracking-wide">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close shortcuts"
            className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors text-lg leading-none"
          >
            x
          </button>
        </div>

        <div className="overflow-auto px-5 py-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.rows.map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-stone-500 dark:text-stone-400">{row.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {row.keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          {ki > 0 && <span className="text-stone-300 dark:text-stone-600 text-[10px]">+</span>}
                          <kbd className={keyClass}>{k}</kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-stone-100 dark:border-stone-700 shrink-0">
          <p className="text-[10px] text-stone-400 dark:text-stone-500">
            Press <kbd className={keyClass}>?</kbd> or <kbd className={keyClass}>Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
