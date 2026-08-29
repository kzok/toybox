import {
  clampArrowLength,
  clampFontSize,
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
     *   graphemes a line holds as it was — `textStyleSizeOf` keeps the letter spacing proportional
     *   to the font size for this. only as far as the font itself is linear, though: its hinting
     *   is not, hence the text stays free to re-wrap on the way.
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

        // NOTE: the width follows the factor the font size actually took, not the requested one,
        // so that it stops growing along with it once the font size hits its bounds. scaling by
        // the requested factor there would drift the two apart and re-wrap the whole text.
        item.width = Math.round(item.width * (fontSize / item.fontSize));
        item.fontSize = fontSize;
      });
    },
    /**
     * resize the width of a text item, keeping its font size and its top-left offset fixed.
     * @param itemId item.id to resize
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     * @note only the x component is read: the height follows from how the text wraps at the new
     *   width. unlike `resizeTextFontSize`, re-wrapping is what this is for rather than what it
     *   avoids.
     * @note the padding is subtracted because `cursor` is measured against the drawn box, which
     *   `textStyleSizeOf` pads on every side, while `width` names the content box alone. it is a
     *   constant offset here, the padding following the font size this leaves untouched.
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
     * @param itemId item.id to resize
     * @param cursor [width, height] distance from the item's top-left offset to the pointer
     * @note the two sides are taken independently, unlike an image's: a screenshot has proportions
     *   worth keeping, a box drawn around part of one does not.
     * @note the padding is subtracted because `cursor` is measured against the drawn box, which
     *   `rectStyleSizeOf` pads on every side, while `width`/`height` name the box the line runs
     *   along. it is a constant offset here, the padding following the line width this leaves
     *   untouched.
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
     * move the tip of an arrow item, keeping its tail where it is.
     * @param itemId item.id to resize
     * @param cursor where the tip should go, measured from the item's tail
     * @note no padding is taken off, unlike a rect's: the handle grips the tip itself rather than
     *   a corner of a padded box, so what it reports is already the point the tip should land on.
     */
    resizeArrowTip: (itemId: string, cursor: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "arrow") return;

        const scaledCursor = Vec2.new(cursor).div(draft.editorView.scale);
        item.length = clampArrowLength(scaledCursor.distance(Vec2.ORIGIN));
        // NOTE: the angle follows the pointer even where the length has stopped at its minimum, so
        // that a arrow held below that length can still be turned.
        item.angle = scaledCursor.angle();
      });
    },
    /**
     * move the tail of an arrow item, keeping its tip where it is.
     * @param itemId item.id to resize
     * @param cursor where the tail should go, measured from the item's current tail
     * @note the tail is derived back from the tip rather than set to `cursor` outright. the two
     *   agree until the length hits its minimum, and there the derived one is what keeps the tip
     *   still: setting the tail and clamping the length independently would drag the tip along.
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
