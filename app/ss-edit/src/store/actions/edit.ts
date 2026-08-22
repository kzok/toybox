import { clampFontSize, textItemSizeOf } from "../../features/editorItem";
import { Vec2 } from "../../utils/geometry";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget } from "./utils";

/** minimum width/height an image item can be resized down to (canvas units) */
const MIN_IMAGE_SIZE = 36;

/**
 * @param params store, atoms and updateAtom
 * @returns actions for editing a single item
 */
export const createEditActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /**
     * get into edit mode for the specified item.
     * @param itemId item.id
     * @note drops the previous target item of edit mode when it became blank.
     */
    enter: (itemId: string): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind === "edit" && draft.editorMode.itemId === itemId) {
          return; // already editing it, hence not leaving edit mode.
        }
        dropBlankEditTarget(draft);
        draft.editorMode = { kind: "edit", itemId };
      });
    },
    /**
     * update the content of a text item.
     * @param itemId item.id
     * @param content new text content
     */
    setText: (itemId: string, content: string): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "text") return;
        item.content = content;
      });
    },
    /**
     * resize an image item, keeping its aspect ratio and its top-left offset fixed.
     * @param itemId item.id to resize
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     */
    resizeImage: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "image") return;

        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        const imageSizeVec = Vec2.new(item.width, item.height);
        const diagonal = Math.hypot(item.width, item.height);
        // project the pointer position onto the box's diagonal to get the target diagonal length.
        const targetDiagonal = scaledCursor.dot(imageSizeVec) / diagonal;
        const factor = Math.max(
          targetDiagonal / diagonal,
          MIN_IMAGE_SIZE / Math.min(item.width, item.height),
        );

        item.width *= factor;
        item.height *= factor;
      });
    },
    /**
     * resize a text item, keeping its top-left offset fixed.
     * @param itemId item.id to resize
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     * @note the font size and the width are scaled by the same factor, which keeps the number of
     *   graphemes a line holds roughly as it was. only roughly: the letter spacing steps up in
     *   whole pixels (see `textStyleSizeOf`), hence the text is free to re-wrap on the way.
     */
    resizeText: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "text") return;

        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        const size = textItemSizeOf(item);
        const diagonal = Math.hypot(size.x, size.y);
        // project the pointer position onto the box's diagonal to get the target diagonal length.
        const targetDiagonal = scaledCursor.dot(size) / diagonal;
        const fontSize = clampFontSize(item.fontSize * (targetDiagonal / diagonal));

        // NOTE: the width follows the factor the font size actually took, not the requested one,
        // so that it stops growing along with it once the font size hits its bounds. scaling by
        // the requested factor there would drift the two apart and re-wrap the whole text.
        item.width = Math.round(item.width * (fontSize / item.fontSize));
        item.fontSize = fontSize;
      });
    },
  } as const;
};
