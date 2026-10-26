"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { experiments } from "@/lib/laboratory.ts";
import type { BoardEdge, BoardNode } from "@/lib/board/types";
import type { UserEdge } from "@/lib/board/localBoard";

import {
  CARD_SIZE,
  DEFAULT_SCALE_FLOOR,
  DEFAULT_VIEW_BOUNDS,
  HUB_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  categoryCode,
  categoryLabel,
  clampScale,
  fitTransform,
  neighborhoodLabels,
} from "./boardLayout";
import { INSTRUMENT_GLYPH_VIEWBOX, instrumentGlyphs } from "./instrumentGlyphs";

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

const EDGE_KIND_DASH: Record<string, string | undefined> = {
  mathematical: undefined,
  conceptual: undefined,
  thematic: "1 4",
  personal: "1 3 6 3",
};

function ArchivalNumber({ index }: { index: number }) {
  return (
    <span className="pointer-events-none absolute top-1.5 right-2 font-sans text-[0.625rem] tracking-[0.08em] text-ink-muted/70 tabular-nums">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

function CategoryMark({ node }: { node: BoardNode }) {
  return (
    <span className="label flex items-center gap-1.5 text-ink-muted">
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[0.5625rem] leading-none">
        {categoryCode[node.category]}
      </span>
      <span className="line-clamp-1">{categoryLabel[node.category]}</span>
    </span>
  );
}

function BookCardContents({ node, index }: { node: BoardNode; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showCover = node.coverImage && !imageFailed;
  return (
    <>
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-accent/60" aria-hidden="true" />
      <ArchivalNumber index={index} />
      {showCover ? (
        // Decorative: the title and author beneath already name the book for assistive technology.
        <div className="relative h-[72%] w-full border border-rule-soft" aria-hidden="true">
          <Image
            src={node.coverImage!}
            alt=""
            fill
            sizes="110px"
            className="object-cover"
            // Not lazy: inside a CSS-transformed, panned canvas, the browser's
            // native viewport-intersection check for `loading="lazy"` does not
            // reliably fire, so the one small cover on this board loads eagerly.
            priority
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <span className="h-[72%] w-full border border-rule-soft bg-surface" aria-hidden="true" />
      )}
      <span className="mt-1.5 line-clamp-1 font-serif text-[0.875rem] leading-tight font-medium text-ink">
        {node.title}
      </span>
      <span className="line-clamp-1 font-sans text-[0.625rem] text-ink-soft italic">{node.subtitle}</span>
    </>
  );
}

function NodeCardContents({ node, index }: { node: BoardNode; index: number }) {
  switch (node.category) {
    case "research":
      return (
        <>
          <span className="pointer-events-none absolute top-0 left-0 h-[3px] w-full bg-accent/70" aria-hidden="true" />
          <ArchivalNumber index={index} />
          <CategoryMark node={node} />
          <span className="mt-1.5 line-clamp-3 font-serif text-[1.0625rem] leading-[1.22] font-medium text-ink">
            {node.title}
          </span>
          <span className="mt-auto line-clamp-2 border-t border-rule-soft pt-1.5 font-sans text-[0.6875rem] leading-tight text-ink-soft italic">
            {node.subtitle}
          </span>
        </>
      );

    case "laboratory": {
      const numeral = numeralForSlug.get(node.id.replace("laboratory/", ""));
      const glyph = instrumentGlyphs[node.id];
      return (
        <>
          <ArchivalNumber index={index} />
          <span className="label flex items-center gap-1.5 text-ink-muted">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[0.5625rem] leading-none">
              {categoryCode.laboratory}
            </span>
            {numeral ? <span className="font-serif text-ink-soft">{numeral}</span> : null}
            <span className="line-clamp-1">Instrument</span>
          </span>
          {glyph ? (
            <svg viewBox={INSTRUMENT_GLYPH_VIEWBOX} className="mt-1 h-7 w-full" aria-hidden="true" preserveAspectRatio="none">
              <path d={glyph} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.8" />
            </svg>
          ) : null}
          <span className="mt-auto line-clamp-2 font-serif text-[0.9375rem] leading-[1.2] font-medium text-ink">
            {node.title}
          </span>
        </>
      );
    }

    case "project": {
      const glyph = instrumentGlyphs[node.id];
      return (
        <>
          <ArchivalNumber index={index} />
          <CategoryMark node={node} />
          <span className="mt-1.5 line-clamp-2 font-serif text-[1rem] leading-[1.22] font-medium text-ink">
            {node.title}
          </span>
          {glyph ? (
            <svg viewBox={INSTRUMENT_GLYPH_VIEWBOX} className="mt-auto h-6 w-full opacity-70" aria-hidden="true" preserveAspectRatio="none">
              <path d={glyph} fill="none" stroke="var(--color-accent-soft)" strokeWidth="1.25" />
            </svg>
          ) : (
            <span className="mt-auto line-clamp-1 font-sans text-[0.6875rem] leading-tight text-ink-soft">
              {node.subtitle}
            </span>
          )}
        </>
      );
    }

    case "book":
      return <BookCardContents node={node} index={index} />;

    case "concept":
      return (
        <>
          <span
            className="pointer-events-none absolute inset-[6px] rounded-full border border-rule-soft"
            aria-hidden="true"
          />
          <span className="label text-ink-muted">{categoryCode.concept}</span>
          <span className="mt-1 line-clamp-3 px-3 text-center font-serif text-[1rem] leading-[1.18] font-medium text-ink">
            {node.title}
          </span>
        </>
      );

    default:
      return null;
  }
}

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
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

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
        {/* Faint neighborhood labels — organisational, not a claim of connection. */}
        {neighborhoodLabels.map((label) => (
          <span
            key={label.text}
            aria-hidden="true"
            className="pointer-events-none absolute font-sans text-[0.8125rem] font-medium tracking-[0.16em] text-ink-muted/35 uppercase"
            style={{ left: label.x, top: label.y }}
          >
            {label.text}
          </span>
        ))}

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
              const showLabel = chosen || edge.id === hoveredEdgeId;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
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
                    onPointerEnter={() => setHoveredEdgeId(edge.id)}
                    onPointerLeave={() => setHoveredEdgeId((id) => (id === edge.id ? null : id))}
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
                    strokeDasharray={EDGE_KIND_DASH[edge.kind]}
                    opacity={dimmed ? 0.22 : chosen ? 1 : active ? 0.95 : 0.6}
                    pointerEvents="none"
                  />
                  {!dimmed ? (
                    <>
                      <circle cx={a.x} cy={a.y} r={chosen || active ? 3 : 2} fill="var(--color-ink-muted)" opacity={0.7} pointerEvents="none" />
                      <circle cx={b.x} cy={b.y} r={chosen || active ? 3 : 2} fill="var(--color-ink-muted)" opacity={0.7} pointerEvents="none" />
                    </>
                  ) : null}
                  {showLabel ? (
                    <g pointerEvents="none">
                      <rect
                        x={mx - 42}
                        y={my - 9}
                        width={84}
                        height={16}
                        fill="var(--color-paper)"
                        stroke="var(--color-accent)"
                        strokeWidth={0.75}
                      />
                      <text
                        x={mx}
                        y={my + 3}
                        textAnchor="middle"
                        fontSize="9"
                        letterSpacing="0.08em"
                        fill="var(--color-accent)"
                        style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}
                      >
                        {edge.kind}
                      </text>
                    </g>
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
          const size = isConcept ? { w: HUB_SIZE, h: HUB_SIZE } : CARD_SIZE[node.category];
          const dimmed = isDimmed(node.id);
          const selected = node.id === selectedNodeId;
          const isConnectTarget = connectFrom !== null && connectFrom !== node.id;

          return (
            <button
              key={node.id}
              type="button"
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onPointerUp={(e) => handleNodePointerUp(e, node)}
              aria-pressed={selected}
              aria-label={`${categoryLabel[node.category]}: ${node.title}`}
              className={`absolute flex flex-col justify-center overflow-hidden text-left font-sans shadow-sm transition-[opacity,border-color,box-shadow] ${
                isConcept
                  ? "items-center rounded-full border-2 text-center"
                  : isBook
                    ? "items-center border border-rule px-2.5"
                    : "items-start rounded-[2px] border px-3.5"
              } py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? "border-accent bg-paper shadow-md ring-1 ring-accent/40"
                  : isConnectTarget
                    ? "border-dashed border-accent-soft bg-surface text-ink"
                    : "border-rule bg-paper/[0.97] text-ink hover:border-accent-soft hover:shadow-md"
              }`}
              style={{
                left: center.x,
                top: center.y,
                width: size.w,
                height: size.h,
                transform: "translate(-50%, -50%)",
                opacity: dimmed ? 0.55 : 1,
                cursor: "grab",
                zIndex: selected ? 5 : dimmed ? 1 : 2,
              }}
            >
              <NodeCardContents node={node} index={index} />
            </button>
          );
        })}
      </div>

      {/* A soft vignette at the edges — a visual cue that the atlas continues beyond the frame. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: "inset 0 0 70px 10px var(--color-surface)",
          opacity: 0.55,
        }}
      />

      <p className="pointer-events-none absolute bottom-3 left-3 max-w-[22rem] bg-paper/90 px-2 py-1 font-sans text-[0.6875rem] leading-snug text-ink-muted italic">
        Drag to rearrange · Scroll to zoom · Select a connection to see why it exists.
      </p>
    </div>
  );
}
