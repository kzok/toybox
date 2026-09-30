import { castDraft, produce } from "immer";
import type { ComponentProps, ReactElement } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ConfirmClearDialog,
  ErrorNoticeDialog,
  SaveImageDialog,
} from "../../../components/Dialogs";
import { DEFAULT_OPTION } from "../../../features/renderer";
import { Vec2 } from "../../../utils/geometry";
import { createPictureActions } from "../picture";
import {
  createImageItem,
  createTestTarget,
  createTestTargetWithItems,
  createTextItem,
} from "./fixtures";

const originalGetClientRects = Range.prototype.getClientRects;

beforeAll(() => {
  // jsdom implements neither layout nor `Range.getClientRects()`, which measuring a text item
  // reaches for. an empty list is what a browser returns for a range it never laid out.
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
});

afterAll(() => {
  Range.prototype.getClientRects = originalGetClientRects;
});

describe(createPictureActions, () => {
  describe("clearItems()", () => {
    const setUpWithItem = () => {
      const item = createImageItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    it("clears items immediately when confirmation is not needed.", async () => {
      const { store, actions, atoms } = createTestTarget();
      await actions.picture.clearItems();
      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });

    it("shows a confirmation dialog and keeps items when the user cancels.", async () => {
      const { store, actions, atoms } = setUpWithItem();
      const clearing = actions.picture.clearItems();

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
      const clearing = actions.picture.clearItems();

      const dialog = store.get(atoms.dialogReactNode) as ReactElement<{
        resolve: (_: boolean) => void;
      }>;
      dialog.props.resolve(true);
      await clearing;

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });
  });

  describe("saveAsImage()", () => {
    /**
     * @returns a target holding one item, with everything `saveAsImage()` reaches out to stubbed.
     */
    const setUpSavable = () => {
      const item = createImageItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      const convertToBlob = vi.fn(async () => new Blob(["png"], { type: "image/png" }));
      // every call the renderer makes on a 2d context; the properties it assigns need no stub.
      const context = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        fillRect: vi.fn(),
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

    /** open the save dialog and press its save button. */
    const saveThroughDialog = async ({
      store,
      actions,
      atoms,
    }: Pick<ReturnType<typeof setUpSavable>, "store" | "actions" | "atoms">) => {
      actions.picture.saveAsImage();
      const dialog = store.get(atoms.dialogReactNode) as ReactElement<
        ComponentProps<typeof SaveImageDialog>
      >;
      expect(dialog.type).toBe(SaveImageDialog);
      await dialog.props.save(DEFAULT_OPTION);
    };

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("encodes the picture and hands it to a download.", async () => {
      const { store, actions, atoms, convertToBlob } = setUpSavable();
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      await saveThroughDialog({ store, actions, atoms });

      expect(convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
      expect(click).toHaveBeenCalledOnce();
      click.mockRestore();
    });

    it("names the file without an extension, which Chromium appends from the blob's type.", async () => {
      const { store, actions, atoms } = setUpSavable();
      const fileNames: string[] = [];
      const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        fileNames.push(this.download);
      });

      await saveThroughDialog({ store, actions, atoms });

      expect(fileNames).toStrictEqual(["screenshot"]);
      click.mockRestore();
    });

    it("leaves no unsaved change behind.", async () => {
      const { store, actions, atoms } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      expect(store.get(atoms.hasUnsavedChanges)).toBe(true);

      await saveThroughDialog({ store, actions, atoms });

      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);
    });

    it("counts an edit made after the save as unsaved again.", async () => {
      const { store, actions, atoms, item } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await saveThroughDialog({ store, actions, atoms });

      actions.selectMode.move(item.id, [10, 20]);

      expect(store.get(atoms.hasUnsavedChanges)).toBe(true);
    });

    it("keeps a view operation after the save from counting as a change.", async () => {
      const { store, actions, atoms } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await saveThroughDialog({ store, actions, atoms });

      actions.view.zoom(2, new Vec2(0, 0));
      actions.view.scroll(10, 20);
      actions.selectMode.select("item-1");

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
      await saveThroughDialog({ store, actions, atoms });

      actions.editMode.enter(filled.id);
      actions.selectMode.clear();

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

      const adding = actions.picture.addFromDataTransfer(
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
      const { store, actions, atoms } = createTestTargetWithItems(
        createImageItem("item-1", [0, 0]),
      );
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("createImageBitmap", () => Promise.reject(new Error("decode failed")));

      // an image is dropped while the confirmation dialog is waiting for an answer.
      const clearing = actions.picture.clearItems();
      const adding = actions.picture.addFromDataTransfer(
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

    it("adds nothing when any of the dropped images cannot be decoded.", async () => {
      const { store, actions, atoms } = createTestTarget();
      vi.spyOn(console, "error").mockImplementation(() => {});
      const broken = new File(["x"], "broken.png", { type: "image/png" });
      vi.stubGlobal("createImageBitmap", async (blob: Blob) => {
        if (blob === broken) throw new Error("decode failed");
        return { width: 100, height: 50 };
      });

      const adding = actions.picture.addFromDataTransfer(
        dataTransferOf(new File(["x"], "ok.png", { type: "image/png" }), broken),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      (store.get(atoms.dialogReactNode) as ReactElement<{ resolve: () => void }>).props.resolve();
      await adding;

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
    });

    it("adds every dropped image, each to the lower right of the one before it.", async () => {
      const { store, actions, atoms } = createTestTarget();
      vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 50 }));

      await actions.picture.addFromDataTransfer(
        dataTransferOf(
          new File(["x"], "a.png", { type: "image/png" }),
          new File(["x"], "b.png", { type: "image/png" }),
        ),
      );

      // the view is centered on the origin, hence the first image is centered there.
      expect(store.get(atoms.editorItems).map((item) => item.offset)).toStrictEqual([
        [-50, -25],
        [-18, 7],
      ]);
    });

    it("selects only the added images in select mode.", async () => {
      const { store, actions, atoms } = createTestTargetWithItems(
        createImageItem("item-1", [0, 0]),
      );
      vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 50 }));
      actions.selectMode.select("item-1");

      await actions.picture.addFromDataTransfer(
        dataTransferOf(
          new File(["x"], "a.png", { type: "image/png" }),
          new File(["x"], "b.png", { type: "image/png" }),
        ),
      );

      const added = store.get(atoms.editorItems).slice(1);
      expect(added.map((item) => item.kind)).toStrictEqual(["image", "image"]);
      expect(store.get(atoms.editorMode)).toStrictEqual({
        kind: "select",
        selectedIds: added.map((item) => item.id),
      });
    });

    it("drops the blank text item being edited when it adds an image.", async () => {
      const { store, actions, atoms } = createTestTargetWithItems(createTextItem("item-1", ""));
      vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 50 }));
      actions.editMode.enter("item-1");

      await actions.picture.addFromDataTransfer(
        dataTransferOf(new File(["x"], "a.png", { type: "image/png" })),
      );

      expect(store.get(atoms.editorItems).map((item) => item.kind)).toStrictEqual(["image"]);
    });

    it("adds no item and shows no dialog when the payload carries no image.", async () => {
      const { store, actions, atoms } = createTestTarget();

      await actions.picture.addFromDataTransfer(
        dataTransferOf(new File(["x"], "a.txt", { type: "text/plain" })),
      );

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });
  });

  describe("deleteSelected()", () => {
    const setUp = () => {
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      const item3 = createImageItem("item-3", [200, 200]);
      const target = createTestTargetWithItems(item1, item2, item3);
      return { ...target, item1, item2, item3 } as const;
    };

    it("drops every selected item, keeping the rest.", () => {
      const { store, actions, atoms, item1, item2, item3 } = setUp();
      actions.selectMode.select(item1.id);
      actions.selectMode.select(item3.id, true);

      actions.picture.deleteSelected();

      expect(store.get(atoms.editorItems).map((item) => item.id)).toStrictEqual([item2.id]);
    });

    it("leaves nothing selected.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectMode.select(item1.id);

      actions.picture.deleteSelected();

      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "select", selectedIds: [] });
    });

    it("drops the item under edit in edit mode, keeping the rest.", () => {
      const { store, actions, atoms, item1, item2, item3 } = setUp();
      actions.editMode.enter(item2.id);

      actions.picture.deleteSelected();

      expect(store.get(atoms.editorItems).map((item) => item.id)).toStrictEqual([
        item1.id,
        item3.id,
      ]);
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "select", selectedIds: [] });
    });

    it("does nothing in add-item mode.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItemMode.enter("rect");
      const before = store.get(atoms.state);

      actions.picture.deleteSelected();

      expect(store.get(atoms.state)).toBe(before);
    });

    it("does not count as a change when nothing is selected.", () => {
      const { store, actions, atoms } = setUp();
      store.set(atoms.savedItems, store.get(atoms.editorItems));
      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);

      actions.picture.deleteSelected();

      // NOTE: rewriting the list, identical or not, would have made this true.
      expect(store.get(atoms.hasUnsavedChanges)).toBe(false);
    });
  });

  describe("bringToFront() / sendToBack()", () => {
    const setUp = () => {
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      const item3 = createImageItem("item-3", [200, 200]);
      const item4 = createImageItem("item-4", [300, 300]);
      const target = createTestTargetWithItems(item1, item2, item3, item4);
      const idsOf = () => target.store.get(target.atoms.editorItems).map((item) => item.id);
      return { ...target, idsOf, item1, item2, item3, item4 } as const;
    };

    it("brings every selected item to the front, keeping their relative order.", () => {
      const { actions, idsOf, item1, item2, item3, item4 } = setUp();
      actions.selectMode.select(item3.id);
      actions.selectMode.select(item1.id, true);

      actions.picture.bringToFront();

      expect(idsOf()).toStrictEqual([item2.id, item4.id, item1.id, item3.id]);
    });

    it("sends every selected item to the back, keeping their relative order.", () => {
      const { actions, idsOf, item1, item2, item3, item4 } = setUp();
      actions.selectMode.select(item4.id);
      actions.selectMode.select(item2.id, true);

      actions.picture.sendToBack();

      expect(idsOf()).toStrictEqual([item2.id, item4.id, item1.id, item3.id]);
    });

    it("moves the item under edit in edit mode, staying in edit mode.", () => {
      const { store, actions, atoms, idsOf, item1, item2, item3, item4 } = setUp();
      actions.editMode.enter(item2.id);

      actions.picture.bringToFront();
      expect(idsOf()).toStrictEqual([item1.id, item3.id, item4.id, item2.id]);

      actions.picture.sendToBack();
      expect(idsOf()).toStrictEqual([item2.id, item1.id, item3.id, item4.id]);

      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: item2.id });
    });

    it("keeps the very same items list when the selection is already in place, which would count as unsaved otherwise.", () => {
      const { store, actions, atoms, item1, item4 } = setUp();
      const before = store.get(atoms.editorItems);

      actions.selectMode.select(item4.id);
      actions.picture.bringToFront();
      expect(store.get(atoms.editorItems)).toBe(before);

      actions.selectMode.select(item1.id);
      actions.picture.sendToBack();
      expect(store.get(atoms.editorItems)).toBe(before);
    });

    it("does nothing when nothing is selected.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.state);

      actions.picture.bringToFront();
      actions.picture.sendToBack();

      expect(store.get(atoms.state)).toBe(before);
    });

    it("does nothing in add-item mode.", () => {
      const { store, actions, atoms } = setUp();
      actions.addItemMode.enter("rect");
      const before = store.get(atoms.state);

      actions.picture.bringToFront();
      actions.picture.sendToBack();

      expect(store.get(atoms.state)).toBe(before);
    });
  });
});
