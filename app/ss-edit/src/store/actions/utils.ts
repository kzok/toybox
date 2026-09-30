import type { Draft } from "immer";
import { Vec2 } from "../../utils/geometry";
import type { PageState } from "../types";

/**
 * move the specified items along the pointer movement.
 * @param draft entire page state
 * @param itemIds ids of the items to move
 * @param delta [movementX, movementY]
 */
export const moveItems = (
  draft: Draft<PageState>,
  itemIds: readonly string[],
  delta: Vec2.Tuple,
): void => {
  if (delta[0] === 0 && delta[1] === 0) return;
  const scaledDelta = Vec2.new(delta).div(draft.editorView.scale);
  for (const item of draft.editorItems) {
    if (!itemIds.includes(item.id)) continue;
    item.offset = scaledDelta.add(item.offset).tuple();
  }
};

/**
 * drop the target text item of edit mode when its content is blank.
 *
 * every transition leaving edit mode goes through this, so that a text item
 * whose content was entirely erased never survives the edit.
 * @param draft entire page state
 */
export const dropBlankEditTarget = (draft: Draft<PageState>): void => {
  if (draft.editorMode.kind !== "edit") return;
  const { itemId } = draft.editorMode;
  const index = draft.editorItems.findIndex(
    (item) => item.id === itemId && item.kind === "text" && item.content.trim() === "",
  );
  if (index < 0) return;
  draft.editorItems.splice(index, 1);
};
