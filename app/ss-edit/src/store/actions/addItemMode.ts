import { castDraft } from "immer";
import { editorItemFromRange } from "../../features/editorItem";
import type { Vec2 } from "../../utils/geometry";
import { canvasOffset } from "../selectors";
import type { PageState } from "../types";
import type { ActionCreatorParam } from "./types";
import { switchMode } from "./utils";

export const createAddItemModeActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /** get into add-item mode */
    enter: (itemKind: PageState.Mode.AddItem["itemKind"]): void => {
      updateAtom(atoms.state, (draft) => {
        switchMode(draft, { kind: "add-item", itemKind, range: null });
      });
    },
    /**
     * update range of "add-item" mode
     * @param cursor current cursor position in editor pane coordinates
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
    /** drop the range being dragged in "add-item" mode, staying in the mode. */
    cancel: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        draft.editorMode.range = null;
      });
    },
    /** add the item of "add-item" mode at the dragged range and leave the mode. */
    commit: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        const { itemKind, range } = draft.editorMode;
        if (range == null) return; // the pointer never went down on the pane.

        const newItem = editorItemFromRange(itemKind, range, crypto.randomUUID());
        draft.editorItems.push(castDraft(newItem));
        switchMode(
          draft,
          newItem.kind === "text"
            ? // a text item gets dropped unless the user types anything.
              { kind: "edit", itemId: newItem.id }
            : { kind: "select", selectedIds: [newItem.id] },
        );
      });
    },
  } as const;
};
