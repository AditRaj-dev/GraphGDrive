import { Handle, Position } from "@xyflow/react";
import type { PreviewKind } from "../../types/drive";

export type FileNodeData = { name: string; kind: PreviewKind; selected: boolean; thumbnailLink?: string };

const KIND_COLORS: Record<PreviewKind, string> = {
  folder: "border-amber-300",
  image: "border-sky-300",
  video: "border-violet-300",
  pdf: "border-rose-300",
  gdoc: "border-blue-300",
  gsheet: "border-green-300",
  gslide: "border-orange-300",
  other: "border-stone-300",
};

const KIND_LABEL: Record<PreviewKind, string> = {
  folder: "folder", image: "img", video: "vid", pdf: "pdf",
  gdoc: "doc", gsheet: "sheet", gslide: "slide", other: "file",
};

const hasThumbnail = (kind: PreviewKind) => kind === "image" || kind === "video";

export default function FileNode({ data }: { data: unknown }) {
  const nodeData = data as FileNodeData;
  const showThumb = hasThumbnail(nodeData.kind) && !!nodeData.thumbnailLink;

  return (
    <div className={[
      "rounded-md border text-sm shadow-sm bg-white cursor-pointer select-none transition-shadow overflow-hidden",
      showThumb ? "w-[180px]" : "min-w-[150px] px-3 py-2",
      KIND_COLORS[nodeData.kind],
      nodeData.selected ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-md",
    ].join(" ")}>
      <Handle type="target" position={Position.Top} className="!bg-stone-400" />

      {/* Thumbnail */}
      {showThumb && (
        <div className="relative w-full h-24 bg-stone-100 overflow-hidden">
          <img
            src={nodeData.thumbnailLink}
            alt={nodeData.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget.parentElement!).style.display = "none"; }}
          />
          {nodeData.kind === "video" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                  <polygon points="3,1 11,6 3,11" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Label row */}
      <div className={["flex items-center gap-2", showThumb ? "px-2 py-1.5" : ""].join(" ")}>
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 shrink-0">
          {KIND_LABEL[nodeData.kind]}
        </span>
        <span className="truncate text-stone-700 text-xs">{nodeData.name}</span>
      </div>
    </div>
  );
}
