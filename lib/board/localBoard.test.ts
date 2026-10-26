import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MAX_LABEL_LENGTH,
  MAX_NOTE_LENGTH,
  addUserEdge,
  emptyLocalBoard,
  parseLocalBoard,
  removeNote,
  removeUserEdge,
  serializeLocalBoard,
  setNote,
} from "./localBoard.ts";

test("parseLocalBoard returns empty state for null, undefined and empty string", () => {
  assert.deepEqual(parseLocalBoard(null), emptyLocalBoard());
  assert.deepEqual(parseLocalBoard(undefined), emptyLocalBoard());
  assert.deepEqual(parseLocalBoard(""), emptyLocalBoard());
});

test("parseLocalBoard rejects malformed JSON without throwing", () => {
  assert.deepEqual(parseLocalBoard("{not json"), emptyLocalBoard());
  assert.deepEqual(parseLocalBoard("null"), emptyLocalBoard());
  assert.deepEqual(parseLocalBoard("[1,2,3]"), emptyLocalBoard());
  assert.deepEqual(parseLocalBoard('"just a string"'), emptyLocalBoard());
});

test("parseLocalBoard rejects an unknown version", () => {
  assert.deepEqual(parseLocalBoard(JSON.stringify({ version: 2, notes: {}, userEdges: [] })), emptyLocalBoard());
});

test("parseLocalBoard drops malformed notes and userEdges instead of failing whole-sale", () => {
  const raw = JSON.stringify({
    version: 1,
    notes: { good: "a real note", bad: 42 },
    userEdges: [
      { id: "x", from: "a", to: "b", label: "fine" },
      { id: "y", from: "a" }, // missing fields
      "not an object",
    ],
  });
  const state = parseLocalBoard(raw);
  assert.deepEqual(state.notes, {});
  assert.equal(state.userEdges.length, 1);
  assert.equal(state.userEdges[0].id, "x");
});

test("round-trips through serialize/parse", () => {
  const state = setNote(emptyLocalBoard(), "research/x", "an honest note");
  const round = parseLocalBoard(serializeLocalBoard(state));
  assert.deepEqual(round, state);
});

test("setNote trims and caps note length, and an empty note removes it", () => {
  const long = "x".repeat(MAX_NOTE_LENGTH + 50);
  const state = setNote(emptyLocalBoard(), "n1", long);
  assert.equal(state.notes.n1.length, MAX_NOTE_LENGTH);

  const cleared = setNote(state, "n1", "   ");
  assert.equal(cleared.notes.n1, undefined);
});

test("removeNote removes only the named note", () => {
  let state = setNote(emptyLocalBoard(), "n1", "a");
  state = setNote(state, "n2", "b");
  state = removeNote(state, "n1");
  assert.deepEqual(state.notes, { n2: "b" });
});

test("addUserEdge rejects self-loops, unknown ids, and empty labels", () => {
  const valid = new Set(["a", "b"]);
  let state = emptyLocalBoard();
  state = addUserEdge(state, "a", "a", "loop", valid);
  assert.equal(state.userEdges.length, 0);
  state = addUserEdge(state, "a", "z", "unknown target", valid);
  assert.equal(state.userEdges.length, 0);
  state = addUserEdge(state, "a", "b", "   ", valid);
  assert.equal(state.userEdges.length, 0);
});

test("addUserEdge adds a valid edge and caps its label length", () => {
  const valid = new Set(["a", "b"]);
  const long = "y".repeat(MAX_LABEL_LENGTH + 20);
  const state = addUserEdge(emptyLocalBoard(), "a", "b", long, valid);
  assert.equal(state.userEdges.length, 1);
  assert.equal(state.userEdges[0].label.length, MAX_LABEL_LENGTH);
});

test("addUserEdge does not duplicate an edge in either direction", () => {
  const valid = new Set(["a", "b"]);
  let state = addUserEdge(emptyLocalBoard(), "a", "b", "first", valid);
  state = addUserEdge(state, "b", "a", "second, reversed", valid);
  assert.equal(state.userEdges.length, 1);
});

test("removeUserEdge removes only the named edge", () => {
  const valid = new Set(["a", "b", "c"]);
  let state = addUserEdge(emptyLocalBoard(), "a", "b", "one", valid);
  state = addUserEdge(state, "a", "c", "two", valid);
  const idToRemove = state.userEdges[0].id;
  state = removeUserEdge(state, idToRemove);
  assert.equal(state.userEdges.length, 1);
  assert.notEqual(state.userEdges[0].id, idToRemove);
});
