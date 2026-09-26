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

      actions.selection.move(item.id, [10, 20]);

      expect(store.get(atoms.hasUnsavedChanges)).toBe(true);
    });

    it("keeps a view operation after the save from counting as a change.", async () => {
      const { store, actions, atoms } = setUpSavable();
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      await saveThroughDialog({ store, actions, atoms });

      actions.view.zoom(2, new Vec2(0, 0));
      actions.view.scroll(10, 20);
      actions.selection.select("item-1");

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

      actions.edit.enter(filled.id);
      actions.selection.clear();

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

    it("adds no item and shows no dialog when the payload carries no image.", async () => {
      const { store, actions, atoms } = createTestTarget();

      await actions.picture.addFromDataTransfer(
        dataTransferOf(new File(["x"], "a.txt", { type: "text/plain" })),
      );

      expect(store.get(atoms.editorItems)).toStrictEqual([]);
      expect(store.get(atoms.dialogReactNode)).toBeNull();
    });
  });
});
