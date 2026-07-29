import { castDraft, type Draft, produce } from "immer";
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
     * @param paneSize [width, height]
     */
    updatePaneSize: (paneSize: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.paneSize = castDraft(paneSize);
      });
    },
    /**
     * scroll in canvas
     * @param deltaX movement X in canvas
     * @param deltaY movement Y in canvas
     */
    scroll: (deltaX: number, deltaY: number): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.centerOffset[0] -= deltaX / draft.editorView.scale;
        draft.editorView.centerOffset[1] -= deltaY / draft.editorView.scale;
      });
    },
    /**
     * zoom in canvas
     * @param next next scale
     * @param cursor cursor offset from centerOffset
     */
    zoom: (next: number | ((_: number) => number), cursor?: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        const halfPaneSize = Point2D.new(draft.editorView.paneSize).scale(0.5).tuple();
        cursor = cursor ?? halfPaneSize;
        // next scale
        let scale = typeof next === "number" ? next : next(draft.editorView.scale);
        scale = Math.max(Math.min(scale, ZOOM_MAX), ZOOM_MIN);
        // next offset
        const scaleDelta = draft.editorView.scale / scale;
        const scaleOrigin = Point2D.new(cursor)
          .subtract(halfPaneSize)
          .scale(1 / draft.editorView.scale)
          .add(draft.editorView.centerOffset);
        const offset = Point2D.new(draft.editorView.centerOffset)
          .scale(scaleDelta, scaleOrigin)
          .tuple();
        draft.editorView.scale = scale;
        draft.editorView.centerOffset = offset;
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
