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
});
