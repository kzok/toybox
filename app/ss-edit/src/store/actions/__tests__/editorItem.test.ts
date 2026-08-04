import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ConfirmClearDialog } from "../../../components/Dialogs";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
import type { PageState } from "../../types";
import { createActions } from "..";
import { createEditorItemActions } from "../editorItem";

describe(createEditorItemActions, () => {
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

  describe("move()", () => {
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
      actions.editorItem.move(item1.id, [10, 20]);
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

      actions.editorItem.move(item1.id, [10, 20]);

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
      actions.editorView.zoom(2, [0, 0]);

      actions.editorItem.move(item1.id, [10, 20]);

      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([5, 10]);
    });

    it("ignores selected ids that no longer match an existing item.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectItem(item1.id);
      actions.selectItem("missing-id", true);

      expect(() => actions.editorItem.move(item1.id, [10, 20])).not.toThrow();
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
    });
  });

  describe("clear()", () => {
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
      await actions.editorItem.clear();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });

    it("shows a confirmation dialog and keeps items when the user cancels.", async () => {
      const { store, actions, atoms } = setUpWithItem();
      const clearing = actions.editorItem.clear();

      const dialog = store.get(atoms.dialogReactNode) as ReactElement<{
        resolve: (_: boolean) => void;
      }>;
      expect(dialog.type).toBe(ConfirmClearDialog);

      dialog.props.resolve(false);
      await clearing;

      expect(store.get(atoms.editorItems)).toHaveLength(1);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });

    it("clears items and hides the dialog when the user confirms.", async () => {
      const { store, actions, atoms } = setUpWithItem();
      const clearing = actions.editorItem.clear();

      const dialog = store.get(atoms.dialogReactNode) as ReactElement<{
        resolve: (_: boolean) => void;
      }>;
      dialog.props.resolve(true);
      await clearing;

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });
  });
});
