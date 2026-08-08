import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import type { EditorItem } from "../../../features/editorItem";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
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
