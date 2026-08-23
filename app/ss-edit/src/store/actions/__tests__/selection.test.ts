import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import { createSelectionActions } from "../selection";
import { createImageItem, createTestTarget, createTestTargetWithItems } from "./fixtures";

describe(createSelectionActions, () => {
  describe("clear()", () => {
    it("resets the mode to its initial state.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");
      actions.selection.clear();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
    });

    it("resets the mode from edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.edit.enter("item-1");
      actions.selection.clear();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
    });
  });

  describe("select()", () => {
    it("gets into select mode with the specified item.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.selection.select("item-1");
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorMode = { kind: "select", selectedIds: ["item-1"] };
        }),
      );
    });

    it("replaces the selection on single selection.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");
      actions.selection.select("item-2", true);

      actions.selection.select("item-3");

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-3"],
      });
    });

    it("adds the item to the selection on multi selection.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");
      actions.selection.select("item-2", true);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1", "item-2"],
      });
    });

    it("removes the item from the selection on multi selection when it is already selected.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");
      actions.selection.select("item-2", true);

      actions.selection.select("item-1", true);

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-2"],
      });
    });

    it("starts a new selection on multi selection from edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.edit.enter("item-1");

      actions.selection.select("item-2", true);

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
      actions.selection.move(item1.id, [10, 20]);
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
      actions.selection.select(item1.id);
      actions.selection.select(item2.id, true);

      actions.selection.move(item1.id, [10, 20]);

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

      actions.selection.move(item1.id, [10, 20]);

      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([5, 10]);
    });

    it("ignores selected ids that no longer match an existing item.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selection.select(item1.id);
      actions.selection.select("missing-id", true);

      expect(() => actions.selection.move(item1.id, [10, 20])).not.toThrow();
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
    });
  });
});
