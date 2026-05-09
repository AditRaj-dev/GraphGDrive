import { Handle, Position } from "@xyflow/react";

export type MoreNodeData = { count: number };

export default function MoreNode({ data }: { data: unknown }) {
  const { count } = data as MoreNodeData;
  return (
    <div className="w-[200px] px-3 py-2 rounded-md border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-500 cursor-pointer hover:bg-stone-100 hover:border-stone-400 hover:text-stone-700 transition-colors select-none text-center">
      <Handle type="target" position={Position.Left} className="!bg-stone-400" />
      … {count} more — click to show
    </div>
  );
}
