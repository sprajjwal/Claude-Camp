import { useRef, type KeyboardEvent, type PointerEvent } from "react";

const KEY_STEP = 24; // px per arrow-key press

interface Props {
  /** "vertical" is a bar you drag sideways (changes a width); "horizontal" is dragged up and down (changes a height) */
  orientation: "vertical" | "horizontal";
  value: number;
  min: number;
  max: number;
  /** +1 if dragging towards the right/bottom makes the thing bigger, -1 if it makes it smaller */
  direction: 1 | -1;
  label: string;
  onChange: (value: number) => void;
}

/** Draggable and keyboard-operable separator (arrow keys, Home/End). */
export function ResizeHandle({ orientation, value, min, max, direction, label, onChange }: Props) {
  const start = useRef<{ pointer: number; value: number } | null>(null);
  const horizontal = orientation === "horizontal";
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const pos = (e: PointerEvent) => (horizontal ? e.clientY : e.clientX);

  const onKey = (e: KeyboardEvent) => {
    const grow = horizontal ? "ArrowDown" : "ArrowRight";
    const shrink = horizontal ? "ArrowUp" : "ArrowLeft";
    if (e.key === "Home") onChange(min);
    else if (e.key === "End") onChange(max);
    else if (e.key === grow) onChange(clamp(value + direction * KEY_STEP));
    else if (e.key === shrink) onChange(clamp(value - direction * KEY_STEP));
    else return;
    e.preventDefault();
  };

  return (
    <div
      className={`resize-handle ${orientation}`}
      role="separator"
      aria-orientation={orientation}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { pointer: pos(e), value };
      }}
      onPointerMove={(e) => {
        if (start.current) onChange(clamp(start.current.value + direction * (pos(e) - start.current.pointer)));
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
    />
  );
}
