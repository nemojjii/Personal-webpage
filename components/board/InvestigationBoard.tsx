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
import type { UserEdge } from "@/lib/board/localBoard";
import type { BoardEdge } from "@/lib/board/types";
import { useLocalBoard } from "@/lib/board/useLocalBoard.ts";

import { ArtifactCaseFile } from "./ArtifactCaseFile";
import { BoardCanvas, type Transform, defaultTransform } from "./BoardCanvas";
import { BoardControls } from "./BoardControls";
import { BoardInspector } from "./BoardInspector";
import { BoardListView } from "./BoardListView";
import { ConnectionDossier } from "./ConnectionDossier";
import { fitTransform } from "./boardLayout";

const ALL_NODE_IDS = new Set(graph.nodes.map((n) => n.id));

type Selection = { kind: "node"; id: string } | { kind: "edge"; id: string } | null;

export function InvestigationBoard() {
  const [selection, setSelection] = useState<Selection>(null);
  const [focused, setFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");
  const [sessionPositions, setSessionPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
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

  const selectedNodeId = selection?.kind === "node" ? selection.id : null;

  const findEdge = useCallback(
    (id: string): { edge: BoardEdge; isUserEdge: false } | { edge: UserEdge; isUserEdge: true } | null => {
      const curated = graph.edges.find((e) => e.id === id);
      if (curated) return { edge: curated, isUserEdge: false };
      const user = local.state.userEdges.find((e) => e.id === id);
      if (user) return { edge: user, isUserEdge: true };
      return null;
    },
    [local.state.userEdges],
  );

  const selectedEdgeId = selection?.kind === "edge" ? selection.id : null;
  const selectedEdgeResolved = selectedEdgeId ? findEdge(selectedEdgeId) : null;

  const focusedIds = useMemo(
    () => (focused && selectedNodeId ? neighborhood(graph, selectedNodeId) : null),
    [focused, selectedNodeId],
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

  const selectedNodeNeighborCount = selectedNodeId ? neighborsOf(graph, selectedNodeId).length : 0;

  const highlightIds = useMemo(() => {
    if (selectedNodeId) return neighborhood(graph, selectedNodeId);
    if (selectedEdgeResolved) return new Set([selectedEdgeResolved.edge.from, selectedEdgeResolved.edge.to]);
    if (search.trim()) return searchMatchIds;
    return null;
  }, [selectedNodeId, selectedEdgeResolved, search, searchMatchIds]);

  // An isolated node has nothing to dim toward, so selecting one leaves the whole board readable.
  const dimOthers =
    highlightIds !== null && !(selectedNodeId !== null && selectedNodeNeighborCount === 0);

  const selectedNode = selectedNodeId ? getNode(graph, selectedNodeId) ?? null : null;
  const selectedNeighbors = selectedNodeId ? neighborsOf(graph, selectedNodeId) : [];
  const selectedUserEdges = selectedNodeId
    ? local.state.userEdges.filter((e) => e.from === selectedNodeId || e.to === selectedNodeId)
    : [];
  const selectedNote = selectedNodeId ? local.state.notes[selectedNodeId] ?? "" : "";

  // A verified editorial connection opens the full dossier instead of the quick panel;
  // a visitor's own annotation — a private, casual note — stays in the quick panel.
  const editorialDossier =
    selectedEdgeResolved && !selectedEdgeResolved.isUserEdge
      ? (() => {
          const fromNode = getNode(graph, selectedEdgeResolved.edge.from);
          const toNode = getNode(graph, selectedEdgeResolved.edge.to);
          if (!fromNode || !toNode) return null;
          return { edge: selectedEdgeResolved.edge, fromNode, toNode };
        })()
      : null;

  const userEdgeQuickView =
    selectedEdgeResolved && selectedEdgeResolved.isUserEdge
      ? (() => {
          const fromNode = getNode(graph, selectedEdgeResolved.edge.from);
          const toNode = getNode(graph, selectedEdgeResolved.edge.to);
          if (!fromNode || !toNode) return null;
          return { edge: selectedEdgeResolved.edge, fromNode, toNode };
        })()
      : null;

  // Matches the archival number shown on the wall card itself, which is based on the currently visible/filtered set.
  const selectedNodeIndex = selectedNodeId ? visibleNodes.findIndex((n) => n.id === selectedNodeId) : -1;

  const handleMoveNode = useCallback((id: string, x: number, y: number) => {
    setSessionPositions((prev) => ({ ...prev, [id]: { x, y } }));
  }, []);

  const handleSelectNode = useCallback(
    (id: string, rect?: DOMRect) => {
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
      setOriginRect(rect ?? null);
      setSelection({ kind: "node", id });
      setFocused(false);
    },
    [connectFrom, local],
  );

  const handleSelectEdge = useCallback((id: string) => {
    setSelection({ kind: "edge", id });
    setFocused(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelection(null);
    setFocused(false);
    setOriginRect(null);
  }, []);

  const handleZoom = useCallback((factor: number) => {
    setTransform((t) => ({ ...t, scale: Math.min(2.2, Math.max(0.35, t.scale * factor)) }));
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
    setTransform(fitTransform(bounds, viewportSizeRef.current, 100));
  }, [focusedIds, visibleNodes, sessionPositions]);

  const handleResetLayout = useCallback(() => {
    setSessionPositions({});
  }, []);

  const handleResetView = useCallback(() => {
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
        onResetView={handleResetView}
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

      <div className="relative">
        {viewMode === "canvas" ? (
          <BoardCanvas
            nodes={visibleNodes}
            edges={visibleEdges}
            userEdges={visibleUserEdges}
            positions={sessionPositions}
            onMoveNode={handleMoveNode}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            highlightIds={highlightIds}
            dimOthers={dimOthers}
            transform={transform}
            onTransformChange={setTransform}
            connectFrom={connectFrom}
            onViewportResize={handleViewportResize}
          />
        ) : (
          <div className="border border-rule bg-surface/20 p-5">
            <BoardListView
              graph={graph}
              nodes={visibleNodes}
              selectedId={selectedNodeId}
              onSelect={handleSelectNode}
            />
          </div>
        )}

        <BoardInspector
          edge={userEdgeQuickView?.edge ?? null}
          fromNode={userEdgeQuickView?.fromNode ?? null}
          toNode={userEdgeQuickView?.toNode ?? null}
          onSelectNode={handleSelectNode}
          onClose={handleClose}
          onRemoveUserEdge={local.removeConnection}
        />
      </div>

      {selectedNode ? (
        <ArtifactCaseFile
          key={selectedNode.id}
          node={selectedNode}
          index={selectedNodeIndex}
          neighbors={selectedNeighbors}
          userEdges={selectedUserEdges}
          resolveNode={(id) => getNode(graph, id)}
          note={selectedNote}
          onSetNote={(text) => selectedNodeId && local.setNoteFor(selectedNodeId, text)}
          onSelectNode={handleSelectNode}
          onClose={handleClose}
          onFocusNeighborhood={() => setFocused(true)}
          onClearFocus={() => setFocused(false)}
          focused={focused}
          connectFrom={connectFrom}
          onStartConnect={() => selectedNodeId && setConnectFrom(selectedNodeId)}
          onCancelConnect={() => setConnectFrom(null)}
          onRemoveUserEdge={local.removeConnection}
          originRect={originRect}
        />
      ) : null}

      {editorialDossier ? (
        <ConnectionDossier
          key={editorialDossier.edge.id}
          edge={editorialDossier.edge}
          fromNode={editorialDossier.fromNode}
          toNode={editorialDossier.toNode}
          onSelectNode={handleSelectNode}
          onClose={handleClose}
        />
      ) : null}
    </div>
  );
}
