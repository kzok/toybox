import { castDraft } from "immer";
import type { EditorItem } from "../../features/editorItem";
import { exportToImageBlob } from "../../features/renderer";
import { pickImageFile, readImageFromDataTransfer, saveBlobAsFile } from "../../utils/fileIO";
import { Vec2 } from "../../utils/geometry";
import { createDialogActions } from "./dialogs";
import type { ActionCreatorParam } from "./types";

/**
 * @param params store, atoms and updateAtom
 * @returns actions for editor items
 */
export const createEditorItemActions = (params: ActionCreatorParam) => {
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
    };
    updateAtom(atoms.state, (draft) => {
      draft.editorItems.push(castDraft(newItem));
    });
  };

  return {
    /**
     * move item
     * @param triggerItemId item.id that triggers this movement.
     * @param delta [movementX, movementY]
     */
    move: (triggerItemId: string, delta: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        // update selection if triggerItemId is not included.
        if (
          draft.editorMode.kind !== "select" ||
          !draft.editorMode.selectedIds.includes(triggerItemId)
        ) {
          draft.editorMode = { kind: "select", selectedIds: [triggerItemId] };
        }

        const scaledDelta = Vec2.new(delta).div(draft.editorView.scale);
        for (const id of draft.editorMode.selectedIds) {
          const item = draft.editorItems.find((item) => item.id === id);
          if (item == null) continue;
          item.offset = scaledDelta.add(item.offset).tuple();
        }
      });
    },
    /**
     * update the content of a text item.
     * @param itemId item.id
     * @param content new text content
     */
    editText: (itemId: string, content: string): void => {
      updateAtom(atoms.state, (draft) => {
        const item = draft.editorItems.find((item) => item.id === itemId);
        if (item?.kind !== "text") return;
        item.content = content;
      });
    },
    /** clear items */
    clear: async (): Promise<void> => {
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
    /** render editor items and save them as a PNG file */
    saveAsPng: dialogs.withErrorDialog(async () => {
      const items = store.get(atoms.editorItems);
      const blob = await exportToImageBlob(items);
      saveBlobAsFile(blob, "screenshot.png");
      // NOTE: the items the blob was rendered from, so that a change made while it was being
      // encoded is not mistaken for having been saved.
      store.set(atoms.savedItems, items);
    }),
  } as const;
};
