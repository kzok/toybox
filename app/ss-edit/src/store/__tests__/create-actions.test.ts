import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ConfirmClearDialog } from "../../components/Dialogs";
import { createActions } from "../actions";
import { createAtoms, INITIAL_EDITOR_STATE } from "../atoms";
import type { PageState } from "../types";

describe(createActions, () => {
  const createTestTarget = () => {
    const store = createStore();
    const atoms = createAtoms();
    const actions = createActions(store, atoms);
    return { store, actions, atoms } as const;
  };

  const createImageItem = (
    id: string,
    offset: PageState.Item.Image["offset"],
  ): PageState.Item.Image => ({
    kind: "image",
    id,
    data: {} as ImageBitmap,
    offset,
  });

  describe("syncCanvasSize()", () => {
    it("updates view.canvas.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.syncCanvasSize([100, 200]);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.canvasSize = [100, 200];
        }),
      );
    });
  });

  describe("scroll()", () => {
    it("updates view.offset.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.scroll(100, 200);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.offset[0] -= 100;
          draft.editorView.offset[1] -= 200;
        }),
      );
    });
  });

  describe("zoom()", () => {
    it("updates view.scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(1.2, [0, 0]);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.scale = 1.2;
        }),
      );
      actions.zoom((s) => s + 0.1, [0, 0]);
      expect(store.get(atoms.editorView).scale).toBe(1.3);
    });

    it("has minimum scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(0, [0, 0]);
      expect(store.get(atoms.editorView).scale).toBe(0.27);
    });

    it("has maximum scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(100, [0, 0]);
      expect(store.get(atoms.editorView).scale).toBe(2);
    });
  });

  describe("moveItem()", () => {
    const setUp = () => {
      const target = createTestTarget();
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      target.store.set(
        target.atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorItems.push(castDraft(item1), castDraft(item2));
        }),
      );
      return { ...target, item1, item2 } as const;
    };

    it("selects the trigger item and moves it when it is not selected.", () => {
      const { store, actions, atoms, item1, item2 } = setUp();
      actions.moveItem(item1.id, [10, 20]);
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
      actions.selectItem(item1.id);
      actions.selectItem(item2.id, true);

      actions.moveItem(item1.id, [10, 20]);

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
      actions.zoom(2, [0, 0]);

      actions.moveItem(item1.id, [10, 20]);

      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([5, 10]);
    });

    it("ignores selected ids that no longer match an existing item.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectItem(item1.id);
      actions.selectItem("missing-id", true);

      expect(() => actions.moveItem(item1.id, [10, 20])).not.toThrow();
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
    });
  });

  describe("clearItems()", () => {
    const setUpWithItem = () => {
      const target = createTestTarget();
      const item = createImageItem("item-1", [0, 0]);
      target.store.set(
        target.atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorItems.push(castDraft(item));
        }),
      );
      return { ...target, item } as const;
    };

    it("clears items immediately when confirmation is not needed.", async () => {
      const { store, actions, atoms } = createTestTarget();
      await actions.clearItems();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });

    it("shows a confirmation dialog and keeps items when the user cancels.", async () => {
      const { store, actions, atoms } = setUpWithItem();
      const clearing = actions.clearItems();

      const dialog = store.get(atoms.dialogReactNode) as ReactElement<{
        onSelect: (_: boolean) => void;
      }>;
      expect(dialog.type).toBe(ConfirmClearDialog);

      dialog.props.onSelect(false);
      await clearing;

      expect(store.get(atoms.editorItems)).toHaveLength(1);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });

    it("clears items and hides the dialog when the user confirms.", async () => {
      const { store, actions, atoms } = setUpWithItem();
      const clearing = actions.clearItems();

      const dialog = store.get(atoms.dialogReactNode) as ReactElement<{
        onSelect: (_: boolean) => void;
      }>;
      dialog.props.onSelect(true);
      await clearing;

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });
  });
});
