import { castDraft } from "immer";
import type { EditorItem } from "../../features/editorItem";
import { type ExportOption, exportToImageBlob } from "../../features/renderer";
import { pickImageFile, readImageFromDataTransfer, saveBlobAsFile } from "../../utils/fileIO";
import { Vec2 } from "../../utils/geometry";
import { createDialogActions } from "./dialogs";
import type { ActionCreatorParam } from "./types";

export const createPictureActions = (params: ActionCreatorParam) => {
  const { store, atoms, updateAtom } = params;
  const dialogs = createDialogActions(params);

  const addImageItem = (data: ImageBitmap): void => {
    const newItem: EditorItem.Image = {
      kind: "image",
      id: crypto.randomUUID(),
      data,
      offset: Vec2.new(-data.width / 2, -data.height / 2)
        .add(store.get(atoms.editorView).offset)
        .tuple(),
      width: data.width,
      height: data.height,
    };
    updateAtom(atoms.state, (draft) => {
      draft.editorItems.push(castDraft(newItem));
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
      addImageItem(picked.image);
    }),
    /**
     * add the first image of a drop payload as an item.
     * @param dataTransfer from drop event.
     */
    addFromDataTransfer: dialogs.withErrorDialog(async (dataTransfer: DataTransfer) => {
      const dropped = await readImageFromDataTransfer(dataTransfer);
      if (dropped == null) {
        return; // the payload carried no image file.
      }
      addImageItem(dropped.image);
    }),
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
