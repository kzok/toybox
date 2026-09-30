import { castDraft } from "immer";
import type { Vec2 } from "../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../atoms";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget, moveItems } from "./utils";

export const createSelectionActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /** get back into select mode with nothing selected. */
    clear: (): void => {
      updateAtom(atoms.state, (draft) => {
        dropBlankEditTarget(draft);
        draft.editorMode = castDraft(INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /**
     * get into select mode and select specified item.
     * @param multi if ctrlKey is pressed
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
        moveItems(draft, draft.editorMode.selectedIds, delta);
      });
    },
    /** drop the selected items, or the item under edit in edit mode. */
    deleteSelected: (): void => {
      updateAtom(atoms.state, (draft) => {
        let targetIds: readonly string[];
        switch (draft.editorMode.kind) {
          case "select":
            targetIds = draft.editorMode.selectedIds;
            break;
          case "edit":
            targetIds = [draft.editorMode.itemId];
            break;
          case "add-item":
            return;
          default:
            draft.editorMode satisfies never;
            return;
        }
        // rewriting it with an identical list would count as an unsaved change.
        if (targetIds.length === 0) return;
        draft.editorItems = draft.editorItems.filter((item) => !targetIds.includes(item.id));
        draft.editorMode = castDraft(INITIAL_EDITOR_STATE.editorMode);
      });
    },
  } as const;
};
