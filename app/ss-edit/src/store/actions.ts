import { type Draft, produce } from "immer";
import type { createStore, PrimitiveAtom } from "jotai";
import { Point2D, type Tuple2D } from "../utils/geometry";
import type { Atoms } from "./atoms";

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
  const updateAtom = <T>(atom: PrimitiveAtom<T>, recipe: (_: Draft<T>) => void): void => {
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
     * @param width
     * @param height
     */
    updatePaneSize: (width: number, height: number): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.paneSize.width = width;
        draft.editorView.paneSize.height = height;
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
     */
    zoom: (next: number | ((_: number) => number), cursor: Tuple2D = [0, 0]): void => {
      updateAtom(atoms.state, (draft) => {
        // next scale
        let scale = typeof next === "number" ? next : next(draft.editorView.scale);
        scale = Math.max(Math.min(scale, ZOOM_MAX), ZOOM_MIN);
        // next offset
        const scaleDelta = draft.editorView.scale / scale;
        const scaleOrigin = Point2D.new(cursor)
          .scale(1 / draft.editorView.scale)
          .add(draft.editorView.offset);
        const offset = Point2D.new(draft.editorView.offset).scale(scaleDelta, scaleOrigin).tuple();
        draft.editorView.scale = scale;
        draft.editorView.offset = offset;
      });
    },
    /**
     * @param id
     * @param multi
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
     * clear mode state
     */
    clearMode: (): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorMode = { kind: "select", selectedIds: [] };
      });
    },
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
