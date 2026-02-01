import { atom } from "jotai";
import type { Editor } from "./types";

/** initial state */
export const INITIAL_EDITOR_STATE: Editor.State = {
  view: { canvas: { width: 0, height: 0 }, offset: [0, 0] },
  items: [],
};

/** atoms for editor state-machine */
export const editorAtoms = (() => {
  /**
   * (primitive) entire editor state.
   */
  const state = atom(INITIAL_EDITOR_STATE);

  return { state } as const;
})();
