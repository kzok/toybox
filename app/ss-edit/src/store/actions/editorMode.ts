import { castDraft } from "immer";
import { INITIAL_EDITOR_STATE } from "../atoms";
import type { ActionCreatorParam } from "./types";

/**
 * @param params store, atoms and updateAtom
 * @returns actions for editor mode
 */
export const createEditorModeActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /** clear mode state */
    clear: (): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorMode = castDraft(INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /**
     * get into select mode and select specified item.
     * @param itemId item.id
     * @param multi if ctrlKey is pressed
     */
    selectItem: (itemId: string, multi: boolean = false): void => {
      updateAtom(atoms.state, (draft) => {
        let selectedIds: string[] = [];
        if (multi) {
          // multi selection
          if (draft.editorMode.kind === "select") {
            selectedIds = draft.editorMode.selectedIds;
          }
          if (selectedIds.includes(itemId)) {
            // remove it if already included.
            selectedIds = selectedIds.filter((el) => el !== itemId);
          } else {
            // add it otherwise.
            selectedIds.push(itemId);
          }
        } else {
          // single selection
          selectedIds = [itemId];
        }
        draft.editorMode = { kind: "select", selectedIds };
      });
    },
    /**
     * get into edit mode for the specified item.
     * @param itemId item.id
     */
    enterEdit: (itemId: string): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorMode = { kind: "edit", itemId };
      });
    },
  } as const;
};
