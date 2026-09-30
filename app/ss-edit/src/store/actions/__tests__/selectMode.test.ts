import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import { createSelectModeActions } from "../selectMode";
import {
  createArrowItem,
  createImageItem,
  createTestTarget,
  createTestTargetWithItems,
} from "./fixtures";

describe(createSelectModeActions, () => {
  describe("clear()", () => {
    it("resets the mode to its initial state.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");
      actions.selectMode.clear();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
    });

    it("resets the mode from edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.editMode.enter("item-1");
      actions.selectMode.clear();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
    });
  });

  describe("select()", () => {
    it("gets into select mode with the specified item.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.selectMode.select("item-1");
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorMode = { kind: "select", selectedIds: ["item-1"] };
        }),
      );
    });

    it("replaces the selection on single selection.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");
      actions.selectMode.select("item-2", true);

      actions.selectMode.select("item-3");

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-3"],
      });
    });

    it("adds the item to the selection on multi selection.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");
      actions.selectMode.select("item-2", true);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1", "item-2"],
      });
    });

    it("removes the item from the selection on multi selection when it is already selected.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");
      actions.selectMode.select("item-2", true);

      actions.selectMode.select("item-1", true);

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-2"],
      });
    });

    it("starts a new selection on multi selection from edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.editMode.enter("item-1");

      actions.selectMode.select("item-2", true);

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-2"],
      });
    });
  });

  describe("move()", () => {
    const setUp = () => {
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      const target = createTestTargetWithItems(item1, item2);
      return { ...target, item1, item2 } as const;
    };

    it("selects the trigger item and moves it when it is not selected.", () => {
      const { store, actions, atoms, item1, item2 } = setUp();
      actions.selectMode.move(item1.id, [10, 20]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: [item1.id],
      });
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
      expect(items.find((item) => item.id === item2.id)?.offset).toStrictEqual(item2.offset);
    });

    it("moves every selected item when the trigger item is already selected.", () => {
      const { store, actions, atoms, item1, item2 } = setUp();
      actions.selectMode.select(item1.id);
      actions.selectMode.select(item2.id, true);

      actions.selectMode.move(item1.id, [10, 20]);

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: [item1.id, item2.id],
      });
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
      expect(items.find((item) => item.id === item2.id)?.offset).toStrictEqual([110, 120]);
    });

    it("scales the movement delta by the inverse of the view scale.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      actions.selectMode.move(item1.id, [10, 20]);

      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([5, 10]);
    });

    it("keeps the very same items list on a zero delta, which would count as unsaved otherwise.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectMode.select(item1.id);
      const before = store.get(atoms.editorItems);

      actions.selectMode.move(item1.id, [0, 0]);

      expect(store.get(atoms.editorItems)).toBe(before);
    });

    it("ignores selected ids that no longer match an existing item.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectMode.select(item1.id);
      actions.selectMode.select("missing-id", true);

      expect(() => actions.selectMode.move(item1.id, [10, 20])).not.toThrow();
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
    });

    it("moves an arrow item by its tail, leaving the direction and the length alone.", () => {
      // NOTE: an arrow's `offset` is the tail rather than a corner of its box, so a move is worth
      //   pinning down on one: it happens to need no case of its own only because the whole shape
      //   follows from `offset`, `length` and `angle`, and a move touches the first alone.
      const arrow = createArrowItem("arrow-1", [100, 100], Math.PI);
      const { store, actions, atoms } = createTestTargetWithItems(arrow);

      actions.selectMode.move(arrow.id, [10, 20]);

      const moved = store.get(atoms.editorItems)[0];
      expect(moved?.offset).toStrictEqual([110, 120]);
      expect(moved?.kind === "arrow" && moved.length).toBe(arrow.length);
      expect(moved?.kind === "arrow" && moved.angle).toBe(arrow.angle);
    });
  });

  describe("deleteSelected()", () => {
    const setUp = () => {
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      const item3 = createImageItem("item-3", [200, 200]);
      const target = createTestTargetWithItems(item1, item2, item3);
      return { ...target, item1, item2, item3 } as const;
    };

    it("drops every selected item, keeping the rest.", () => {
      const { store, actions, atoms, item1, item2, item3 } = setUp();
      actions.selectMode.select(item1.id);
      actions.selectMode.select(item3.id, true);

      actions.selectMode.deleteSelected();

      expect(store.get(atoms.editorItems).map((item) => item.id)).toStrictEqual([item2.id]);
    });

    it("leaves nothing selected.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectMode.select(item1.id);

      actions.selectMode.deleteSelected();

      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "select", selectedIds: [] });
    });

    it("drops the item under edit in edit mode, keeping the rest.", () => {
      const { store, actions, atoms, item1, item2, item3 } = setUp();
      actions.editMode.enter(item2.id);

      actions.selectMode.deleteSelected();

      expect(store.get(atoms.editorItems).map((item) => item.id)).toStrictEqual([
        item1.id,
        item3.id,
      ]);
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "select", selectedIds: [] });
    });

    it("does nothing in add-item mode.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItemMode.enter("rect");
      const before = store.get(atoms.state);

      actions.selectMode.deleteSelected();

      expect(store.get(atoms.state)).toBe(before);
    });

    it("does not count as a change when nothing is selected.", () => {
      const { store, actions, atoms } = setUp();
      store.set(atoms.savedItems, store.get(atoms.editorItems));
      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);

      actions.selectMode.deleteSelected();

      // NOTE: rewriting the list, identical or not, would have made this true.
      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);
    });
  });

  describe("bringToFront() / sendToBack()", () => {
    const setUp = () => {
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      const item3 = createImageItem("item-3", [200, 200]);
      const item4 = createImageItem("item-4", [300, 300]);
      const target = createTestTargetWithItems(item1, item2, item3, item4);
      const idsOf = () => target.store.get(target.atoms.editorItems).map((item) => item.id);
      return { ...target, idsOf, item1, item2, item3, item4 } as const;
    };

    it("brings every selected item to the front, keeping their relative order.", () => {
      const { actions, idsOf, item1, item2, item3, item4 } = setUp();
      actions.selectMode.select(item3.id);
      actions.selectMode.select(item1.id, true);

      actions.selectMode.bringToFront();

      expect(idsOf()).toStrictEqual([item2.id, item4.id, item1.id, item3.id]);
    });

    it("sends every selected item to the back, keeping their relative order.", () => {
      const { actions, idsOf, item1, item2, item3, item4 } = setUp();
      actions.selectMode.select(item4.id);
      actions.selectMode.select(item2.id, true);

      actions.selectMode.sendToBack();

      expect(idsOf()).toStrictEqual([item2.id, item4.id, item1.id, item3.id]);
    });

    it("moves the item under edit in edit mode, staying in edit mode.", () => {
      const { store, actions, atoms, idsOf, item1, item2, item3, item4 } = setUp();
      actions.editMode.enter(item2.id);

      actions.selectMode.bringToFront();
      expect(idsOf()).toStrictEqual([item1.id, item3.id, item4.id, item2.id]);

      actions.selectMode.sendToBack();
      expect(idsOf()).toStrictEqual([item2.id, item1.id, item3.id, item4.id]);

      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: item2.id });
    });

    it("keeps the very same items list when the selection is already in place, which would count as unsaved otherwise.", () => {
      const { store, actions, atoms, item1, item4 } = setUp();
      const before = store.get(atoms.editorItems);

      actions.selectMode.select(item4.id);
      actions.selectMode.bringToFront();
      expect(store.get(atoms.editorItems)).toBe(before);

      actions.selectMode.select(item1.id);
      actions.selectMode.sendToBack();
      expect(store.get(atoms.editorItems)).toBe(before);
    });

    it("does nothing when nothing is selected.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.state);

      actions.selectMode.bringToFront();
      actions.selectMode.sendToBack();

      expect(store.get(atoms.state)).toBe(before);
    });

    it("does nothing in add-item mode.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItemMode.enter("rect");
      const before = store.get(atoms.state);

      actions.selectMode.bringToFront();
      actions.selectMode.sendToBack();

      expect(store.get(atoms.state)).toBe(before);
    });
  });
});
