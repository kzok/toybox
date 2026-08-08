import { castDraft, type Draft } from "immer";
import { INITIAL_EDITOR_STATE } from "../atoms";
import type { PageState } from "../types";
import type { ActionCreatorParam } from "./types";

/**
 * @param params store, atoms and updateAtom
 * @returns actions for editor mode
 */
export const createEditorModeActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /**
     * clear mode state
     * @note drops the target item of edit mode when it became blank.
     */
    clear: (): void => {
      updateAtom(atoms.state, (draft) => {
        dropBlankEditTarget(draft);
        draft.editorMode = castDraft(INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /**
     * get into select mode and select specified item.
     * @param itemId item.id
     * @param multi if ctrlKey is pressed
     * @note drops the target item of edit mode when it became blank.
     */
    selectItem: (itemId: string, multi: boolean = false): void => {
      updateAtom(atoms.state, (draft) => {
        dropBlankEditTarget(draft);
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
     * @note drops the previous target item of edit mode when it became blank.
     */
    enterEdit: (itemId: string): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind === "edit" && draft.editorMode.itemId === itemId) {
          return; // already editing it, hence not leaving edit mode.
        }
        dropBlankEditTarget(draft);
        draft.editorMode = { kind: "edit", itemId };
      });
    },
  } as const;
};

/**
 * drop the target text item of edit mode when its content is blank.
 *
 * every transition leaving edit mode goes through this, so that a text item
 * whose content was entirely erased never survives the edit.
 * @param draft entire page state
 */
const dropBlankEditTarget = (draft: Draft<PageState>): void => {
  if (draft.editorMode.kind !== "edit") {
    return;
  }
  const { itemId } = draft.editorMode;
  draft.editorItems = draft.editorItems.filter(
    (item) => !(item.id === itemId && item.kind === "text" && item.content.trim() === ""),
  );
};
