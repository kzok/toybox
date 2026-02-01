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
        draft.view.canvas.width = width;
        draft.view.canvas.height = height;
      });
    },
  } as const;
};
