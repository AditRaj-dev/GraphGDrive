import { Handle, Position } from "@xyflow/react";
import type { PreviewKind } from "../../types/drive";
import RetryingThumbnail from "../RetryingThumbnail";

export type GroupNodeData = {
  kind: PreviewKind;
  count: number;
  thumbnails: string[];
};

const LABEL: Partial<Record<PreviewKind, string>> = {
  image: "Photos", video: "Videos", pdf: "PDFs",
  gdoc: "Docs", gsheet: "Sheets", gslide: "Slides", other: "Files",
};

const COLORS: Partial<Record<PreviewKind, string>> = {
  image:  "border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300",
  video:  "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300",
  pdf:    "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300",
  gdoc:   "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  gsheet: "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  gslide: "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
  other:  "border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
};

const BADGE: Partial<Record<PreviewKind, string>> = {
  image:  "bg-sky-100 dark:bg-sky-800/50 text-sky-600 dark:text-sky-300",
  video:  "bg-violet-100 dark:bg-violet-800/50 text-violet-600 dark:text-violet-300",
  pdf:    "bg-rose-100 dark:bg-rose-800/50 text-rose-600 dark:text-rose-300",
  gdoc:   "bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300",
  gsheet: "bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-300",
  gslide: "bg-orange-100 dark:bg-orange-800/50 text-orange-600 dark:text-orange-300",
  other:  "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400",
};

function ThumbSlot({ source }: { source: string }) {
  return (
    <RetryingThumbnail
      srcs={[source]}
      alt=""
      className="flex-1 object-cover min-w-0"
      fallback={<div className="flex-1 bg-current opacity-5" />}
    />
  );
}

function ThumbStrip({ thumbnails }: { thumbnails: string[] }) {
  const slots = thumbnails.slice(0, 3);
  const placeholders = Math.max(0, 3 - slots.length);

  return (
    <div className="flex h-14 overflow-hidden border-b border-current/10">
      {slots.map((source, i) => <ThumbSlot key={i} source={source} />)}
      {Array.from({ length: placeholders }).map((_, i) => (
        <div key={`ph-${i}`} className="flex-1 bg-current opacity-5" />
      ))}
    </div>
  );
}

export default function GroupNode({ data }: { data: unknown }) {
  const { kind, count, thumbnails } = data as GroupNodeData;
  const color = COLORS[kind] ?? COLORS.other!;
  const badge = BADGE[kind] ?? BADGE.other!;
  const label = LABEL[kind] ?? "Files";
  const hasThumbs = thumbnails.length > 0;

  return (
    <div className={`rounded-md border shadow-sm w-[200px] cursor-zoom-in select-none overflow-hidden transition-shadow hover:shadow-md ${color}`}>
      <Handle type="target" position={Position.Left} className="!bg-stone-400 !border-stone-500" />

      {/* Thumbnail strip — 3 side-by-side images */}
      {hasThumbs && <ThumbStrip thumbnails={thumbnails} />}

      {/* Label row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <KindIcon kind={kind} />
        <span className="font-medium text-sm">{label}</span>
        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${badge}`}>
          {count}
        </span>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: PreviewKind }) {
  switch (kind) {
    case "image": return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
    case "video": return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    );
    case "pdf": return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
    default: return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  }
}
