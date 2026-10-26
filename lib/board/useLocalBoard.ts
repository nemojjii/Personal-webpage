"use client";

import { useCallback, useSyncExternalStore } from "react";

import { addUserEdge, removeNote, removeUserEdge, setNote } from "./localBoard.ts";
import { getServerSnapshot, getSnapshot, resetLocalBoard, subscribe, updateLocalBoard } from "./localBoardStore.ts";

/**
 * The visitor's own notes and extra connections. Server and first-paint
 * client render both see an empty board (no hydration mismatch); the real
 * saved state, if this browser has any, takes over right after mount.
 */
export function useLocalBoard() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setNoteFor = useCallback(
    (nodeId: string, text: string) => updateLocalBoard(setNote(getSnapshot(), nodeId, text)),
    [],
  );

  const removeNoteFor = useCallback(
    (nodeId: string) => updateLocalBoard(removeNote(getSnapshot(), nodeId)),
    [],
  );

  const addConnection = useCallback(
    (from: string, to: string, label: string, validIds: ReadonlySet<string>) =>
      updateLocalBoard(addUserEdge(getSnapshot(), from, to, label, validIds)),
    [],
  );

  const removeConnection = useCallback(
    (edgeId: string) => updateLocalBoard(removeUserEdge(getSnapshot(), edgeId)),
    [],
  );

  const clearAll = useCallback(() => resetLocalBoard(), []);

  return { state, setNoteFor, removeNoteFor, addConnection, removeConnection, clearAll };
}
