import { castDraft, produce } from "immer";
import { describe, expect, it } from "vitest";
import { clampArrowLength, type EditorItem } from "../../../features/editorItem";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import type { PageState } from "../../types";
import { createAddItemActions } from "../addItem";
import { createTestTarget, createTestTargetWithItems, createTextItem } from "./fixtures";

describe(createAddItemActions, () => {
  describe("enter()", () => {
    it("gets into add-item mode with no range yet.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.addItem.enter("text");
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("drops the blank target item of edit mode.", () => {
      const blank = createTextItem("blank-item", "");
      const { store, actions, atoms } = createTestTargetWithItems(blank);
      actions.edit.enter(blank.id);

      actions.addItem.enter("text");

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
      target.actions.addItem.enter("text");
      return target;
    };

    it("starts the range at the cursor, in canvas coordinates.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItem.updateRange(new Vec2(280, 210));
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(50, 50), new Vec2(50, 50)],
      });
    });

    it("moves only the end of the range afterwards.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItem.updateRange(new Vec2(280, 210));

      actions.addItem.updateRange(new Vec2(380, 310));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(50, 50), new Vec2(100, 100)],
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");

      actions.addItem.updateRange(new Vec2(280, 210));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("cancel()", () => {
    it("drops the dragged range, staying in add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.addItem.enter("text");
      actions.addItem.updateRange(new Vec2(20, 40));

      actions.addItem.cancel();

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("lets the next drag start its range afresh.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.addItem.enter("text");
      actions.addItem.updateRange(new Vec2(20, 40));
      actions.addItem.cancel();

      actions.addItem.updateRange(new Vec2(300, 200));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(300, 200), new Vec2(300, 200)],
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");

      actions.addItem.cancel();

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("commit()", () => {
    const setUpAs = (itemKind: PageState.Mode.AddItem["itemKind"], ...range: readonly Vec2[]) => {
      const target = createTestTarget();
      target.actions.addItem.enter(itemKind);
      for (const cursor of range) {
        target.actions.addItem.updateRange(cursor);
      }
      return target;
    };

    /**
     * @param item editor item
     * @returns its text layout, or null if it is not a text item.
     */
    const layoutOf = (item: EditorItem | undefined) =>
      item?.kind === "text" ? { width: item.width, fontSize: item.fontSize } : null;

    it("adds a blank text item sized by the dragged range and edits it.", () => {
      const { store, actions, atoms } = setUpAs("text", new Vec2(20, 40), new Vec2(420, 88));
      actions.addItem.commit();

      const items = store.get(atoms.editorItems);
      expect(items).toHaveLength(1);
      expect(items[0]).toStrictEqual({
        kind: "text",
        id: expect.any(String),
        content: "",
        offset: [20, 40],
        width: 400,
        // the dragged height (48px) is a single line box of this font size.
        fontSize: 32,
        color: expect.any(String),
      });
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: items[0]?.id });
    });

    it("sorts the corners of a range dragged up and left.", () => {
      const { store, actions, atoms } = setUpAs("text", new Vec2(420, 88), new Vec2(20, 40));
      actions.addItem.commit();

      expect(store.get(atoms.editorItems)[0]?.offset).toStrictEqual([20, 40]);
    });

    it("widens a range too narrow for ten characters of its font size.", () => {
      const { store, actions, atoms } = setUpAs("text", new Vec2(20, 40), new Vec2(120, 88));
      actions.addItem.commit();

      expect(layoutOf(store.get(atoms.editorItems)[0])).toStrictEqual({
        width: 320, // = fontSize * 10, instead of the dragged 100px.
        fontSize: 32,
      });
    });

    it("clamps the font size of a range smaller than a font can be.", () => {
      // a click leaves a range of a single point behind.
      const { store, actions, atoms } = setUpAs("text", new Vec2(20, 40), new Vec2(20, 40));
      actions.addItem.commit();

      expect(layoutOf(store.get(atoms.editorItems)[0])).toStrictEqual({ width: 120, fontSize: 12 });
    });

    it("clamps the font size of a range larger than a font can be.", () => {
      const { store, actions, atoms } = setUpAs("text", new Vec2(20, 40), new Vec2(120, 640));
      actions.addItem.commit();

      expect(layoutOf(store.get(atoms.editorItems)[0])).toStrictEqual({ width: 720, fontSize: 72 });
    });

    it("adds a rect item sized by the dragged range and selects it.", () => {
      const { store, actions, atoms } = setUpAs("rect", new Vec2(20, 40), new Vec2(420, 140));
      actions.addItem.commit();

      const items = store.get(atoms.editorItems);
      expect(items).toHaveLength(1);
      expect(items[0]).toStrictEqual({
        kind: "rect",
        id: expect.any(String),
        offset: [20, 40],
        width: 400,
        height: 100,
        color: expect.any(String),
        lineWidth: expect.any(Number),
      });
      // a rect is finished the moment it is dragged out, hence selected rather than edited.
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: [items[0]?.id],
      });
    });

    it("grows a rect item dragged too small to be grabbed again.", () => {
      // a click leaves a range of a single point behind.
      const { store, actions, atoms } = setUpAs("rect", new Vec2(20, 40), new Vec2(20, 40));
      actions.addItem.commit();

      const item = store.get(atoms.editorItems)[0];
      expect(item?.kind === "rect" && [item.width, item.height]).toStrictEqual([36, 36]);
      // the head of the drag is kept, so the item grows away from where it started.
      expect(item?.offset).toStrictEqual([20, 40]);
    });

    it("adds an arrow item running from the head of the drag to its end, and selects it.", () => {
      // dragged right and down, three-four-five, hence a length of 500.
      const { store, actions, atoms } = setUpAs("arrow", new Vec2(20, 40), new Vec2(320, 440));
      actions.addItem.commit();

      const items = store.get(atoms.editorItems);
      expect(items).toHaveLength(1);
      const item = items[0];
      expect(item?.kind).toBe("arrow");
      // the offset is the tail, which is where the drag started rather than a corner of its box.
      expect(item?.offset).toStrictEqual([20, 40]);
      expect(item?.kind === "arrow" && item.length).toBeCloseTo(500);
      expect(item?.kind === "arrow" && item.angle).toBeCloseTo(Math.atan2(400, 300));
      // an arrow is finished the moment it is dragged out, hence selected rather than edited.
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: [item?.id],
      });
    });

    it("keeps an arrow item's tail where the drag began when it is dragged backwards.", () => {
      // NOTE: the case a normalised head/size loses. the drag runs up and to the left, so the
      //   tail is the bottom right of the box the two points span rather than its top left.
      const { store, actions, atoms } = setUpAs("arrow", new Vec2(320, 440), new Vec2(20, 40));
      actions.addItem.commit();

      const item = store.get(atoms.editorItems)[0];
      expect(item?.offset).toStrictEqual([320, 440]);
      expect(item?.kind === "arrow" && item.angle).toBeCloseTo(Math.atan2(-400, -300));
    });

    it("grows an arrow dragged too small, leaving it pointing right.", () => {
      // a click leaves a range of a single point behind.
      const { store, actions, atoms } = setUpAs("arrow", new Vec2(20, 40), new Vec2(20, 40));
      actions.addItem.commit();

      const item = store.get(atoms.editorItems)[0];
      expect(item?.kind === "arrow" && item.length).toBe(clampArrowLength(0));
      // `Math.atan2(0, 0)` is +0, so a click needs no case of its own to point somewhere.
      expect(item?.kind === "arrow" && item.angle).toBe(0);
      expect(item?.offset).toStrictEqual([20, 40]);
    });

    it("keeps the state as it is when the drag never began.", () => {
      const { store, actions, atoms } = setUpAs("text");
      actions.addItem.commit();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selection.select("item-1");

      actions.addItem.commit();

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });
});
