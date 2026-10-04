import {
  clampArrowLength,
  clampFontSize,
  clampMosaicSide,
  clampRectSide,
  clampTextWidth,
  rectStyleSizeOf,
  textItemSizeOf,
} from "../../features/editorItem";
import { Vec2 } from "../../utils/geometry";
import type { ActionCreatorParam } from "./types";
import { moveItems, switchMode } from "./utils";

/** minimum width/height an image item can be resized down to (canvas units) */
const MIN_IMAGE_SIZE = 36;

/** actions specific to edit mode */
export const createEditModeActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /** get into edit mode for the specified item. */
    enter: (itemId: string): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind === "edit" && draft.editorMode.itemId === itemId) {
          return; // already editing it, hence not leaving edit mode.
        }
        switchMode(draft, { kind: "edit", itemId });
      });
    },
    /**
     * update the content of a text item.
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
     * move the item under edit, staying in edit mode.
     * @param delta [movementX, movementY]
     */
    move: (delta: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        if (draft.editorMode.kind !== "edit") return;
        moveItems(draft, [draft.editorMode.itemId], delta);
      });
    },
    /**
     * resize an image item, keeping its aspect ratio and its top-left offset fixed.
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
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     */
    resizeTextFontSize: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "text") return;

        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        const size = textItemSizeOf(item);
        const diagonal = Math.hypot(size.x, size.y);
        // project the pointer position onto the box's diagonal to get the target diagonal length.
        const targetDiagonal = scaledCursor.dot(size) / diagonal;
        scaleTextFontSize(item, item.fontSize * (targetDiagonal / diagonal));
      });
    },
    /**
     * set the font size of a text item, keeping its top-left offset fixed.
     * @param fontSize desired font size (px), fractional or out of range
     */
    setTextFontSize: (itemId: string, fontSize: number): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "text") return;
        scaleTextFontSize(item, fontSize);
      });
    },
    /**
     * set the color of an item, if its kind has one.
     * @param color CSS color value
     */
    setColor: (itemId: string, color: string): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item == null || !("color" in item)) return;
        item.color = color;
      });
    },
    /**
     * resize the width of a text item, keeping its font size and its top-left offset fixed.
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     */
    resizeTextWidth: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "text") return;

        const scaledCursorX = cursor[0] / draft.editorView.scale;
        item.width = clampTextWidth(scaledCursorX, item.fontSize);
      });
    },
    /**
     * resize a rect item, keeping its top-left offset fixed.
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     */
    resizeRect: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "rect") return;

        const { padding } = rectStyleSizeOf(item);
        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        item.width = clampRectSide(scaledCursor.x - padding * 2);
        item.height = clampRectSide(scaledCursor.y - padding * 2);
      });
    },
    /**
     * resize a mosaic item, keeping its top-left offset fixed.
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     */
    resizeMosaic: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "mosaic") return;

        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        item.width = clampMosaicSide(scaledCursor.x);
        item.height = clampMosaicSide(scaledCursor.y);
      });
    },
    /**
     * move the tip of an arrow item, keeping its tail where it is.
     * @param cursor where the tip should go, measured from the item's tail
     */
    resizeArrowTip: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "arrow") return;

        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        item.length = clampArrowLength(scaledCursor.distance(Vec2.ORIGIN));
        item.angle = scaledCursor.angle();
      });
    },
    /**
     * move the tail of an arrow item, keeping its tip where it is.
     * @param cursor where the tail should go, measured from the item's current tail
     */
    resizeArrowTail: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "arrow") return;

        const tail = Vec2.new(item.offset);
        const tip = tail.add(Vec2.polar(item.length, item.angle));
        const newTail = tail.add(Vec2.new(cursor).div(draft.editorView.scale));
        const toTip = tip.sub(newTail);

        const length = clampArrowLength(toTip.distance(Vec2.ORIGIN));
        const angle = toTip.angle();
        item.offset = tip.sub(Vec2.polar(length, angle)).tuple();
        item.length = length;
        item.angle = angle;
      });
    },
  } as const;
};

/**
 * set the font size of a text item and scale its width by the same factor, so that the same words
 * stay on the same lines.
 * @param fontSize desired font size (px), fractional or out of range
 */
const scaleTextFontSize = (item: { width: number; fontSize: number }, fontSize: number): void => {
  const clamped = clampFontSize(fontSize);
  item.width = Math.round(item.width * (clamped / item.fontSize));
  item.fontSize = clamped;
};
