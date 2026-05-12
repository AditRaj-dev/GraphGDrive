import { Handle, Position } from "@xyflow/react";

export type MoreNodeData = { count: number };

export default function MoreNode({ data }: { data: unknown }) {
  const { count } = data as MoreNodeData;
  return (
    <div className="w-[200px] px-3 py-2 rounded-md border border-dashed border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 text-xs text-stone-500 dark:text-stone-400 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors select-none text-center">
      <Handle type="target" position={Position.Left} className="!bg-stone-400" />
      … {count} more — click to show
    </div>
  );
}
