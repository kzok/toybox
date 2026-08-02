import { atom } from "jotai";
import { canvasOffset, entirePictureRect } from "./selectors";
import type { PageState } from "./types";

/** initial state */
export const INITIAL_EDITOR_STATE: PageState = {
  editorMode: { kind: "select", selectedIds: [] },
  editorView: { canvasSize: [0, 0], offset: [0, 0], scale: 1 },
  editorItems: [],
};

/**
 * @returns atoms for editor state-machine
 */
export const createAtoms = () => {
  /** (primitive) entire editor state. */
  const state = atom(INITIAL_EDITOR_STATE);
  /** if the latest change was saved. */
  const isSaved = atom(false);
  /** (primitive) dialog state */
  const dialogReactNode = atom<React.ReactNode>(null);
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
    dialogReactNode,
    canvasOffset: atom((get) => canvasOffset(get(editorView))),
    entirePictureRect: atom((get) => entirePictureRect(get(editorItems))),
    needConfirmBeforeUnload: atom((get): boolean => get(editorItems).length > 0 && !get(isSaved)),
  } as const;
};

export type Atoms = ReturnType<typeof createAtoms>;
