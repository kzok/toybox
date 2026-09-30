import type { Vec2 } from "../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../atoms";
import type { PageState } from "../types";
import type { ActionCreatorParam } from "./types";
import { moveItems, switchMode } from "./utils";

export const createSelectionActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  /** @note keeps the relative order within the targets and within the rest. */
  const restack = (side: "front" | "back"): void => {
    updateAtom(atoms.state, (draft) => {
      const targetIds = targetIdsOf(draft.editorMode);
      const targets = draft.editorItems.filter((item) => targetIds.includes(item.id));
      const rest = draft.editorItems.filter((item) => !targetIds.includes(item.id));
      // `editorItems` is painted from the back to the front.
      const restacked = side === "front" ? [...rest, ...targets] : [...targets, ...rest];
      // rewriting it with an identical list would count as an unsaved change.
      if (restacked.every((item, i) => item.id === draft.editorItems[i]?.id)) return;
      draft.editorItems = restacked;
    });
  };

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
    /** drop the selected items, or the item under edit in edit mode. */
    deleteSelected: (): void => {
      updateAtom(atoms.state, (draft) => {
        const targetIds = targetIdsOf(draft.editorMode);
        // rewriting it with an identical list would count as an unsaved change.
        if (targetIds.length === 0) return;
        draft.editorItems = draft.editorItems.filter((item) => !targetIds.includes(item.id));
        switchMode(draft, INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /** move the selected items, or the item under edit in edit mode, in front of the rest. */
    bringToFront: (): void => restack("front"),
    /** move the selected items, or the item under edit in edit mode, behind the rest. */
    sendToBack: (): void => restack("back"),
  } as const;
};

/** @returns the ids of the items that the actions on the selection act on in the mode */
const targetIdsOf = (mode: PageState.Mode): readonly string[] => {
  switch (mode.kind) {
    case "select":
      return mode.selectedIds;
    case "edit":
      return [mode.itemId];
    case "add-item":
      return [];
    default:
      mode satisfies never;
      return [];
  }
};
