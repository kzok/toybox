import { atom } from "jotai";
import { measurePicture } from "../features/editorItem";
import { canvasOffset } from "./selectors";
import type { PageState } from "./types";

/** a dialog on the stack. */
export type DialogEntry = {
  id: string;
  node: React.ReactNode;
};

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
  /** (primitive) dialog stack, the last entry is on top. */
  const dialogStack = atom<readonly DialogEntry[]>([]);
  /** the dialog on top of the stack, or null if there is none. */
  const dialogReactNode = atom((get) => get(dialogStack).at(-1)?.node ?? null);
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
    dialogStack,
    dialogReactNode,
    isSaved,
    canvasOffset: atom((get) => canvasOffset(get(editorView))),
    editorPictureRect: atom((get) => measurePicture(get(editorItems))),
    canSave: atom((get): boolean => get(editorItems).length > 0),
    needConfirmBeforeUnload: atom((get): boolean => get(editorItems).length > 0 && !get(isSaved)),
  } as const;
};

export type Atoms = ReturnType<typeof createAtoms>;
