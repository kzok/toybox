import { castDraft } from "immer";
import { editorItemFromRange } from "../../features/editorItem";
import type { Vec2 } from "../../utils/geometry";
import { canvasOffset } from "../selectors";
import type { PageState } from "../types";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget } from "./utils";

export const createAddItemActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /** get into add-item mode */
    enter: (itemKind: PageState.Mode.AddItem["itemKind"]): void => {
      updateAtom(atoms.state, (draft) => {
        dropBlankEditTarget(draft);
        draft.editorMode = { kind: "add-item", itemKind, range: null };
      });
    },
    /**
     * update range of "add-item" mode
     * @param cursor current cursor position, in editor pane coordinates
     */
    updateRange: (cursor: Vec2): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        const point = cursor.sub(canvasOffset(draft.editorView)).div(draft.editorView.scale);
        if (draft.editorMode.range == null) {
          draft.editorMode.range = [point, point];
        } else {
          draft.editorMode.range[1] = point;
        }
      });
    },
    /**
     * drop the range being dragged in "add-item" mode, staying in the mode.
     * @note called when the drag is cancelled (e.g. on "pointercancel"), so that the
     *   abandoned start point never becomes the head of the next drag.
     */
    cancel: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        draft.editorMode.range = null;
      });
    },
    /**
     * add the item of "add-item" mode at the dragged range, and leave the mode with it as the
     * user's next concern: a text item is edited, since it arrives blank and has to be typed
     * into, while a rect or an arrow item is merely selected, being finished the moment it is
     * dragged out.
     */
    commit: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        const { itemKind, range } = draft.editorMode;
        if (range == null) return; // the pointer never went down on the pane.

        const newItem = editorItemFromRange(itemKind, range, crypto.randomUUID());
        draft.editorItems.push(castDraft(newItem));
        draft.editorMode =
          newItem.kind === "text"
            ? // NOTE: the added item is blank, hence dropped again unless the user types anything.
              { kind: "edit", itemId: newItem.id }
            : { kind: "select", selectedIds: [newItem.id] };
      });
    },
  } as const;
};
