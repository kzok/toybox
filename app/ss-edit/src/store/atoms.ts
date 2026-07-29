import { atom } from "jotai";
import type { PageState } from "./types";

/** initial state */
export const INITIAL_EDITOR_STATE: PageState = {
  editorMode: { kind: "select", selectedIds: [] },
  editorView: { paneSize: [0, 0], centerOffset: [0, 0], scale: 1 },
  editorItems: [],
};

/**
 * @returns atoms for editor state-machine
 */
export const createAtoms = () => {
  /** (primitive) entire editor state. */
  const state = atom(INITIAL_EDITOR_STATE);
  /** state.editorMode */
  const editorMode = atom((get) => get(state).editorMode);
  /** state.editorView */
  const editorView = atom((get) => get(state).editorView);
  /** state.editorItems */
  const editorItems = atom((get) => get(state).editorItems);

  return {
    state,
    editorMode,
    editorView,
    editorItems,
  } as const;
};

export type Atoms = ReturnType<typeof createAtoms>;
