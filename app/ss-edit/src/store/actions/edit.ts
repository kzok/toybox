import {
  clampArrowLength,
  clampFontSize,
  clampMosaicSide,
  clampRectSide,
  clampTextWidth,
  rectStyleSizeOf,
  textItemSizeOf,
  textStyleSizeOf,
} from "../../features/editorItem";
import { Vec2 } from "../../utils/geometry";
import type { ActionCreatorParam } from "./types";
import { dropBlankEditTarget } from "./utils";

/** minimum width/height an image item can be resized down to (canvas units) */
const MIN_IMAGE_SIZE = 36;

export const createEditActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /**
     * get into edit mode for the specified item.
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
        const fontSize = clampFontSize(item.fontSize * (targetDiagonal / diagonal));
        item.width = Math.round(item.width * (fontSize / item.fontSize));
        item.fontSize = fontSize;
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

        const { padding } = textStyleSizeOf(item);
        const scaledCursorX = cursor[0] / draft.editorView.scale;
        item.width = clampTextWidth(scaledCursorX - padding * 2, item.fontSize);
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
