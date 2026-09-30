import { castDraft, produce } from "immer";
import { describe, expect, it } from "vitest";
import { editorItemFromRange, type ItemRange } from "../../../features/editorItem";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import type { PageState } from "../../types";
import { createAddItemModeActions } from "../addItemMode";
import { createTestTarget, createTestTargetWithItems, createTextItem } from "./fixtures";

describe(createAddItemModeActions, () => {
  describe("enter()", () => {
    it("gets into add-item mode with no range yet.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.addItemMode.enter("text");
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("drops the blank target item of edit mode.", () => {
      const blank = createTextItem("blank-item", "");
      const { store, actions, atoms } = createTestTargetWithItems(blank);
      actions.editMode.enter(blank.id);

      actions.addItemMode.enter("text");

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
    });
  });

  describe("updateRange()", () => {
    /**
     * a view whose `canvasOffset` is (180, 110), so that a cursor at (180, 110)
     * on the pane is the origin of the canvas coordinates.
     */
    const view: PageState.View = {
      canvasSize: new Vec2(400, 300),
      offset: new Vec2(10, 20),
      scale: 2,
    };

    const setUp = () => {
      const target = createTestTarget();
      target.store.set(
        target.atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView = castDraft(view);
        }),
      );
      target.actions.addItemMode.enter("text");
      return target;
    };

    it("starts the range at the cursor, in canvas coordinates.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItemMode.updateRange(new Vec2(280, 210));
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(50, 50), new Vec2(50, 50)],
      });
    });

    it("moves only the end of the range afterwards.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItemMode.updateRange(new Vec2(280, 210));

      actions.addItemMode.updateRange(new Vec2(380, 310));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(50, 50), new Vec2(100, 100)],
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");

      actions.addItemMode.updateRange(new Vec2(280, 210));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("cancel()", () => {
    it("drops the dragged range, staying in add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.addItemMode.enter("text");
      actions.addItemMode.updateRange(new Vec2(20, 40));

      actions.addItemMode.cancel();

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("lets the next drag start its range afresh.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.addItemMode.enter("text");
      actions.addItemMode.updateRange(new Vec2(20, 40));
      actions.addItemMode.cancel();

      actions.addItemMode.updateRange(new Vec2(300, 200));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(300, 200), new Vec2(300, 200)],
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");

      actions.addItemMode.cancel();

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("commit()", () => {
    const setUpAs = (itemKind: PageState.Mode.AddItem["itemKind"], ...range: readonly Vec2[]) => {
      const target = createTestTarget();
      target.actions.addItemMode.enter(itemKind);
      for (const cursor of range) {
        target.actions.addItemMode.updateRange(cursor);
      }
      return target;
    };

    /**
     * @param itemKind kind the drag was made in
     * @param drag the drag `setUpAs` was given
     * @returns the item that drag describes, with any id allowed
     * @note the construction rules are `fromRange.test.ts`'s concern, and restating them here
     *   would only pin the same arithmetic twice. what is `commit`'s own is that it hands the
     *   drag to the factory as it stands and adds back whatever comes of it.
     */
    const itemOf = (itemKind: PageState.Mode.AddItem["itemKind"], drag: ItemRange) => ({
      ...editorItemFromRange(itemKind, drag, "any-id"),
      id: expect.any(String),
    });

    it("adds the text item the drag describes, and edits it.", () => {
      const drag: ItemRange = [new Vec2(20, 40), new Vec2(420, 88)];
      const { store, actions, atoms } = setUpAs("text", ...drag);
      actions.addItemMode.commit();

      const items = store.get(atoms.editorItems);
      expect(items).toHaveLength(1);
      expect(items[0]).toStrictEqual(itemOf("text", drag));
      // NOTE: the added item is blank, hence edited rather than selected: it has to be typed into
      //   before it is anything, and is dropped again if it never is.
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: items[0]?.id });
    });

    it("adds the rect item the drag describes, and selects it.", () => {
      const drag: ItemRange = [new Vec2(20, 40), new Vec2(420, 140)];
      const { store, actions, atoms } = setUpAs("rect", ...drag);
      actions.addItemMode.commit();

      const items = store.get(atoms.editorItems);
      expect(items).toHaveLength(1);
      expect(items[0]).toStrictEqual(itemOf("rect", drag));
      // a rect is finished the moment it is dragged out, hence selected rather than edited.
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: [items[0]?.id],
      });
    });

    it("adds the arrow item the drag describes, and selects it.", () => {
      const drag: ItemRange = [new Vec2(20, 40), new Vec2(320, 440)];
      const { store, actions, atoms } = setUpAs("arrow", ...drag);
      actions.addItemMode.commit();

      const items = store.get(atoms.editorItems);
      expect(items).toHaveLength(1);
      expect(items[0]).toStrictEqual(itemOf("arrow", drag));
      // an arrow is finished the moment it is dragged out, hence selected rather than edited.
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: [items[0]?.id],
      });
    });

    it("hands the drag over as it stands rather than sorting its corners first.", () => {
      // NOTE: an arrow dragged up and to the left, which is the case that tells the two apart:
      //   every other kind reads the same either way round, so normalising the range on the way
      //   to the factory would go unnoticed until an arrow came out pointing back at itself.
      const drag: ItemRange = [new Vec2(320, 440), new Vec2(20, 40)];
      const { store, actions, atoms } = setUpAs("arrow", ...drag);
      actions.addItemMode.commit();

      expect(store.get(atoms.editorItems)[0]).toStrictEqual(itemOf("arrow", drag));
    });

    it("keeps the state as it is when the drag never began.", () => {
      const { store, actions, atoms } = setUpAs("text");
      actions.addItemMode.commit();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectMode.select("item-1");

      actions.addItemMode.commit();

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });
});
