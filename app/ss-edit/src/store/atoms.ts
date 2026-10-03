import { atom } from "jotai";
import { type EditorItem, editorItemFromRange, measurePicture } from "../features/editorItem";
import { Vec2 } from "../utils/geometry";
import { canvasOffset } from "./selectors";
import type { PageState } from "./types";

/**
 * the id the preview item carries.
 * @note constant, and never meets a real item: the preview lives outside `editorItems` and is
 *   drawn rather than looked up, so nothing ever matches on it.
 */
const PREVIEW_ITEM_ID = "add-item-preview";

/** a dialog on the stack. */
export type DialogEntry = {
  id: string;
  node: React.ReactNode;
};

export const INITIAL_EDITOR_STATE: PageState = {
  editorMode: { kind: "select", selectedIds: [] },
  editorView: { canvasSize: new Vec2(0, 0), offset: new Vec2(0, 0), scale: 1 },
  editorItems: [],
};

/**
 * @returns atoms for editor state-machine
 */
export const createAtoms = () => {
  /** (primitive) entire editor state. */
  const state = atom(INITIAL_EDITOR_STATE);
  /**
   * the items as they were when the picture was last saved, or null until it ever was.
   * @note held by reference rather than as a flag: immer keeps `editorItems` identical across an
   *   update that does not touch it, hence zooming, panning or selecting never counts as a change.
   */
  const savedItems = atom<readonly EditorItem[] | null>(null);
  /** (primitive) dialog stack, the last entry is on top. */
  const dialogStack = atom<readonly DialogEntry[]>([]);
  /** the dialog on top of the stack, or null if there is none. */
  const dialogReactNode = atom((get) => get(dialogStack).at(-1)?.node ?? null);
  /** if a dialog is on the stack. */
  const isDialogOpen = atom((get): boolean => get(dialogStack).length > 0);
  const editorMode = atom((get) => get(state).editorMode);
  const editorView = atom((get) => get(state).editorView);
  const editorItems = atom((get) => get(state).editorItems);

  /** if the picture has anything to save. */
  const canSave = atom((get): boolean => get(editorItems).length > 0);

  /** if edit mode is on a text item. */
  const isEditingText = atom((get): boolean => {
    const mode = get(editorMode);
    if (mode.kind !== "edit") return false;
    return get(editorItems).find((item) => item.id === mode.itemId)?.kind === "text";
  });

  /**
   * the item the drag in add-item mode would add, or null while no such drag is under way.
   * @note kept apart from `editorItems` rather than pushed into it and taken out again on release.
   *   that list is compared by reference for `hasUnsavedChanges`, so a preview passing through it
   *   would leave a saved picture marked unsaved, and `measurePicture` reads it for the exported
   *   image, which would then stretch to wherever the pointer had wandered.
   */
  const addItemPreview = atom((get): EditorItem | null => {
    const mode = get(editorMode);
    if (mode.kind !== "add-item" || mode.range == null) return null;
    return editorItemFromRange(mode.itemKind, mode.range, PREVIEW_ITEM_ID);
  });

  return {
    state,
    editorMode,
    editorView,
    editorItems,
    dialogStack,
    dialogReactNode,
    isDialogOpen,
    savedItems,
    canSave,
    isEditingText,
    addItemPreview,
    canvasOffset: atom((get) => canvasOffset(get(editorView))),
    editorPictureRect: atom((get) => measurePicture(get(editorItems))),
    /** if the picture holds items that were never saved as they are now. */
    hasUnsavedChanges: atom((get): boolean => get(canSave) && get(editorItems) !== get(savedItems)),
  } as const;
};

export type Atoms = ReturnType<typeof createAtoms>;
