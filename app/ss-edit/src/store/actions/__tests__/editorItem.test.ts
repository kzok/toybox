import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmClearDialog, ErrorNoticeDialog } from "../../../components/Dialogs";
import type { EditorItem } from "../../../features/editorItem";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
import { createActions } from "..";
import { createEditorItemActions } from "../editorItem";

describe(createEditorItemActions, () => {
  const createTestTarget = () => {
    const store = createStore();
    const atoms = createAtoms();
    const actions = createActions(store, atoms);
    return { store, actions, atoms } as const;
  };

  const createImageItem = (id: string, offset: EditorItem.Image["offset"]): EditorItem.Image => ({
    kind: "image",
    id,
    data: {} as ImageBitmap,
    offset,
  });

  const createTextItem = (id: string, content: string): EditorItem.Text => ({
    kind: "text",
    id,
    content,
    offset: [0, 0],
    width: 100,
    fontSize: 32,
    color: "#fff",
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
      actions.editorMode.selectItem(item1.id);
      actions.editorMode.selectItem(item2.id, true);

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
      actions.editorMode.selectItem(item1.id);
      actions.editorMode.selectItem("missing-id", true);

      expect(() => actions.editorItem.move(item1.id, [10, 20])).not.toThrow();
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
    });
  });

  describe("editText()", () => {
    const setUp = () => {
      const target = createTestTarget();
      const textItem = createTextItem("item-1", "hello");
      const imageItem = createImageItem("item-2", [0, 0]);
      target.store.set(
        target.atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorItems.push(castDraft(textItem), castDraft(imageItem));
        }),
      );
      return { ...target, textItem, imageItem } as const;
    };

    it("updates the content of the specified text item.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.editorItem.editText(textItem.id, "こんにちは");
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === textItem.id)).toStrictEqual({
        ...textItem,
        content: "こんにちは",
      });
    });

    it("keeps items unchanged when the item is not a text item.", () => {
      const { store, actions, atoms, imageItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editorItem.editText(imageItem.id, "こんにちは");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("keeps items unchanged when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editorItem.editText("missing-id", "こんにちは");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
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

  describe("addFromDataTransfer()", () => {
    const dataTransferOf = (...files: File[]): DataTransfer =>
      ({ files }) as unknown as DataTransfer;

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("shows an error dialog and adds nothing when the image cannot be decoded.", async () => {
      const { store, actions, atoms } = createTestTarget();
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("decode failed")));

      const adding = actions.editorItem.addFromDataTransfer(
        dataTransferOf(new File(["x"], "a.png", { type: "image/png" })),
      );
      // let the rejection propagate through the wrapper.
      await new Promise((resolve) => setTimeout(resolve, 0));

      const dialog = store.get(atoms.dialogReactNode) as ReactElement<{ resolve: () => void }>;
      expect(dialog.type).toBe(ErrorNoticeDialog);

      dialog.props.resolve();
      await adding;

      expect(store.get(atoms.dialogReactNode)).toBeNull();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
    });

    it("restores the dialog underneath once the error dialog is closed.", async () => {
      const { store, actions, atoms } = createTestTarget();
      store.set(
        atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorItems.push(castDraft(createImageItem("item-1", [0, 0])));
        }),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("decode failed")));

      // an image is dropped while the confirmation dialog is waiting for an answer.
      const clearing = actions.editorItem.clear();
      const adding = actions.editorItem.addFromDataTransfer(
        dataTransferOf(new File(["x"], "a.png", { type: "image/png" })),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      const errorDialog = store.get(atoms.dialogReactNode) as ReactElement<{ resolve: () => void }>;
      expect(errorDialog.type).toBe(ErrorNoticeDialog);
      errorDialog.props.resolve();
      await adding;

      // the confirmation dialog is back on top and still answerable.
      const confirmDialog = store.get(atoms.dialogReactNode) as ReactElement<{
        resolve: (_: boolean) => void;
      }>;
      expect(confirmDialog.type).toBe(ConfirmClearDialog);
      confirmDialog.props.resolve(true);
      await clearing;

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });

    it("adds no item and shows no dialog when the payload carries no image.", async () => {
      const { store, actions, atoms } = createTestTarget();

      await actions.editorItem.addFromDataTransfer(
        dataTransferOf(new File(["x"], "a.txt", { type: "text/plain" })),
      );

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });
  });
});
