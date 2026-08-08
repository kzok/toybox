import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import type { EditorItem } from "../../../features/editorItem";
import { Vec2 } from "../../../utils/geometry";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
import type { PageState } from "../../types";
import { createActions } from "..";
import { createEditorModeActions } from "../editorMode";

describe(createEditorModeActions, () => {
  const createTestTarget = () => {
    const store = createStore();
    const atoms = createAtoms();
    const actions = createActions(store, atoms).editorMode;
    return { store, actions, atoms } as const;
  };

  const createTextItem = (id: string, content: string): EditorItem.Text => ({
    kind: "text",
    id,
    content,
    offset: [0, 0],
    width: 100,
    fontSize: 32,
    color: "#fff",
  });

  const createTestTargetWithItems = (...items: readonly EditorItem.Text[]) => {
    const target = createTestTarget();
    target.store.set(
      target.atoms.state,
      produce(INITIAL_EDITOR_STATE, (draft) => {
        draft.editorItems.push(...items.map(castDraft));
      }),
    );
    return target;
  };

  describe("clear()", () => {
    it("resets the mode to its initial state.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");
      actions.clear();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
    });

    it("resets the mode from edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.enterEdit("item-1");
      actions.clear();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
    });
  });

  describe("selectItem()", () => {
    it("gets into select mode with the specified item.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.selectItem("item-1");
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorMode = { kind: "select", selectedIds: ["item-1"] };
        }),
      );
    });

    it("replaces the selection on single selection.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");
      actions.selectItem("item-2", true);

      actions.selectItem("item-3");

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-3"],
      });
    });

    it("adds the item to the selection on multi selection.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");
      actions.selectItem("item-2", true);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1", "item-2"],
      });
    });

    it("removes the item from the selection on multi selection when it is already selected.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");
      actions.selectItem("item-2", true);

      actions.selectItem("item-1", true);

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-2"],
      });
    });

    it("starts a new selection on multi selection from edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.enterEdit("item-1");

      actions.selectItem("item-2", true);

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-2"],
      });
    });
  });

  describe("enterEdit()", () => {
    it("gets into edit mode with the specified item.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.enterEdit("item-1");
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorMode = { kind: "edit", itemId: "item-1" };
        }),
      );
    });

    it("overwrites the target item of edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.enterEdit("item-1");
      actions.enterEdit("item-2");
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: "item-2" });
    });

    it("keeps the state as it is when the item is already being edited.", () => {
      const item = createTextItem("item-1", "");
      const { store, actions, atoms } = createTestTargetWithItems(item);
      actions.enterEdit(item.id);

      actions.enterEdit(item.id);

      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: item.id });
      expect(store.get(atoms.editorItems)).toStrictEqual([item]);
    });
  });

  describe("enterAddItem()", () => {
    it("gets into add-item mode with no range yet.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.enterAddItem("text");
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("drops the blank target item of edit mode.", () => {
      const blank = createTextItem("blank-item", "");
      const { store, actions, atoms } = createTestTargetWithItems(blank);
      actions.enterEdit(blank.id);

      actions.enterAddItem("text");

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
    });
  });

  describe("updateAddItemRange()", () => {
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
      target.actions.enterAddItem("text");
      return target;
    };

    it("starts the range at the cursor, in canvas coordinates.", () => {
      const { store, actions, atoms } = setUp();
      actions.updateAddItemRange(new Vec2(280, 210));
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(50, 50), new Vec2(50, 50)],
      });
    });

    it("moves only the end of the range afterwards.", () => {
      const { store, actions, atoms } = setUp();
      actions.updateAddItemRange(new Vec2(280, 210));

      actions.updateAddItemRange(new Vec2(380, 310));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(50, 50), new Vec2(100, 100)],
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");

      actions.updateAddItemRange(new Vec2(280, 210));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("cancelAddItem()", () => {
    it("drops the dragged range, staying in add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.enterAddItem("text");
      actions.updateAddItemRange(new Vec2(20, 40));

      actions.cancelAddItem();

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("lets the next drag start its range afresh.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.enterAddItem("text");
      actions.updateAddItemRange(new Vec2(20, 40));
      actions.cancelAddItem();

      actions.updateAddItemRange(new Vec2(300, 200));

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: [new Vec2(300, 200), new Vec2(300, 200)],
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");

      actions.cancelAddItem();

      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("commitAddItem()", () => {
    const setUp = (...range: readonly Vec2[]) => {
      const target = createTestTarget();
      target.actions.enterAddItem("text");
      for (const cursor of range) {
        target.actions.updateAddItemRange(cursor);
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
      const { store, actions, atoms } = setUp(new Vec2(20, 40), new Vec2(420, 88));
      actions.commitAddItem();

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
      const { store, actions, atoms } = setUp(new Vec2(420, 88), new Vec2(20, 40));
      actions.commitAddItem();

      expect(store.get(atoms.editorItems)[0]?.offset).toStrictEqual([20, 40]);
    });

    it("widens a range too narrow for ten characters of its font size.", () => {
      const { store, actions, atoms } = setUp(new Vec2(20, 40), new Vec2(120, 88));
      actions.commitAddItem();

      expect(layoutOf(store.get(atoms.editorItems)[0])).toStrictEqual({
        width: 320, // = fontSize * 10, instead of the dragged 100px.
        fontSize: 32,
      });
    });

    it("clamps the font size of a range smaller than a font can be.", () => {
      // a click leaves a range of a single point behind.
      const { store, actions, atoms } = setUp(new Vec2(20, 40), new Vec2(20, 40));
      actions.commitAddItem();

      expect(layoutOf(store.get(atoms.editorItems)[0])).toStrictEqual({ width: 120, fontSize: 12 });
    });

    it("clamps the font size of a range larger than a font can be.", () => {
      const { store, actions, atoms } = setUp(new Vec2(20, 40), new Vec2(120, 640));
      actions.commitAddItem();

      expect(layoutOf(store.get(atoms.editorItems)[0])).toStrictEqual({ width: 720, fontSize: 72 });
    });

    it("keeps the state as it is when the drag never began.", () => {
      const { store, actions, atoms } = setUp();
      actions.commitAddItem();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "add-item",
        itemKind: "text",
        range: null,
      });
    });

    it("keeps the state as it is when the mode is not add-item mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.selectItem("item-1");

      actions.commitAddItem();

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: ["item-1"],
      });
    });
  });

  describe("leaving edit mode", () => {
    const blank = createTextItem("blank-item", " \n ");
    const filled = createTextItem("filled-item", "hello");

    const setUp = () => {
      const target = createTestTargetWithItems(blank, filled);
      target.actions.enterEdit(blank.id);
      return target;
    };

    it("drops the blank target item on clear().", () => {
      const { store, actions, atoms } = setUp();
      actions.clear();
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("drops the blank target item on selectItem().", () => {
      const { store, actions, atoms } = setUp();
      actions.selectItem(filled.id);
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("drops the blank target item on entering edit mode for another item.", () => {
      const { store, actions, atoms } = setUp();
      actions.enterEdit(filled.id);
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("keeps the target item when its content is not blank.", () => {
      const { store, actions, atoms } = createTestTargetWithItems(blank, filled);
      actions.enterEdit(filled.id);

      actions.clear();

      // blank items other than the target one are left as they are.
      expect(store.get(atoms.editorItems)).toStrictEqual([blank, filled]);
    });

    it("keeps items as they are when the mode is not edit mode.", () => {
      const { store, actions, atoms } = createTestTargetWithItems(blank, filled);
      actions.selectItem(blank.id);

      actions.clear();

      expect(store.get(atoms.editorItems)).toStrictEqual([blank, filled]);
    });
  });
});
