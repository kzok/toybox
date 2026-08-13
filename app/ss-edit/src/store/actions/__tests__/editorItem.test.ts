import { castDraft, produce } from "immer";
import { createStore } from "jotai";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ConfirmClearDialog, ErrorNoticeDialog } from "../../../components/Dialogs";
import type { EditorItem } from "../../../features/editorItem";
import { Vec2 } from "../../../utils/geometry";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
import { createActions } from "..";
import { createEditorItemActions } from "../editorItem";

const originalGetClientRects = Range.prototype.getClientRects;

beforeAll(() => {
  // jsdom implements neither layout nor `Range.getClientRects()`, which measuring a text item
  // reaches for. an empty list is what a browser returns for a range it never laid out.
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
});

afterAll(() => {
  Range.prototype.getClientRects = originalGetClientRects;
});

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
    width: 100,
    height: 50,
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
      actions.editorView.zoom(2, new Vec2(0, 0));

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

  describe("resize()", () => {
    // width: 100, height: 50 (aspect ratio 2:1)
    const setUp = () => {
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

    it("scales width and height together, keeping the aspect ratio and the offset.", () => {
      const { store, actions, atoms, item } = setUp();

      // an aspect-correct target (2:1, same ratio as the item), so it is reached exactly.
      actions.editorItem.resizeImage(item.id, [110, 55]);

      const resized = store.get(atoms.editorItems).find((i) => i.id === item.id);
      expect(resized?.kind).toBe("image");
      expect((resized as EditorItem.Image).width).toBeCloseTo(110);
      expect((resized as EditorItem.Image).height).toBeCloseTo(55);
      expect(resized?.offset).toStrictEqual([0, 0]);
    });

    it("projects an off-ratio target onto the diagonal instead of matching it exactly.", () => {
      const { store, actions, atoms, item } = setUp();

      // not on the 2:1 diagonal; only the projection onto it drives the resize.
      actions.editorItem.resizeImage(item.id, [110, 40]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(104);
      expect(resized.height).toBeCloseTo(52);
    });

    it("does not shrink either dimension below the minimum size.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editorItem.resizeImage(item.id, [-1000, -500]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(72);
      expect(resized.height).toBeCloseTo(36);
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.editorView.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 220,110 screen-px target is 110,55 canvas units — same as the first test.
      actions.editorItem.resizeImage(item.id, [220, 110]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(110);
      expect(resized.height).toBeCloseTo(55);
    });

    it("keeps items unchanged when the item is not an image item.", () => {
      const { store, actions, atoms } = setUp();
      const textItem = createTextItem("item-2", "hello");
      store.set(
        atoms.state,
        produce(store.get(atoms.state), (draft) => {
          draft.editorItems.push(castDraft(textItem));
        }),
      );
      const before = store.get(atoms.editorItems);

      actions.editorItem.resizeImage(textItem.id, [10, 5]);

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.editorItem.resizeImage("missing-id", [10, 5])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
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

  describe("saveAsPng()", () => {
    /**
     * @returns a target holding one item, with everything `saveAsPng()` reaches out to stubbed.
     */
    const setUpSavable = () => {
      const target = createTestTarget();
      const item = createImageItem("item-1", [0, 0]);
      target.store.set(
        target.atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorItems.push(castDraft(item));
        }),
      );
      const convertToBlob = vi.fn(async () => new Blob(["png"], { type: "image/png" }));
      // every call the renderer makes on a 2d context; the properties it assigns need no stub.
      const context = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        drawImage: vi.fn(),
        measureText: () => ({ fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }),
        strokeText: vi.fn(),
        fillText: vi.fn(),
      };
      vi.stubGlobal(
        "OffscreenCanvas",
        class {
          getContext = () => context;
          convertToBlob = convertToBlob;
        },
      );
      vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:png"), revokeObjectURL: vi.fn() });
      return { ...target, item, convertToBlob } as const;
    };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("encodes the picture and hands it to a download.", async () => {
      const { actions, convertToBlob } = setUpSavable();
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      await actions.editorItem.saveAsPng();

      expect(convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
      expect(click).toHaveBeenCalledOnce();
      click.mockRestore();
    });

    it("leaves no unsaved change behind.", async () => {
      const { store, actions, atoms } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      expect(store.get(atoms.hasUnsavedChanges)).toBe(true);

      await actions.editorItem.saveAsPng();

      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);
    });

    it("counts an edit made after the save as unsaved again.", async () => {
      const { store, actions, atoms, item } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await actions.editorItem.saveAsPng();

      actions.editorItem.move(item.id, [10, 20]);

      expect(store.get(atoms.hasUnsavedChanges)).toBe(true);
    });

    it("keeps a view operation after the save from counting as a change.", async () => {
      const { store, actions, atoms } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await actions.editorItem.saveAsPng();

      actions.editorView.zoom(2, new Vec2(0, 0));
      actions.editorView.scroll(10, 20);
      actions.editorMode.selectItem("item-1");

      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);
    });

    it("keeps leaving edit mode without dropping anything from counting as a change.", async () => {
      const { store, actions, atoms } = setUpSavable();
      const filled = createTextItem("item-2", "hello");
      store.set(
        atoms.state,
        produce(store.get(atoms.state), (draft) => {
          draft.editorItems.push(castDraft(filled));
        }),
      );
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await actions.editorItem.saveAsPng();

      actions.editorMode.enterEdit(filled.id);
      actions.editorMode.clear();

      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);
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
