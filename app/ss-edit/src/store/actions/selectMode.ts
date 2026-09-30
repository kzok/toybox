import type { Vec2 } from "../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../atoms";
import type { ActionCreatorParam } from "./types";
import { moveItems, switchMode, targetIdsOf } from "./utils";

/** actions specific to select mode */
export const createSelectModeActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /** get back into select mode with nothing selected. */
    clear: (): void => {
      updateAtom(atoms.state, (draft) => {
        switchMode(draft, INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /**
     * get into select mode and select specified item.
     * @param multi if ctrlKey is pressed
     */
    select: (itemId: string, multi: boolean = false): void => {
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
        switchMode(draft, { kind: "select", selectedIds });
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
          switchMode(draft, { kind: "select", selectedIds: [triggerItemId] });
        }
        moveItems(draft, targetIdsOf(draft.editorMode), delta);
      });
    },
  } as const;
};
