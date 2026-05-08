import { Handle, Position } from "@xyflow/react";
import type { PreviewKind } from "../../types/drive";

export type FileNodeData = { name: string; kind: PreviewKind; selected: boolean };

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

export default function FileNode({ data }: { data: unknown }) {
  const nodeData = data as FileNodeData;
  return (
    <div className={[
      "px-3 py-2 rounded-md border text-sm shadow-sm min-w-[150px] bg-white cursor-pointer select-none transition-shadow",
      KIND_COLORS[nodeData.kind],
      nodeData.selected ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-md",
    ].join(" ")}>
      <Handle type="target" position={Position.Top} className="!bg-stone-400" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 shrink-0">
          {KIND_LABEL[nodeData.kind]}
        </span>
        <span className="truncate text-stone-700">{nodeData.name}</span>
      </div>
    </div>
  );
}
