import { Handle, Position } from "@xyflow/react";

export type FolderNodeData = { name: string; expanded: boolean; loaded: boolean };

export default function FolderNode({ data }: { data: unknown }) {
  const nodeData = data as FolderNodeData;
  return (
    <div className="px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-sm shadow-sm w-[200px] cursor-pointer select-none">
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !border-amber-600" />
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          {nodeData.expanded
            ? <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            : <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />}
        </svg>
        <span className="truncate font-medium text-stone-700 dark:text-stone-200">{nodeData.name}</span>
      </div>
      {!nodeData.loaded && <div className="text-xs text-amber-600 mt-1">click to expand</div>}
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !border-amber-600" />
    </div>
  );
}
