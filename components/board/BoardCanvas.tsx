"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { experiments } from "@/lib/laboratory.ts";
import type { BoardEdge, BoardNode } from "@/lib/board/types";
import type { UserEdge } from "@/lib/board/localBoard";

import {
  DEFAULT_SCALE_FLOOR,
  DEFAULT_VIEW_BOUNDS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  categoryCode,
  categoryLabel,
  clampScale,
  fitTransform,
  neighborhoodLabels,
  rotationFor,
  sizeFor,
  tapeFor,
  threadSagFor,
  tierOf,
  wobbleCirclePath,
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

/** Where a thread pins to a node — near the top edge for a physical artifact, the true centre for a concept anchor. */
function anchorPoint(node: BoardNode, center: { x: number; y: number }): { x: number; y: number } {
  if (node.category === "concept") return center;
  const size = sizeFor(node.id, node.category);
  return { x: center.x, y: center.y - size.h / 2 + 9 };
}

/** Where the decorative pin sits — every artifact gets one, pinned or not, concept notes included. */
function pinPoint(node: BoardNode, center: { x: number; y: number }): { x: number; y: number } {
  const size = sizeFor(node.id, node.category);
  return { x: center.x, y: center.y - size.h / 2 + 8 };
}

function threadPath(a: { x: number; y: number }, b: { x: number; y: number }, sag: number): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + sag;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
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

/**
 * A second and third sheet peeking out behind a research document — several
 * pages, not one card. Rendered as a sibling of the card button, in the
 * same coordinate space, so it can extend past the top sheet's edges
 * without being clipped by the card's own overflow-hidden.
 */
function LayeredPages({
  center,
  size,
  rotation,
  dimmed,
}: {
  center: { x: number; y: number };
  size: { w: number; h: number };
  rotation: number;
  dimmed: boolean;
}) {
  return (
    <>
      {[
        { dx: 5, dy: 6, extra: 2.3 },
        { dx: 2.5, dy: 3.5, extra: 1.1 },
      ].map(({ dx, dy, extra }, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="pointer-events-none absolute border border-rule bg-paper"
          style={{
            left: center.x,
            top: center.y,
            width: size.w,
            height: size.h,
            opacity: dimmed ? 0.4 : 1,
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rotation + extra}deg)`,
            zIndex: 1,
          }}
        />
      ))}
    </>
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
      <ArchivalNumber index={index} />
      {showCover ? (
        // Decorative: the title and author beneath already name the book for assistive technology.
        <div className="relative h-[70%] w-full border-[3px] border-paper bg-paper shadow-[0_1px_3px_rgba(0,0,0,0.25)]" aria-hidden="true">
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
        <span className="h-[70%] w-full border border-rule-soft bg-surface" aria-hidden="true" />
      )}
      <span className="mt-1.5 line-clamp-1 font-serif text-[0.875rem] leading-tight font-medium text-ink">
        {node.title}
      </span>
      <span className="line-clamp-1 font-sans text-[0.625rem] text-ink-soft italic">{node.subtitle}</span>
    </>
  );
}

function NodeCardContents({ node, index, selected }: { node: BoardNode; index: number; selected: boolean }) {
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
            <svg viewBox={INSTRUMENT_GLYPH_VIEWBOX} className="mt-1 h-9 w-full" aria-hidden="true" preserveAspectRatio="none">
              <path d={glyph} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.85" />
            </svg>
          ) : null}
          <span className="mt-auto line-clamp-1 font-serif text-[0.9375rem] leading-[1.2] font-medium text-ink">
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

    case "concept": {
      const size = sizeFor(node.id, node.category);
      const r = size.w / 2 - 7;
      const path = wobbleCirclePath(size.w / 2, size.h / 2, r, node.id);
      return (
        <>
          <svg
            viewBox={`0 0 ${size.w} ${size.h}`}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path
              d={path}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={selected ? 2 : 1.25}
              opacity={selected ? 0.95 : 0.65}
            />
          </svg>
          <span className="label text-ink-muted">{categoryCode.concept}</span>
          <span className="mt-1 line-clamp-3 px-3 text-center font-serif text-[1.0625rem] leading-[1.2] font-medium text-ink">
            {node.title}
          </span>
        </>
      );
    }

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
  onSelectNode: (id: string, originRect?: DOMRect) => void;
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
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
      setDraggingId(node.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [positions],
  );

  const handleNodePointerUp = useCallback(
    (e: React.PointerEvent, node: BoardNode) => {
      const drag = dragState.current;
      dragState.current = null;
      setDraggingId(null);
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (!drag.moved) onSelectNode(node.id, (e.currentTarget as HTMLElement).getBoundingClientRect());
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
      aria-label="Investigation board canvas — a wall of pinned evidence. Drag to rearrange, scroll to zoom. Use the list view toggle for a keyboard-friendly alternative."
      className="relative h-[76vh] min-h-[500px] touch-none overflow-hidden border border-[var(--board-wall-line)] select-none"
      style={{ background: "var(--board-wall)" }}
      onPointerDown={handleViewportPointerDown}
      onPointerMove={handleViewportPointerMove}
      onPointerUp={endViewportPan}
      onPointerCancel={endViewportPan}
      onWheel={handleWheel}
    >
      {/* Wall grain — texture, not a literal corkboard photograph. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden="true">
        <filter id="board-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#board-grain)" />
      </svg>
      {/* A faint dot lattice — a pinboard's own texture, not a decorative grid. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.5]" aria-hidden="true">
        <defs>
          <pattern id="board-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--board-wall-line)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#board-dots)" />
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
              const a = anchorPoint(from, nodeCenter(from, positions));
              const b = anchorPoint(to, nodeCenter(to, positions));
              const dimmed = isDimmed(edge.from) || isDimmed(edge.to);
              const active =
                highlightIds !== null && highlightIds.has(edge.from) && highlightIds.has(edge.to);
              const chosen = edge.id === selectedEdgeId;
              const showLabel = chosen || edge.id === hoveredEdgeId;
              const sag = threadSagFor(edge.id);
              const d = threadPath(a, b, sag);
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2 + sag * 0.5;
              return (
                <g key={edge.id}>
                  {/* Wide, invisible hit area so a thin thread stays easy to click. */}
                  <path
                    data-edge-id={edge.id}
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerEnter={() => setHoveredEdgeId(edge.id)}
                    onPointerLeave={() => setHoveredEdgeId((id) => (id === edge.id ? null : id))}
                    onClick={() => onSelectEdge(edge.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={chosen ? 2.75 : active ? 2.25 : 1.6}
                    strokeDasharray={EDGE_KIND_DASH[edge.kind]}
                    strokeLinecap="round"
                    opacity={dimmed ? 0.25 : chosen ? 1 : active ? 1 : 0.78}
                    pointerEvents="none"
                  />
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
              const a = anchorPoint(from, nodeCenter(from, positions));
              const b = anchorPoint(to, nodeCenter(to, positions));
              const chosen = edge.id === selectedEdgeId;
              const d = threadPath(a, b, threadSagFor(edge.id));
              return (
                <g key={edge.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onSelectEdge(edge.id)}
                    style={{ cursor: "pointer" }}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="var(--color-accent-soft)"
                    strokeWidth={chosen ? 2.1 : 1.4}
                    strokeDasharray="5 5"
                    strokeLinecap="round"
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
          const isResearch = node.category === "research";
          const size = sizeFor(node.id, node.category);
          const dimmed = isDimmed(node.id);
          const selected = node.id === selectedNodeId;
          const dragging = node.id === draggingId;
          const isConnectTarget = connectFrom !== null && connectFrom !== node.id;
          const rotation = selected ? 0 : rotationFor(node.id, node.category);
          const scale = dragging ? 1.045 : selected ? 1.03 : 1;
          const tier = tierOf(node.id);
          const showTape = isBook || tier === "primary";
          const tape = tapeFor(node.id);
          const tapeX = tape.corner === "left" ? center.x - size.w / 2 + 14 : center.x + size.w / 2 - 14;

          return (
            <div key={node.id}>
              {isResearch ? (
                <LayeredPages center={center} size={size} rotation={rotation} dimmed={dimmed} />
              ) : null}

              <button
                type="button"
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerUp={(e) => handleNodePointerUp(e, node)}
                aria-pressed={selected}
                aria-label={`${categoryLabel[node.category]}: ${node.title}`}
                className={`absolute flex flex-col justify-center overflow-hidden text-left font-sans motion-safe:transition-[transform,box-shadow,opacity] motion-safe:duration-200 motion-safe:ease-out ${
                  isConcept
                    ? "items-center rounded-full border-0 bg-transparent text-center"
                    : isBook
                      ? "items-center border border-rule bg-paper/[0.97] px-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.4)]"
                      : "items-start rounded-[1px] border bg-paper/[0.97] px-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.4)]"
                } py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected
                    ? "border-accent shadow-[0_14px_30px_rgba(0,0,0,0.5)]"
                    : isConnectTarget
                      ? "border-dashed border-accent-soft"
                      : isConcept
                        ? ""
                        : "border-rule hover:border-accent-soft"
                } ${dragging ? "shadow-[0_18px_36px_rgba(0,0,0,0.55)]" : ""}`}
                style={{
                  left: center.x,
                  top: center.y,
                  width: size.w,
                  height: size.h,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                  opacity: dimmed ? 0.55 : 1,
                  cursor: dragging ? "grabbing" : "grab",
                  zIndex: dragging ? 6 : selected ? 5 : dimmed ? 1 : 2,
                  color: "var(--color-ink)",
                }}
              >
                <NodeCardContents node={node} index={index} selected={selected} />
              </button>

              {showTape && !dimmed ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-[16px] w-[42px] border border-[rgba(0,0,0,0.08)] bg-[rgba(230,218,196,0.6)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                  style={{
                    left: tapeX,
                    top: center.y - size.h / 2 + 2,
                    transform: `translate(-50%, -50%) rotate(${tape.angle}deg)`,
                    zIndex: (dragging ? 6 : selected ? 5 : 2) + 1,
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* Pins — every artifact is pinned to the wall, isolated artifacts included. On top of the paper, drawn last. */}
        <svg
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          aria-hidden="true"
        >
          {nodes.map((node) => {
            if (isDimmed(node.id)) return null;
            const p = pinPoint(node, nodeCenter(node, positions));
            const big = node.id === selectedNodeId || node.id === draggingId;
            return (
              <g key={node.id} opacity={0.95}>
                <ellipse cx={p.x} cy={p.y + 1.6} rx={big ? 3.4 : 2.6} ry={1.3} fill="rgba(0,0,0,0.35)" />
                <circle cx={p.x} cy={p.y} r={big ? 3.6 : 2.8} fill="var(--color-accent)" />
                <circle cx={p.x - 0.8} cy={p.y - 0.8} r={big ? 1.2 : 0.9} fill="rgba(255,255,255,0.55)" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* A soft vignette at the edges — a visual cue that the wall continues beyond the frame. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: "inset 0 0 90px 16px var(--board-wall)",
          opacity: 0.8,
        }}
      />

      <p className="pointer-events-none absolute bottom-3 left-3 max-w-[22rem] bg-paper/90 px-2 py-1 font-sans text-[0.6875rem] leading-snug text-ink-muted italic">
        Follow a thread · Drag to rearrange · Scroll to zoom.
      </p>
    </div>
  );
}
