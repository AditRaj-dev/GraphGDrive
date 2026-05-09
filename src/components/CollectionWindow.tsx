import { useCallback, useRef, useState } from "react";
import type { PreviewKind } from "../types/drive";

const LABEL: Partial<Record<PreviewKind, string>> = {
  image: "Photos", video: "Videos", pdf: "PDFs",
  gdoc: "Docs", gsheet: "Sheets", gslide: "Slides", other: "Files",
};

type FileEntry = { id: string; name: string; thumbnailLink?: string };
type Win = { x: number; y: number; width: number; height: number };

type Props = {
  kind: PreviewKind;
  files: FileEntry[];
  onClose(): void;
  onFileSelect(id: string): void;
};

function Thumb({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const ext = name.split(".").pop()?.toUpperCase().slice(0, 4) ?? "FILE";
  if (!src || failed) {
    return (
      <div className="w-full h-20 bg-stone-100 flex items-center justify-center text-stone-400 text-xs font-medium">
        {ext}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-full h-20 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function CollectionWindow({ kind, files, onClose, onFileSelect }: Props) {
  const [win, setWin] = useState<Win>({ x: 120, y: 80, width: 480, height: 360 });

  // --- drag ---
  const dragStart = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null);

  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, wx: win.x, wy: win.y };
    const move = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      setWin((w) => ({
        ...w,
        x: dragStart.current!.wx + ev.clientX - dragStart.current!.mx,
        y: dragStart.current!.wy + ev.clientY - dragStart.current!.my,
      }));
    };
    const up = () => { dragStart.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [win.x, win.y]);

  // --- resize ---
  type ResizeStart = { dir: string; mx: number; my: number; wx: number; wy: number; ww: number; wh: number };
  const resizeStart = useRef<ResizeStart | null>(null);

  const onResizeMouseDown = useCallback((dir: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { dir, mx: e.clientX, my: e.clientY, wx: win.x, wy: win.y, ww: win.width, wh: win.height };
    const move = (ev: MouseEvent) => {
      const r = resizeStart.current;
      if (!r) return;
      const dx = ev.clientX - r.mx;
      const dy = ev.clientY - r.my;
      setWin(() => {
        let x = r.wx, y = r.wy, width = r.ww, height = r.wh;
        if (r.dir.includes("e")) width  = Math.max(280, r.ww + dx);
        if (r.dir.includes("s")) height = Math.max(200, r.wh + dy);
        if (r.dir.includes("w")) { width  = Math.max(280, r.ww - dx); x = r.wx + r.ww - width; }
        if (r.dir.includes("n")) { height = Math.max(200, r.wh - dy); y = r.wy + r.wh - height; }
        return { x, y, width, height };
      });
    };
    const up = () => { resizeStart.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [win]);

  const label = LABEL[kind] ?? "Files";

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden select-none"
      style={{ left: win.x, top: win.y, width: win.width, height: win.height }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-stone-50 border-b border-stone-200 cursor-move shrink-0"
        onMouseDown={onTitleMouseDown}
      >
        <span className="font-semibold text-sm text-stone-700">{label}</span>
        <span className="text-xs text-stone-400 tabular-nums">{files.length}</span>
        <button
          className="ml-auto w-5 h-5 rounded-full bg-rose-400 hover:bg-rose-500 flex items-center justify-center text-white text-[11px] leading-none transition-colors"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* File grid */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
          {files.map((f) => (
            <div
              key={f.id}
              className="rounded-lg border border-stone-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
              onClick={() => onFileSelect(f.id)}
            >
              <Thumb src={f.thumbnailLink} name={f.name} />
              <p className="text-[10px] text-stone-600 px-1.5 py-1 truncate">{f.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edge resize handles */}
      <div className="absolute inset-x-0 bottom-0 h-1.5 cursor-s-resize" onMouseDown={onResizeMouseDown("s")} />
      <div className="absolute inset-x-0 top-0  h-1.5 cursor-n-resize" onMouseDown={onResizeMouseDown("n")} />
      <div className="absolute inset-y-0 left-0  w-1.5 cursor-w-resize" onMouseDown={onResizeMouseDown("w")} />
      <div className="absolute inset-y-0 right-0 w-1.5 cursor-e-resize" onMouseDown={onResizeMouseDown("e")} />
      {/* Corner resize handles */}
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={onResizeMouseDown("se")} />
      <div className="absolute bottom-0 left-0  w-4 h-4 cursor-sw-resize" onMouseDown={onResizeMouseDown("sw")} />
      <div className="absolute top-0    right-0 w-4 h-4 cursor-ne-resize" onMouseDown={onResizeMouseDown("ne")} />
      <div className="absolute top-0    left-0  w-4 h-4 cursor-nw-resize" onMouseDown={onResizeMouseDown("nw")} />
    </div>
  );
}
