import { type Draft, produce } from "immer";
import type { createStore, PrimitiveAtom } from "jotai";
import { Point2D } from "../../utils/geometry";
import { editorAtoms } from "./atoms";
import type { Coordinate2D } from "./types";

type Store = Pick<ReturnType<typeof createStore>, "get" | "set">;

const ZOOM_MIN = 0.27;
const ZOOM_MAX = 2.0;

/**
 * @param store
 * @returns actions
 */
export const createActions = (store: Store) => {
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
     * update canvas size
     * @param width canvas width
     * @param height canvas height
     */
    updateCanvasSize: (width: number, height: number): void => {
      updateAtom(editorAtoms.state, (draft) => {
        draft.view.size.width = width;
        draft.view.size.height = height;
      });
    },
    /**
     * scroll in canvas
     * @param deltaX movement X in canvas
     * @param deltaY movement Y in canvas
     */
    scroll: (deltaX: number, deltaY: number): void => {
      updateAtom(editorAtoms.state, (draft) => {
        draft.view.offset[0] -= deltaX / draft.view.scale;
        draft.view.offset[1] -= deltaY / draft.view.scale;
      });
    },
    /**
     * zoom in canvas
     * @param next next scale
     */
    zoom: (cursor: Coordinate2D, next: number | ((_: number) => number)): void => {
      updateAtom(editorAtoms.state, (draft) => {
        // next scale
        let scale = typeof next === "number" ? next : next(draft.view.scale);
        scale = Math.max(Math.min(scale, ZOOM_MAX), ZOOM_MIN);
        // next offset
        const scaleDelta = draft.view.scale / scale;
        const scaleOrigin = Point2D.new(cursor)
          .scale(1 / draft.view.scale)
          .add(draft.view.offset);
        const offset = Point2D.new(draft.view.offset).scale(scaleDelta, scaleOrigin).tuple();
        draft.view.scale = scale;
        draft.view.offset = offset;
      });
    },
  } as const;
};
