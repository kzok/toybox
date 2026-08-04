import { castDraft, produce } from "immer";
import { type Atoms, INITIAL_EDITOR_STATE } from "../atoms";
import { createEditorItemActions } from "./editorItem";
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

  return {
    editorView,
    editorItem,
    /**
     * get into select mode and select specified item.
     * @param id item.id
     * @param multi if ctrlKey is pressed
     */
    selectItem: (id: string, multi: boolean = false): void => {
      updateAtom(atoms.state, (draft) => {
        let selectedIds: string[] = [];
        if (multi) {
          // multi selection
          if (draft.editorMode.kind === "select") {
            selectedIds = draft.editorMode.selectedIds;
          }
          if (selectedIds.includes(id)) {
            // remove it if already included.
            selectedIds = selectedIds.filter((el) => el !== id);
          } else {
            // add it otherwise.
            selectedIds.push(id);
          }
        } else {
          // single selection
          selectedIds = [id];
        }
        draft.editorMode = { kind: "select", selectedIds };
      });
    },
    /** clear mode state */
    clearMode: (): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorMode = castDraft(INITIAL_EDITOR_STATE.editorMode);
      });
    },
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
