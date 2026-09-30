import { castDraft, type Draft } from "immer";
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

/** @returns the ids of the items that the actions on the selection act on in the mode */
export const targetIdsOf = (mode: PageState.Mode): readonly string[] => {
  switch (mode.kind) {
    case "select":
      return mode.selectedIds;
    case "edit":
      return [mode.itemId];
    case "add-item":
      return [];
    default:
      mode satisfies never;
      return [];
  }
};

/**
 * switch the editor mode.
 *
 * every transition goes through this rather than assigning `editorMode`, so that a text item
 * whose content was entirely erased never survives the edit.
 * @param draft entire page state
 * @param mode the mode to switch to
 */
export const switchMode = (draft: Draft<PageState>, mode: PageState.Mode): void => {
  const current = draft.editorMode;
  const staysOnEditTarget =
    current.kind === "edit" && mode.kind === "edit" && current.itemId === mode.itemId;
  if (!staysOnEditTarget) dropBlankEditTarget(draft);
  draft.editorMode = castDraft(mode);
};

/**
 * drop the target text item of edit mode when its content is blank.
 * @param draft entire page state
 */
const dropBlankEditTarget = (draft: Draft<PageState>): void => {
  if (draft.editorMode.kind !== "edit") return;
  const { itemId } = draft.editorMode;
  const index = draft.editorItems.findIndex(
    (item) => item.id === itemId && item.kind === "text" && item.content.trim() === "",
  );
  if (index < 0) return;
  draft.editorItems.splice(index, 1);
};
