"use client";

import { useCallback, useEffect, useRef } from "react";

import { experiments } from "@/lib/laboratory.ts";
import type { BoardEdge, BoardNode } from "@/lib/board/types";
import type { UserEdge } from "@/lib/board/localBoard";

import {
  CARD_H,
  CARD_W,
  DEFAULT_SCALE_FLOOR,
  DEFAULT_VIEW_BOUNDS,
  HUB_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  categoryCode,
  categoryLabel,
  clampScale,
  fitTransform,
} from "./boardLayout";

export interface Transform {
  panX: number;
  panY: number;
  scale: number;
}

export function defaultTransform(viewport: { width: number; height: number }): Transform {
  return fitTransform(DEFAULT_VIEW_BOUNDS, viewport, 60, DEFAULT_SCALE_FLOOR);
}

function nodeCenter(node: BoardNode, positions: Record<string, { x: number; y: number }>) {
  return positions[node.id] ?? { x: node.x, y: node.y };
}

const numeralForSlug = new Map(experiments.map((e) => [e.slug, e.numeral]));

export function BoardCanvas({
  nodes,
  edges,
  userEdges,
  positions,
  onMoveNode,
  selectedNodeId,
  selectedEdgeId,
  onSelectNode,
  onSelectEdge,
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
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
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
      if (!drag.moved) onSelectNode(node.id);
    },
    [onSelectNode],
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
      aria-label="Investigation board canvas. Drag to rearrange, scroll to zoom. Use the list view toggle for a keyboard-friendly alternative."
      className="relative h-[72vh] min-h-[460px] touch-none overflow-hidden border border-rule bg-surface/25 select-none"
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={endViewportPan}
      onPointerCancel={endViewportPan}
      onWheel={handleWheel}
    >
      {/* A faint registration grid — archival, not decorative noise. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden="true">
        <defs>
          <pattern id="board-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="var(--color-rule-soft)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#board-grid)" />
      </svg>

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
        >
          <g aria-hidden="true">
            {edges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.from);
              const to = nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const a = nodeCenter(from, positions);
              const b = nodeCenter(to, positions);
              const dimmed = isDimmed(edge.from) || isDimmed(edge.to);
              const active =
                highlightIds !== null && highlightIds.has(edge.from) && highlightIds.has(edge.to);
              const chosen = edge.id === selectedEdgeId;
              return (
                <g key={edge.id}>
                  {/* Wide, invisible hit area so a thin line stays easy to click. */}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth={16}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onSelectEdge(edge.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={chosen || active ? "var(--color-accent)" : "var(--color-ink-muted)"}
                    strokeWidth={chosen ? 2.5 : active ? 2 : 1.25}
                    opacity={dimmed ? 0.22 : chosen ? 1 : active ? 0.95 : 0.6}
                    pointerEvents="none"
                  />
                  {!dimmed ? (
                    <>
                      <circle cx={a.x} cy={a.y} r={chosen || active ? 3 : 2} fill="var(--color-ink-muted)" opacity={0.7} pointerEvents="none" />
                      <circle cx={b.x} cy={b.y} r={chosen || active ? 3 : 2} fill="var(--color-ink-muted)" opacity={0.7} pointerEvents="none" />
                    </>
                  ) : null}
                </g>
              );
            })}
            {userEdges.map((edge) => {
              const from = nodes.find((n) => n.id === edge.from);
              const to = nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const a = nodeCenter(from, positions);
              const b = nodeCenter(to, positions);
              const chosen = edge.id === selectedEdgeId;
              return (
                <g key={edge.id}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth={16}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onSelectEdge(edge.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="var(--color-accent-soft)"
                    strokeWidth={chosen ? 2.25 : 1.5}
                    strokeDasharray="6 5"
                    opacity={chosen ? 1 : 0.85}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {nodes.map((node, index) => {
          const center = nodeCenter(node, positions);
          const isConcept = node.category === "concept";
          const isBook = node.category === "book";
          const isLab = node.category === "laboratory";
          const size = isConcept ? HUB_SIZE : undefined;
          const dimmed = isDimmed(node.id);
          const selected = node.id === selectedNodeId;
          const isConnectTarget = connectFrom !== null && connectFrom !== node.id;
          const numeral = isLab ? numeralForSlug.get(node.id.replace("laboratory/", "")) : undefined;

          return (
            <button
              key={node.id}
              type="button"
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onPointerUp={(e) => handleNodePointerUp(e, node)}
              aria-pressed={selected}
              aria-label={`${categoryLabel[node.category]}: ${node.title}`}
              className={`absolute flex flex-col justify-center text-left font-sans shadow-sm transition-[opacity,border-color,box-shadow] ${
                isConcept
                  ? "items-center rounded-full border-2 text-center"
                  : isBook
                    ? "items-start border-y border-r border-l-[3px] pr-3 pl-4"
                    : "items-start rounded-[2px] border px-4"
              } py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? "border-accent bg-paper shadow-md ring-1 ring-accent/40"
                  : isConnectTarget
                    ? "border-dashed border-accent-soft bg-surface text-ink"
                    : "border-rule bg-paper/[0.97] text-ink hover:border-accent-soft hover:shadow-md"
              }`}
              style={{
                left: center.x,
                top: center.y,
                width: size ?? CARD_W,
                height: size ?? CARD_H,
                transform: "translate(-50%, -50%)",
                opacity: dimmed ? 0.55 : 1,
                cursor: "grab",
                zIndex: selected ? 5 : dimmed ? 1 : 2,
              }}
            >
              {!isConcept ? (
                <span className="pointer-events-none absolute top-1.5 right-2 font-sans text-[0.625rem] tracking-[0.08em] text-ink-muted/70 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              ) : null}
              <span className="label flex items-center gap-1.5 text-ink-muted">
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[0.5625rem] leading-none">
                  {categoryCode[node.category]}
                </span>
                {isLab && numeral ? <span className="text-ink-muted">{numeral}</span> : null}
                {!isConcept ? <span className="line-clamp-1">{categoryLabel[node.category]}</span> : null}
              </span>
              <span
                className={`mt-1 line-clamp-2 leading-[1.22] font-medium text-ink ${
                  isConcept ? "font-serif text-[0.9375rem]" : "font-serif text-[1rem]"
                }`}
              >
                {node.title}
              </span>
              {!isConcept ? (
                <span className="mt-1 line-clamp-1 font-sans text-[0.6875rem] leading-tight text-ink-soft">
                  {node.subtitle}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-3 max-w-[22rem] font-sans text-[0.6875rem] leading-snug text-ink-muted italic">
        Drag to rearrange · Scroll to zoom · Select a connection to see why it exists.
      </p>
    </div>
  );
}
