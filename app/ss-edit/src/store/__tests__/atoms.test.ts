import { describe, expect, it } from "vitest";
import {
  createRectItem,
  createTestTarget,
  createTestTargetWithItems,
  createTextItem,
} from "../actions/__tests__/fixtures";

describe("isEditingText", () => {
  it("is true in edit mode on a text item.", () => {
    const item = createTextItem("item-1", "Hello");
    const { store, actions, atoms } = createTestTargetWithItems(item);
    actions.editMode.enter(item.id);
    expect(store.get(atoms.isEditingText)).toBe(true);
  });

  it("is false in edit mode on any other kind.", () => {
    const item = createRectItem("item-1", [0, 0]);
    const { store, actions, atoms } = createTestTargetWithItems(item);
    actions.editMode.enter(item.id);
    expect(store.get(atoms.isEditingText)).toBe(false);
  });

  it("is false with a text item selected in select mode.", () => {
    const item = createTextItem("item-1", "Hello");
    const { store, actions, atoms } = createTestTargetWithItems(item);
    actions.selectMode.select(item.id);
    expect(store.get(atoms.isEditingText)).toBe(false);
  });

  it("is false in edit mode on an item that does not exist.", () => {
    const { store, actions, atoms } = createTestTarget();
    actions.editMode.enter("item-1");
    expect(store.get(atoms.isEditingText)).toBe(false);
  });
});
