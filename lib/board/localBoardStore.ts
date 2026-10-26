/**
 * A tiny external store wrapping localBoard.ts's localStorage access, so
 * useLocalBoard can read it with useSyncExternalStore — server and first
 * client render both see the same empty snapshot, and the real, saved
 * state (if any) swaps in right after hydration, with no manual effect
 * calling setState.
 */
import { type LocalBoardState, clearLocalBoard, emptyLocalBoard, loadLocalBoard, saveLocalBoard } from "./localBoard.ts";

type Listener = () => void;

const EMPTY = emptyLocalBoard();
let current: LocalBoardState = EMPTY;
let loaded = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Loads from localStorage at most once, on the first call after mount. */
export function getSnapshot(): LocalBoardState {
  if (!loaded && typeof window !== "undefined") {
    current = loadLocalBoard();
    loaded = true;
  }
  return current;
}

export function getServerSnapshot(): LocalBoardState {
  return EMPTY;
}

export function updateLocalBoard(next: LocalBoardState): void {
  current = next;
  loaded = true;
  saveLocalBoard(next);
  emit();
}

export function resetLocalBoard(): void {
  clearLocalBoard();
  current = emptyLocalBoard();
  loaded = true;
  emit();
}
