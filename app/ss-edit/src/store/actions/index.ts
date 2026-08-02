import { castDraft, produce } from "immer";
import { exportToImageBlob } from "../../features/renderer";
import { saveBlobAsFile } from "../../utils/fileIO";
import { Point2D, type Tuple2D } from "../../utils/geometry";
import { type Atoms, INITIAL_EDITOR_STATE } from "../atoms";
import type { PageState } from "../types";
import { createDialogActions } from "./dialogs";
import { createEditorViewActions } from "./editorView";
import type { ActionCreatorParam, StoreInterface, UpdateAtom } from "./types";

/**
 * @param store
 * @param atoms
 * @returns actions
 */
export const createActions = (store: StoreInterface, atoms: Atoms) => {
  const updateAtom: UpdateAtom = (atom, recipe) => {
    store.set(
      atom,
      produce(store.get(atom), (draft) => {
        recipe(draft);
      }),
    );
  };

  const params: ActionCreatorParam = { store, atoms, updateAtom };
  const dialogs = createDialogActions(params);
  const editorView = createEditorViewActions(params);

  return {
    editorView,
    /**
     * add an image item on center of editor pane.
     * @param data ImageBitmap
     */
    addImageItem: (data: ImageBitmap): void => {
      const newItem: PageState.Item.Image = {
        kind: "image",
        id: crypto.randomUUID(),
        data,
        offset: Point2D.new(-data.width / 2, -data.height / 2)
          .add(store.get(atoms.editorView).offset)
          .tuple(),
      };
      updateAtom(atoms.state, (draft) => {
        draft.editorItems.push(castDraft(newItem));
      });
    },
    /**
     * @param id item.id
     * @param multi if ctrlKey is pressed
     */
    selectItem: (id: string, multi: boolean = false): void => {
      updateAtom(atoms.state, (draft) => {
        let selectedIds: string[] = [];
        if (multi) {
          // multi selection
          if (draft.editorMode.kind === "select") {
            selectedIds = draft.editorMode.selectedIds;
          }
          if (selectedIds.includes(id)) {
            // remove it if already included.
            selectedIds = selectedIds.filter((el) => el !== id);
          } else {
            // add it otherwise.
            selectedIds.push(id);
          }
        } else {
          // single selection
          selectedIds = [id];
        }
        draft.editorMode = { kind: "select", selectedIds };
      });
    },
    /**
     * @param triggerItemId item.id that triggers this movement.
     * @param delta [movementX, movementY]
     */
    moveItem: (triggerItemId: string, delta: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        // update selection if triggerItemId is not included.
        if (
          draft.editorMode.kind !== "select" ||
          !draft.editorMode.selectedIds.includes(triggerItemId)
        ) {
          draft.editorMode = { kind: "select", selectedIds: [triggerItemId] };
        }

        const scaledDelta = Point2D.new(delta).scale(1 / draft.editorView.scale);
        for (const id of draft.editorMode.selectedIds) {
          const item = draft.editorItems.find((item) => item.id === id);
          if (item == null) continue;
          item.offset = scaledDelta.add(item.offset).tuple();
        }
      });
    },
    /**
     * clear mode state
     */
    clearMode: (): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorMode = castDraft(INITIAL_EDITOR_STATE.editorMode);
      });
    },
    /** clear items */
    clearItems: async (): Promise<void> => {
      if (store.get(atoms.needConfirmBeforeUnload)) {
        if ((await dialogs.confirmClear()) === false) return; // cancelled.
      }
      updateAtom(atoms.state, (draft) => {
        draft.editorItems = [];
      });
    },
    /** render editor items and save them as a PNG file */
    saveAsPng: async (): Promise<void> => {
      const blob = await exportToImageBlob(store.get(atoms.editorItems));
      saveBlobAsFile(blob, "screenshot.png");
      store.set(atoms.isSaved, true);
    },
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
