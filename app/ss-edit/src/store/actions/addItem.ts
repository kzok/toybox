import { castDraft } from "immer";
import {
  clampFontSize,
  clampRectSide,
  clampTextWidth,
  type EditorItem,
} from "../../features/editorItem";
import { Rect, type Vec2 } from "../../utils/geometry";
import { canvasOffset } from "../selectors";
import type { PageState } from "../types";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget } from "./utils";

/** color of a newly added item, whichever kind it is */
const NEW_ITEM_COLOR = "#EF3171";

/** line width (px) of a newly added rect item */
const NEW_RECT_LINE_WIDTH = 4;

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
     * add the item of "add-item" mode at the dragged range, and leave the mode with it as the
     * user's next concern: a text item is edited, since it arrives blank and has to be typed
     * into, while a rect item is merely selected, being finished the moment it is dragged out.
     */
    commit: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        const { itemKind, range } = draft.editorMode;
        if (range == null) return; // the pointer never went down on the pane.

        const { head, size } = new Rect(...range);

        switch (itemKind) {
          case "text": {
            // NOTE: the dragged height is a single line box, hence the inverse of `lineHeightOf()`.
            const fontSize = clampFontSize(size.y / 1.5);
            const newItem: EditorItem.Text = {
              kind: "text",
              id: crypto.randomUUID(),
              content: "",
              offset: head.tuple(),
              width: clampTextWidth(size.x, fontSize),
              fontSize,
              color: NEW_ITEM_COLOR,
            };
            draft.editorItems.push(castDraft(newItem));
            // NOTE: the added item is blank, hence dropped again unless the user types anything.
            draft.editorMode = { kind: "edit", itemId: newItem.id };
            break;
          }
          case "rect": {
            const newItem: EditorItem.Rect = {
              kind: "rect",
              id: crypto.randomUUID(),
              offset: head.tuple(),
              width: clampRectSide(size.x),
              height: clampRectSide(size.y),
              color: NEW_ITEM_COLOR,
              lineWidth: NEW_RECT_LINE_WIDTH,
            };
            draft.editorItems.push(castDraft(newItem));
            draft.editorMode = { kind: "select", selectedIds: [newItem.id] };
            break;
          }
          default:
            itemKind satisfies never;
            throw new Error(`unknown item kind: ${JSON.stringify(itemKind)}`);
        }
      });
    },
  } as const;
};
