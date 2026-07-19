import { atom } from "jotai";
import type { EditorState } from "./types";

/** initial state */
export const INITIAL_EDITOR_STATE: EditorState = {
  mode: { kind: "select", selectedIds: [] },
  view: { size: { width: 0, height: 0 }, offset: [0, 0], scale: 1 },
  items: [],
};

/**
 * @returns atoms for editor state-machine
 */
export const createAtoms = () => {
  /** (primitive) entire editor state. */
  const state = atom(INITIAL_EDITOR_STATE);

  return {
    state,
    /** state.mode */
    mode: atom((get) => get(state).mode),
    /** state.view */
    view: atom((get) => get(state).view),
    /** state.items */
    items: atom((get) => get(state).items),
  } as const;
};

export type Atoms = ReturnType<typeof createAtoms>;
