import type { Draft } from "immer";
import type { PageState } from "../types";

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
