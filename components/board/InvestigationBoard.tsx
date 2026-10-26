"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import {
  edgesTouching,
  getNode,
  graph,
  neighborhood,
  neighborsOf,
  searchNodes,
} from "@/lib/board/graph.ts";
import { useLocalBoard } from "@/lib/board/useLocalBoard.ts";

import { BoardCanvas, type Transform, defaultTransform } from "./BoardCanvas";
import { BoardControls } from "./BoardControls";
import { BoardInspector } from "./BoardInspector";
import { BoardListView } from "./BoardListView";
import { fitTransform } from "./boardLayout";

const ALL_NODE_IDS = new Set(graph.nodes.map((n) => n.id));

export function InvestigationBoard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");
  const [sessionPositions, setSessionPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(() => defaultTransform({ width: 900, height: 560 }));
  const viewportSizeRef = useRef({ width: 900, height: 560 });
  const hasMeasuredViewport = useRef(false);

  const handleViewportResize = useCallback((size: { width: number; height: number }) => {
    viewportSizeRef.current = size;
    if (!hasMeasuredViewport.current) {
      hasMeasuredViewport.current = true;
      setTransform(defaultTransform(size));
    }
  }, []);

  const local = useLocalBoard();

  const toggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const searchMatchIds = useMemo(() => new Set(searchNodes(graph, search).map((n) => n.id)), [search]);

  const categoryFiltered = useMemo(
    () => graph.nodes.filter((n) => activeCategories.size === 0 || activeCategories.has(n.category)),
    [activeCategories],
  );

  const focusedIds = useMemo(
    () => (focused && selectedId ? neighborhood(graph, selectedId) : null),
    [focused, selectedId],
  );

  const visibleNodes = useMemo(
    () => categoryFiltered.filter((n) => !focusedIds || focusedIds.has(n.id)),
    [categoryFiltered, focusedIds],
  );

  const visibleEdges = useMemo(() => {
    const ids = new Set(visibleNodes.map((n) => n.id));
    return edgesTouching(graph, ids);
  }, [visibleNodes]);

  const visibleUserEdges = useMemo(() => {
    const ids = new Set(visibleNodes.map((n) => n.id));
    return local.state.userEdges.filter((e) => ids.has(e.from) && ids.has(e.to));
  }, [visibleNodes, local.state.userEdges]);

  const highlightIds = useMemo(() => {
    if (selectedId) return neighborhood(graph, selectedId);
    if (search.trim()) return searchMatchIds;
    return null;
  }, [selectedId, search, searchMatchIds]);

  const selectedNode = selectedId ? getNode(graph, selectedId) ?? null : null;
  const selectedNeighbors = selectedId ? neighborsOf(graph, selectedId) : [];
  const selectedUserEdges = selectedId
    ? local.state.userEdges.filter((e) => e.from === selectedId || e.to === selectedId)
    : [];
  const selectedNote = selectedId ? local.state.notes[selectedId] ?? "" : "";

  const handleMoveNode = useCallback((id: string, x: number, y: number) => {
    setSessionPositions((prev) => ({ ...prev, [id]: { x, y } }));
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      if (connectFrom && connectFrom !== id) {
        const label = window.prompt(
          `Why does ${getNode(graph, connectFrom)?.title ?? connectFrom} connect to ${getNode(graph, id)?.title ?? id}? (Shown only to you, in this browser.)`,
          "",
        );
        if (label !== null && label.trim()) {
          local.addConnection(connectFrom, id, label, ALL_NODE_IDS);
        }
        setConnectFrom(null);
        return;
      }
      setSelectedId(id);
      setFocused(false);
    },
    [connectFrom, local],
  );

  const handleZoom = useCallback((factor: number) => {
    setTransform((t) => ({ ...t, scale: Math.min(2.2, Math.max(0.4, t.scale * factor)) }));
  }, []);

  const handleFitToView = useCallback(() => {
    const ids = focusedIds ?? new Set(visibleNodes.map((n) => n.id));
    const points = visibleNodes
      .filter((n) => ids.has(n.id))
      .map((n) => sessionPositions[n.id] ?? { x: n.x, y: n.y });
    if (points.length === 0) return;
    const bounds = {
      minX: Math.min(...points.map((p) => p.x)),
      minY: Math.min(...points.map((p) => p.y)),
      maxX: Math.max(...points.map((p) => p.x)),
      maxY: Math.max(...points.map((p) => p.y)),
    };
    setTransform(fitTransform(bounds, viewportSizeRef.current, 90));
  }, [focusedIds, visibleNodes, sessionPositions]);

  const handleResetLayout = useCallback(() => {
    setSessionPositions({});
    setTransform(defaultTransform(viewportSizeRef.current));
  }, []);

  const hasPersonalData = Object.keys(local.state.notes).length > 0 || local.state.userEdges.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <BoardControls
        search={search}
        onSearchChange={setSearch}
        activeCategories={activeCategories}
        onToggleCategory={toggleCategory}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        onZoomIn={() => handleZoom(1.2)}
        onZoomOut={() => handleZoom(1 / 1.2)}
        onResetLayout={handleResetLayout}
        onFitToView={handleFitToView}
        hasPersonalData={hasPersonalData}
        onClearPersonal={() => {
          if (window.confirm("Remove every note and connection you've added, from this browser only?")) {
            local.clearAll();
          }
        }}
      />

      {connectFrom ? (
        <p className="border border-dashed border-accent-soft bg-surface/60 px-3 py-2 font-sans text-[0.8125rem] text-ink">
          Pick another node to connect it to {getNode(graph, connectFrom)?.title ?? connectFrom}.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        {viewMode === "canvas" ? (
          <BoardCanvas
            nodes={visibleNodes}
            edges={visibleEdges}
            userEdges={visibleUserEdges}
            positions={sessionPositions}
            onMoveNode={handleMoveNode}
            selectedId={selectedId}
            onSelect={handleSelect}
            highlightIds={highlightIds}
            dimOthers={highlightIds !== null}
            transform={transform}
            onTransformChange={setTransform}
            connectFrom={connectFrom}
            onViewportResize={handleViewportResize}
          />
        ) : (
          <div className="border border-rule bg-surface/20 p-5">
            <BoardListView graph={graph} nodes={visibleNodes} selectedId={selectedId} onSelect={handleSelect} />
          </div>
        )}

        <BoardInspector
          key={selectedId ?? "none"}
          node={selectedNode}
          neighbors={selectedNeighbors}
          userEdges={selectedUserEdges}
          resolveNode={(id) => getNode(graph, id)}
          note={selectedNote}
          onSetNote={(text) => selectedId && local.setNoteFor(selectedId, text)}
          onSelect={handleSelect}
          onFocusNeighborhood={() => setFocused(true)}
          onClearFocus={() => setFocused(false)}
          focused={focused}
          connectFrom={connectFrom}
          onStartConnect={() => selectedId && setConnectFrom(selectedId)}
          onCancelConnect={() => setConnectFrom(null)}
          onRemoveUserEdge={local.removeConnection}
        />
      </div>
    </div>
  );
}
