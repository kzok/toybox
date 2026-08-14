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
  } as const;
};
