import { castDraft, type Draft, produce } from "immer";
import type { createStore, PrimitiveAtom } from "jotai";
import { ConfirmClearDialog } from "../components/Dialogs";
import { Point2D, type Tuple2D } from "../utils/geometry";
import { type Atoms, INITIAL_EDITOR_STATE } from "./atoms";
import type { PageState } from "./types";

type Store = Pick<ReturnType<typeof createStore>, "get" | "set">;

const ZOOM_MIN = 0.27;
const ZOOM_MAX = 2.0;

/**
 * @param store
 * @returns actions
 */
export const createActions = (store: Store, atoms: Atoms) => {
  /**
   * @param atom
   * @param recipe
   */
  const updateAtom = <T,>(atom: PrimitiveAtom<T>, recipe: (_: Draft<T>) => void): void => {
    store.set(
      atom,
      produce(store.get(atom), (draft) => {
        recipe(draft);
      }),
    );
  };

  return {
    /**
     * update editor pane size
     * @param canvasSize [width, height]
     */
    syncCanvasSize: (canvasSize: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.canvasSize = castDraft(canvasSize);
      });
    },
    /**
     * scroll in canvas
     * @param deltaX movement X in canvas
     * @param deltaY movement Y in canvas
     */
    scroll: (deltaX: number, deltaY: number): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.offset[0] -= deltaX / draft.editorView.scale;
        draft.editorView.offset[1] -= deltaY / draft.editorView.scale;
      });
    },
    /**
     * zoom in canvas
     * @param next next scale
     * @param cursor cursor offset from centerOffset
     */
    zoom: (next: number | ((_: number) => number), cursor?: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        const halfPaneSize = Point2D.new(draft.editorView.canvasSize).scale(0.5).tuple();
        cursor = cursor ?? halfPaneSize;
        // next scale
        let scale = typeof next === "number" ? next : next(draft.editorView.scale);
        scale = Math.max(Math.min(scale, ZOOM_MAX), ZOOM_MIN);
        // next offset
        const scaleDelta = draft.editorView.scale / scale;
        const scaleOrigin = Point2D.new(cursor)
          .subtract(halfPaneSize)
          .scale(1 / draft.editorView.scale)
          .add(draft.editorView.offset);
        const offset = Point2D.new(draft.editorView.offset).scale(scaleDelta, scaleOrigin).tuple();
        draft.editorView.scale = scale;
        draft.editorView.offset = offset;
      });
    },
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
        const response = await new Promise<boolean>((resolve) =>
          store.set(atoms.dialogReactNode, <ConfirmClearDialog onSelect={resolve} />),
        );
        store.set(atoms.dialogReactNode, null);
        if (response === false) return; // cancelled.
      }
      updateAtom(atoms.state, (draft) => {
        draft.editorItems = [];
      });
    },
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
