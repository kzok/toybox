import { produce } from "immer";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
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
  });
});
