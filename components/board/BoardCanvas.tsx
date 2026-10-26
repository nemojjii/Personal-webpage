"use client";

import { useCallback, useEffect, useRef } from "react";

import type { BoardEdge, BoardNode } from "@/lib/board/types";
import type { UserEdge } from "@/lib/board/localBoard";

import { WORLD_HEIGHT, WORLD_WIDTH, categoryLabel, clampScale, fitTransform } from "./boardLayout";

const CARD_W = 168;
const CARD_H = 64;
const HUB_SIZE = 96;

export interface Transform {
  panX: number;
  panY: number;
  scale: number;
}

export function defaultTransform(viewport: { width: number; height: number }): Transform {
  return fitTransform({ minX: 0, minY: 0, maxX: WORLD_WIDTH, maxY: WORLD_HEIGHT }, viewport, 40);
}

function nodeCenter(node: BoardNode, positions: Record<string, { x: number; y: number }>) {
  return positions[node.id] ?? { x: node.x, y: node.y };
}

export function BoardCanvas({
  nodes,
  edges,
  userEdges,
  positions,
  onMoveNode,
  selectedId,
  onSelect,
  highlightIds,
  dimOthers,
  transform,
  onTransformChange,
  connectFrom,
  onViewportResize,
}: {
  nodes: BoardNode[];
  edges: BoardEdge[];
  userEdges: UserEdge[];
  positions: Record<string, { x: number; y: number }>;
  onMoveNode: (id: string, x: number, y: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  highlightIds: Set<string> | null;
  dimOthers: boolean;
  transform: Transform;
  onTransformChange: (t: Transform) => void;
  connectFrom: string | null;
  onViewportResize?: (size: { width: number; height: number }) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !onViewportResize) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) onViewportResize({ width, height });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [onViewportResize]);
  const panState = useRef<{ pointerId: number; startX: number; startY: number; origin: Transform } | null>(
    null,
  );
  const dragState = useRef<{
    pointerId: number;
    id: string;
    startScreenX: number;
    startScreenY: number;
    startWorld: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  const handleViewportPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      panState.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origin: transform };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform],
  );

  const handleViewportPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pan = panState.current;
      if (pan && pan.pointerId === e.pointerId) {
        onTransformChange({
          ...pan.origin,
          panX: pan.origin.panX + (e.clientX - pan.startX),
          panY: pan.origin.panY + (e.clientY - pan.startY),
        });
        return;
      }
      const drag = dragState.current;
      if (drag && drag.pointerId === e.pointerId) {
        const dx = (e.clientX - drag.startScreenX) / transform.scale;
        const dy = (e.clientY - drag.startScreenY) / transform.scale;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
        onMoveNode(drag.id, drag.startWorld.x + dx, drag.startWorld.y + dy);
      }
    },
    [transform.scale, onTransformChange, onMoveNode],
  );

  const endViewportPan = useCallback((e: React.PointerEvent) => {
    if (panState.current?.pointerId === e.pointerId) panState.current = null;
  }, []);

  const handleNodePointerDown = useCallback(
    (e: React.PointerEvent, node: BoardNode) => {
      e.stopPropagation();
      const center = nodeCenter(node, positions);
      dragState.current = {
        pointerId: e.pointerId,
        id: node.id,
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        startWorld: center,
        moved: false,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [positions],
  );

  const handleNodePointerUp = useCallback(
    (e: React.PointerEvent, node: BoardNode) => {
      const drag = dragState.current;
      dragState.current = null;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (!drag.moved) onSelect(node.id);
    },
    [onSelect],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const nextScale = clampScale(transform.scale * (e.deltaY > 0 ? 0.9 : 1.1));
      const worldX = (cursorX - transform.panX) / transform.scale;
      const worldY = (cursorY - transform.panY) / transform.scale;
      onTransformChange({
        scale: nextScale,
        panX: cursorX - worldX * nextScale,
        panY: cursorY - worldY * nextScale,
      });
    },
    [transform, onTransformChange],
  );

  const isDimmed = (id: string) => dimOthers && highlightIds !== null && !highlightIds.has(id);

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label="Investigation board canvas. Use the list view toggle for a keyboard-friendly alternative."
      className="relative h-[70vh] min-h-[420px] touch-none overflow-hidden border border-rule bg-surface/30 select-none"
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={endViewportPan}
      onPointerCancel={endViewportPan}
      onWheel={handleWheel}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `translate(${transform.panX}px, ${transform.panY}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <svg
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
          className="absolute top-0 left-0 overflow-visible"
          aria-hidden="true"
        >
          {edges.map((edge) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const a = nodeCenter(from, positions);
            const b = nodeCenter(to, positions);
            const dimmed = isDimmed(edge.from) || isDimmed(edge.to);
            const active = highlightIds !== null && highlightIds.has(edge.from) && highlightIds.has(edge.to);
            return (
              <line
                key={edge.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={active ? "var(--color-accent)" : "var(--color-rule)"}
                strokeWidth={active ? 1.75 : 1}
                opacity={dimmed ? 0.15 : active ? 0.9 : 0.55}
              />
            );
          })}
          {userEdges.map((edge) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            const a = nodeCenter(from, positions);
            const b = nodeCenter(to, positions);
            return (
              <line
                key={edge.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-accent-soft)"
                strokeWidth={1.25}
                strokeDasharray="5 4"
                opacity={0.8}
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const center = nodeCenter(node, positions);
          const isConcept = node.category === "concept";
          const size = isConcept ? HUB_SIZE : undefined;
          const dimmed = isDimmed(node.id);
          const selected = node.id === selectedId;
          const isConnectTarget = connectFrom !== null && connectFrom !== node.id;
          return (
            <button
              key={node.id}
              type="button"
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onPointerUp={(e) => handleNodePointerUp(e, node)}
              aria-pressed={selected}
              aria-label={`${categoryLabel[node.category]}: ${node.title}`}
              className={`absolute flex flex-col items-center justify-center border px-3 py-2 text-center font-sans shadow-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isConcept ? "rounded-full" : "rounded-[2px]"
              } ${
                selected
                  ? "border-accent bg-surface text-ink"
                  : isConnectTarget
                    ? "border-dashed border-accent-soft bg-surface/90 text-ink"
                    : "border-rule bg-paper/95 text-ink hover:border-accent-soft"
              }`}
              style={{
                left: center.x,
                top: center.y,
                width: size ?? CARD_W,
                height: size ?? CARD_H,
                transform: "translate(-50%, -50%)",
                opacity: dimmed ? 0.3 : 1,
                cursor: "grab",
              }}
            >
              <span className="label line-clamp-1 text-ink-muted">{categoryLabel[node.category]}</span>
              <span className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-[1.2] font-medium">
                {node.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
