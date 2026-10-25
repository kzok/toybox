import { describe, expect, it } from "vitest";
import { DEFAULT_NEW_ITEM_STYLE } from "../../features/editorItem";
import { Vec2 } from "../../utils/geometry";
import {
  createRectItem,
  createTestTarget,
  createTestTargetWithItems,
  createTextItem,
} from "../actions/__tests__/fixtures";

describe("editingItem", () => {
  it("is the item under edit, with isEditingText on a text item.", () => {
    const item = createTextItem("item-1", "Hello");
    const { store, actions, atoms } = createTestTargetWithItems(item);
    actions.editMode.enter(item.id);
    expect(store.get(atoms.editingItem)).toStrictEqual(item);
    expect(store.get(atoms.isEditingText)).toBe(true);
  });

  it("is the item under edit, with isEditingText off on any other kind.", () => {
    const item = createRectItem("item-1", [0, 0]);
    const { store, actions, atoms } = createTestTargetWithItems(item);
    actions.editMode.enter(item.id);
    expect(store.get(atoms.editingItem)).toStrictEqual(item);
    expect(store.get(atoms.isEditingText)).toBe(false);
  });

  it("is null with a text item selected in select mode.", () => {
    const item = createTextItem("item-1", "Hello");
    const { store, actions, atoms } = createTestTargetWithItems(item);
    actions.selectMode.select(item.id);
    expect(store.get(atoms.editingItem)).toBeNull();
    expect(store.get(atoms.isEditingText)).toBe(false);
  });

  it("is null in edit mode on an item that does not exist.", () => {
    const { store, actions, atoms } = createTestTarget();
    actions.editMode.enter("item-1");
    expect(store.get(atoms.editingItem)).toBeNull();
    expect(store.get(atoms.isEditingText)).toBe(false);
  });
});

describe("newItemStyle", () => {
  const style = { color: "#123456", fontSize: 40, lineWidth: 6, blockSize: 12 } as const;

  it("starts from the styles that a former session stored, before anything mounts it.", () => {
    localStorage.setItem("ss-edit:new-item-style", JSON.stringify(style));
    const { store, atoms } = createTestTarget();
    expect(store.get(atoms.newItemStyle)).toStrictEqual(style);
  });

  it("starts from the default styles when the stored ones are broken.", () => {
    localStorage.setItem("ss-edit:new-item-style", JSON.stringify({ ...style, fontSize: "40" }));
    const { store, atoms } = createTestTarget();
    expect(store.get(atoms.newItemStyle)).toStrictEqual(DEFAULT_NEW_ITEM_STYLE);
  });

  it("fills the styles that a former session did not store with the default ones.", () => {
    localStorage.setItem("ss-edit:new-item-style", JSON.stringify({ color: "#123456" }));
    const { store, atoms } = createTestTarget();
    expect(store.get(atoms.newItemStyle)).toStrictEqual({
      ...DEFAULT_NEW_ITEM_STYLE,
      color: "#123456",
    });
  });

  it("stores the styles that edit mode sets for the next session.", () => {
    const item = createRectItem("item-1", [0, 0]);
    const { actions } = createTestTargetWithItems(item);
    actions.editMode.setColor(item.id, "#000");

    const { store, atoms } = createTestTarget();
    expect(store.get(atoms.newItemStyle).color).toBe("#000");
  });
});

describe("addItemPreview", () => {
  it("is the item the drag would add, in the same styles.", () => {
    const { store, actions, atoms } = createTestTarget();
    store.set(atoms.newItemStyle, {
      color: "#123456",
      fontSize: 40,
      lineWidth: 6,
      blockSize: 12,
    });
    actions.addItemMode.enter("rect");
    actions.addItemMode.updateRange(new Vec2(20, 40));
    actions.addItemMode.updateRange(new Vec2(420, 140));
    const preview = store.get(atoms.addItemPreview);

    actions.addItemMode.commit();

    expect(store.get(atoms.editorItems)).toStrictEqual([{ ...preview, id: expect.any(String) }]);
  });
});
