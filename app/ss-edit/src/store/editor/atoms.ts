import { atom } from "jotai";
import type { EditorState } from "./types";

/** initial state */
export const INITIAL_EDITOR_STATE: EditorState = {
  view: { size: { width: 0, height: 0 }, offset: [0, 0], scale: 1 },
  items: [],
};

/** atoms for editor state-machine */
export const editorAtoms = (() => {
  /** (primitive) entire editor state. */
  const state = atom(INITIAL_EDITOR_STATE);

  return {
    state,
    /** state.view */
    view: atom((get) => get(state).view),
    /** state.items */
    items: atom((get) => get(state).items),
  } as const;
})();
