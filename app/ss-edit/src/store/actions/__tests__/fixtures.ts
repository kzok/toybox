import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import type { EditorItem } from "../../../features/editorItem";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
import { createActions } from "..";

/**
 * @returns a fresh store, its atoms and the whole action set bound to them.
 * @note the whole set rather than a single group, because a transition often has to be
 *   set up or observed through another group.
 */
export const createTestTarget = () => {
  const store = createStore();
  const atoms = createAtoms();
  const actions = createActions(store, atoms);
  return { store, actions, atoms } as const;
};

/**
 * @param items items the picture starts with
 * @returns a test target whose picture already holds the given items
 */
export const createTestTargetWithItems = (...items: readonly EditorItem[]) => {
  const target = createTestTarget();
  target.store.set(
    target.atoms.state,
    produce(INITIAL_EDITOR_STATE, (draft) => {
      draft.editorItems.push(...items.map(castDraft));
    }),
  );
  return target;
};

/**
 * @param id item.id
 * @param offset top-left offset in canvas coordinates
 * @returns an image item of 100 x 50 (aspect ratio 2:1)
 */
export const createImageItem = (
  id: string,
  offset: EditorItem.Image["offset"],
): EditorItem.Image => ({
  kind: "image",
  id,
  data: {} as ImageBitmap,
  offset,
  width: 100,
  height: 50,
});

/**
 * @param id item.id
 * @param offset top-left offset in canvas coordinates
 * @returns a rect item of 100 x 50, outlined at a line width of 4
 * @note a line width of 4 makes the drawn box 7px wider and taller than the 100 x 50 the line
 *   runs along (see `rectStyleSizeOf`), which is what a resize is measured against.
 */
export const createRectItem = (id: string, offset: EditorItem.Rect["offset"]): EditorItem.Rect => ({
  kind: "rect",
  id,
  offset,
  width: 100,
  height: 50,
  color: "#fff",
  lineWidth: 4,
});

/**
 * @param id item.id
 * @param offset top-left offset in canvas coordinates
 * @returns a mosaic item of 100 x 50
 */
export const createMosaicItem = (
  id: string,
  offset: EditorItem.Mosaic["offset"],
): EditorItem.Mosaic => ({
  kind: "mosaic",
  id,
  offset,
  width: 100,
  height: 50,
});

/**
 * @param id item.id
 * @param offset the tail of the arrow in canvas coordinates
 * @param angle direction the arrow points, in radians, defaulting to right
 * @returns an arrow item 200 long
 * @note `offset` is the tail rather than a corner of the item's box, unlike every other kind's
 *   (see `EditorItem.Arrow`), so an arrow whose angle points up or left has its box reach back
 *   past the offset it is given here.
 */
export const createArrowItem = (
  id: string,
  offset: EditorItem.Arrow["offset"],
  angle: number = 0,
): EditorItem.Arrow => ({
  kind: "arrow",
  id,
  offset,
  length: 200,
  angle,
  color: "#fff",
});

/**
 * @param id item.id
 * @param content text content
 * @returns a text item
 */
export const createTextItem = (id: string, content: string): EditorItem.Text => ({
  kind: "text",
  id,
  content,
  offset: [0, 0],
  width: 100,
  fontSize: 32,
  color: "#fff",
});
