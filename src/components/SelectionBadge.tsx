import { useRef } from "react";

type Props = {
  onShake(): void;
  className?: string;
};

type DragState = {
  lastX: number;
  direction: -1 | 0 | 1;
  flips: number;
  distance: number;
  triggered: boolean;
};

const SHAKE_FLIPS = 3;
const SHAKE_DISTANCE = 26;

export default function SelectionBadge({ onShake, className = "" }: Props) {
  const drag = useRef<DragState | null>(null);

  return (
    <div
      title="Drag and shake to remove from selection"
      className={[
        "w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none",
        className,
      ].join(" ")}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
          lastX: e.clientX,
          direction: 0,
          flips: 0,
          distance: 0,
          triggered: false,
        };
      }}
      onPointerMove={(e) => {
        const state = drag.current;
        if (!state || state.triggered) return;

        const dx = e.clientX - state.lastX;
        const nextDirection = Math.abs(dx) < 3 ? state.direction : dx > 0 ? 1 : -1;
        state.distance += Math.abs(dx);
        state.lastX = e.clientX;

        if (nextDirection !== 0 && state.direction !== 0 && nextDirection !== state.direction) {
          state.flips += 1;
        }
        state.direction = nextDirection;

        if (state.flips >= SHAKE_FLIPS && state.distance >= SHAKE_DISTANCE) {
          state.triggered = true;
          onShake();
        }
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1,4 3,6 7,2" />
      </svg>
    </div>
  );
}
