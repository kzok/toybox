import { castDraft } from "immer";
import type { EditorItem } from "../../features/editorItem";
import { type ExportOption, exportToImageBlob } from "../../features/renderer";
import { pickImageFile, readImagesFromDataTransfer, saveBlobAsFile } from "../../utils/fileIO";
import { Vec2 } from "../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../atoms";
import { createDialogActions } from "./dialogs";
import type { ActionCreatorParam } from "./types";
import { switchMode, targetIdsOf } from "./utils";

/** how far each image added at once sits to the lower right of the one before it (canvas units) */
const IMAGE_CASCADE_STEP = 32;

/** mode-agnostic actions other than the view ones */
export const createPictureActions = (params: ActionCreatorParam) => {
  const { store, atoms, updateAtom } = params;
  const dialogs = createDialogActions(params);

  /** @param images added from the back to the front, the first one centered in the view. */
  const addImageItems = (images: readonly ImageBitmap[]): void => {
    const center = store.get(atoms.editorView).offset;
    const newItems = images.map(
      (data, i): EditorItem.Image => ({
        kind: "image",
        id: crypto.randomUUID(),
        data,
        offset: Vec2.new(-data.width / 2, -data.height / 2)
          .add(center)
          .add(Vec2.new(i, i).mul(IMAGE_CASCADE_STEP))
          .tuple(),
        width: data.width,
        height: data.height,
      }),
    );
    updateAtom(atoms.state, (draft) => {
      draft.editorItems.push(...newItems.map(castDraft));
      switchMode(draft, { kind: "select", selectedIds: newItems.map((item) => item.id) });
    });
  };

  /** @note keeps the relative order within the targets and within the rest. */
  const restack = (side: "front" | "back"): void => {
    updateAtom(atoms.state, (draft) => {
      const targetIds = targetIdsOf(draft.editorMode);
      const targets = draft.editorItems.filter((item) => targetIds.includes(item.id));
      const rest = draft.editorItems.filter((item) => !targetIds.includes(item.id));
      // `editorItems` is painted from the back to the front.
      const restacked = side === "front" ? [...rest, ...targets] : [...targets, ...rest];
      // rewriting it with an identical list would count as an unsaved change.
      if (restacked.every((item, i) => item.id === draft.editorItems[i]?.id)) return;
      draft.editorItems = restacked;
    });
  };

  return {
    /** clear items */
    clearItems: async (): Promise<void> => {
      if (store.get(atoms.hasUnsavedChanges)) {
        if ((await dialogs.confirmClear()) === false) return; // cancelled.
      }
      updateAtom(atoms.state, (draft) => {
        draft.editorItems = [];
      });
    },
    /** open a native file picker and add the picked image as an item */
    addFromFilePicker: dialogs.withErrorDialog(async () => {
      const picked = await pickImageFile();
      if (picked == null) {
        return; // cancelled.
      }
      addImageItems([picked.image]);
    }),
    /**
     * add every image of a drop payload as an item, or none if any of them fails to decode.
     * @param dataTransfer from drop event.
     */
    addFromDataTransfer: dialogs.withErrorDialog(async (dataTransfer: DataTransfer) => {
      const dropped = await readImagesFromDataTransfer(dataTransfer);
      if (dropped.length === 0) {
        return; // the payload carried no image file.
      }
      addImageItems(dropped.map(({ image }) => image));
    }),
    /** drop the selected items, or the item under edit in edit mode. */
    deleteSelected: (): void => {
      updateAtom(atoms.state, (draft) => {
        const targetIds = targetIdsOf(draft.editorMode);
        // rewriting it with an identical list would count as an unsaved change.
        if (targetIds.length === 0) return;
        draft.editorItems = draft.editorItems.filter((item) => !targetIds.includes(item.id));
        switchMode(draft, INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /** move the selected items, or the item under edit in edit mode, in front of the rest. */
    bringToFront: (): void => restack("front"),
    /** move the selected items, or the item under edit in edit mode, behind the rest. */
    sendToBack: (): void => restack("back"),
    /** show save image dialog */
    saveAsImage: () => {
      // an empty picture measures 0x0, which `exportToImageBlob` cannot encode.
      if (!store.get(atoms.canSave)) {
        return;
      }
      dialogs.showSaveDialog(
        dialogs.withErrorDialog(async (option: ExportOption) => {
          const items = store.get(atoms.editorItems);
          const blob = await exportToImageBlob(items, option);
          saveBlobAsFile(blob, "screenshot");
          store.set(atoms.savedItems, items);
        }),
      );
    },
  } as const;
};
