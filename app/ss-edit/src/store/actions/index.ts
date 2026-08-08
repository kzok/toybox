import { produce } from "immer";
import type { Atoms } from "../atoms";
import { createEditorItemActions } from "./editorItem";
import { createEditorModeActions } from "./editorMode";
import { createEditorViewActions } from "./editorView";
import type { ActionCreatorParam, StoreInterface, UpdateAtom } from "./types";

/**
 * @param store
 * @param atoms
 * @returns actions
 */
export const createActions = (store: StoreInterface, atoms: Atoms) => {
  const updateAtom: UpdateAtom = (atom, recipe) => {
    store.set(
      atom,
      produce(store.get(atom), (draft) => {
        recipe(draft);
      }),
    );
  };

  const params: ActionCreatorParam = { store, atoms, updateAtom };
  const editorView = createEditorViewActions(params);
  const editorItem = createEditorItemActions(params);
  const editorMode = createEditorModeActions(params);

  return {
    editorView,
    editorItem,
    editorMode,
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
