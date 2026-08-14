import { castDraft } from "immer";
import { Vec2 } from "../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../atoms";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget } from "./utils";

/**
 * @param params store, atoms and updateAtom
 * @returns actions for the item selection
 */
export const createSelectionActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /**
     * get back into select mode with nothing selected
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
    select: (itemId: string, multi: boolean = false): void => {
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
     * move the selected items
     * @param triggerItemId item.id that triggers this movement.
     * @param delta [movementX, movementY]
     */
    move: (triggerItemId: string, delta: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        // update selection if triggerItemId is not included.
        if (
          draft.editorMode.kind !== "select" ||
          !draft.editorMode.selectedIds.includes(triggerItemId)
        ) {
          draft.editorMode = { kind: "select", selectedIds: [triggerItemId] };
        }

        const scaledDelta = Vec2.new(delta).div(draft.editorView.scale);
        for (const id of draft.editorMode.selectedIds) {
          const item = draft.editorItems.find((item) => item.id === id);
          if (item == null) continue;
          item.offset = scaledDelta.add(item.offset).tuple();
        }
      });
    },
  } as const;
};
