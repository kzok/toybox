import { type Draft, produce } from "immer";
import type { createStore, PrimitiveAtom } from "jotai";
import { editorAtoms } from "./atoms";

type Store = Pick<ReturnType<typeof createStore>, "get" | "set">;

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
        // TODO: take zoom scale into account.
        draft.view.offset[0] -= deltaX;
        draft.view.offset[1] -= deltaY;
      });
    },
  } as const;
};
