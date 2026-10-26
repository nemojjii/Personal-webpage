/**
 * The visitor's own layer on top of the curated board: notes on a node and
 * extra edges between existing nodes. Stored only in this browser
 * (localStorage), never sent anywhere, never written back into the site's
 * content. The parsing here is pure and tested; only loadLocalBoard and
 * saveLocalBoard touch the browser API, each guarded so a private window,
 * a full quota or a blocked store degrades to "nothing saved" rather than
 * a crash.
 */

export interface UserEdge {
  id: string;
  from: string;
  to: string;
  /** Why the visitor drew it — shown on the board, visually distinct from a curated edge. */
  label: string;
}

export interface LocalBoardState {
  version: 1;
  /** Node id → the visitor's own note on it. */
  notes: Record<string, string>;
  userEdges: UserEdge[];
}

export const STORAGE_KEY = "investigation-board:v1";
export const MAX_NOTE_LENGTH = 500;
export const MAX_LABEL_LENGTH = 120;

export function emptyLocalBoard(): LocalBoardState {
  return { version: 1, notes: {}, userEdges: [] };
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === "string");
}

function isUserEdge(value: unknown): value is UserEdge {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.from === "string" &&
    typeof v.to === "string" &&
    typeof v.label === "string"
  );
}

/** Parses and validates a stored string, falling back to empty on anything malformed or unexpected. */
export function parseLocalBoard(raw: string | null | undefined): LocalBoardState {
  if (!raw) return emptyLocalBoard();
  try {
    const data = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return emptyLocalBoard();
    if (data.version !== 1) return emptyLocalBoard();
    const notes = isRecordOfStrings(data.notes) ? data.notes : {};
    const userEdges = Array.isArray(data.userEdges) ? data.userEdges.filter(isUserEdge) : [];
    return { version: 1, notes, userEdges };
  } catch {
    return emptyLocalBoard();
  }
}

export function serializeLocalBoard(state: LocalBoardState): string {
  return JSON.stringify(state);
}

export function loadLocalBoard(): LocalBoardState {
  try {
    return parseLocalBoard(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyLocalBoard();
  }
}

export function saveLocalBoard(state: LocalBoardState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeLocalBoard(state));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalBoard(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — there was never anything reliably stored to clear.
  }
}

export function setNote(state: LocalBoardState, nodeId: string, text: string): LocalBoardState {
  const trimmed = text.trim().slice(0, MAX_NOTE_LENGTH);
  const notes = { ...state.notes };
  if (trimmed) notes[nodeId] = trimmed;
  else delete notes[nodeId];
  return { ...state, notes };
}

export function removeNote(state: LocalBoardState, nodeId: string): LocalBoardState {
  const notes = { ...state.notes };
  delete notes[nodeId];
  return { ...state, notes };
}

/** Adds a user edge between two distinct, existing node ids. No-ops on an invalid pair. */
export function addUserEdge(
  state: LocalBoardState,
  from: string,
  to: string,
  label: string,
  validIds: ReadonlySet<string>,
): LocalBoardState {
  if (from === to || !validIds.has(from) || !validIds.has(to)) return state;
  const trimmedLabel = label.trim().slice(0, MAX_LABEL_LENGTH);
  if (!trimmedLabel) return state;
  const exists = state.userEdges.some(
    (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
  );
  if (exists) return state;
  const edge: UserEdge = { id: `user-${from}--${to}-${Date.now()}`, from, to, label: trimmedLabel };
  return { ...state, userEdges: [...state.userEdges, edge] };
}

export function removeUserEdge(state: LocalBoardState, edgeId: string): LocalBoardState {
  return { ...state, userEdges: state.userEdges.filter((e) => e.id !== edgeId) };
}
