import { atom } from "jotai";
import type { PageState } from "./types";

/** initial state */
export const INITIAL_EDITOR_STATE: PageState = {
  editorMode: { kind: "select", selectedIds: [] },
  editorView: { paneSize: { width: 0, height: 0 }, offset: [0, 0], scale: 1 },
  editorItems: [],
};

/**
 * @returns atoms for editor state-machine
 */
export const createAtoms = () => {
  /** (primitive) entire editor state. */
  const state = atom(INITIAL_EDITOR_STATE);

  return {
    state,
    /** state.editorMode */
    editorMode: atom((get) => get(state).editorMode),
    /** state.editorView */
    editorView: atom((get) => get(state).editorView),
    /** state.editorItems */
    editorItems: atom((get) => get(state).editorItems),
  } as const;
};

export type Atoms = ReturnType<typeof createAtoms>;
