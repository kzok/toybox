import { castDraft, produce } from "immer";
import { describe, expect, it } from "vitest";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import { switchMode } from "../utils";
import { createTextItem } from "./fixtures";

describe(switchMode, () => {
  const editingBlankText = produce(INITIAL_EDITOR_STATE, (draft) => {
    draft.editorItems.push(castDraft(createTextItem("item-1", "")));
    draft.editorMode = { kind: "edit", itemId: "item-1" };
  });

  it("drops the blank text item when the edit leaves it.", () => {
    const next = produce(editingBlankText, (draft) => {
      switchMode(draft, INITIAL_EDITOR_STATE.editorMode);
    });
    expect(next.editorItems).toStrictEqual([]);
  });

  it("keeps the blank text item when the edit stays on it.", () => {
    const next = produce(editingBlankText, (draft) => {
      switchMode(draft, { kind: "edit", itemId: "item-1" });
    });
    expect(next.editorItems).toHaveLength(1);
  });
});
