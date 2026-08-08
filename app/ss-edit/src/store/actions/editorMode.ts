import { castDraft, type Draft } from "immer";
import type { EditorItem } from "../../features/editorItem";
import type { Point2D } from "../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../atoms";
import { canvasOffset, rangeRect } from "../selectors";
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
    /** get into add-item mode */
    enterAddItem: (itemKind: PageState.Mode.AddItem["itemKind"]): void => {
      updateAtom(atoms.state, (draft) => {
        dropBlankEditTarget(draft);
        draft.editorMode = { kind: "add-item", itemKind, range: null };
      });
    },
    /**
     * update range of "add-item" mode
     * @param cursor current cursor position, in editor pane coordinates
     */
    updateAddItemRange: (cursor: Point2D): void => {
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
    cancelAddItem: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        draft.editorMode.range = null;
      });
    },
    /**
     * add the item of "add-item" mode at the dragged range and get into edit mode for it.
     * @note the added item is blank, hence dropped again unless the user types anything.
     */
    commitAddItem: (): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "add-item") return;
        const { range } = draft.editorMode;
        if (range == null) return; // the pointer never went down on the pane.

        const { head, size } = rangeRect(range);
        // NOTE: the dragged height is a single line box, hence the inverse of `lineHeightOf()`.
        const fontSize = Math.min(
          Math.max(Math.round(size.y / 1.5), MIN_FONT_SIZE_PX),
          MAX_FONT_SIZE_PX,
        );
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

/** text item size below which the dragged range is not worth respecting */
const MIN_FONT_SIZE_PX = 12;
const MAX_FONT_SIZE_PX = 72;
/** font color of a newly added text item */
const NEW_TEXT_COLOR = "#EF3171";

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
