import { castDraft } from "immer";
import { clampFontSize, type EditorItem } from "../../features/editorItem";
import { Rect, type Vec2 } from "../../utils/geometry";
import { canvasOffset } from "../selectors";
import type { PageState } from "../types";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget } from "./utils";

/** font color of a newly added text item */
const NEW_TEXT_COLOR = "#EF3171";

/**
 * @param params store, atoms and updateAtom
 * @returns actions for adding an item by dragging
 */
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
     * add the item of "add-item" mode at the dragged range and get into edit mode for it.
     * @note the added item is blank, hence dropped again unless the user types anything.
     */
    commit: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        const { range } = draft.editorMode;
        if (range == null) return; // the pointer never went down on the pane.

        const { head, size } = new Rect(...range);
        // NOTE: the dragged height is a single line box, hence the inverse of `lineHeightOf()`.
        const fontSize = clampFontSize(size.y / 1.5);
        const width = Math.max(Math.round(size.x), fontSize * 10);

        const newItem: EditorItem.Text = {
          kind: "text",
          id: crypto.randomUUID(),
          content: "",
          offset: head.tuple(),
          width,
          fontSize,
          color: NEW_TEXT_COLOR,
        };
        draft.editorItems.push(castDraft(newItem));
        draft.editorMode = { kind: "edit", itemId: newItem.id };
      });
    },
  } as const;
};
