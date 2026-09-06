import { produce } from "immer";
import type { Atoms } from "../atoms";
import { createAddItemActions } from "./addItem";
import { createEditActions } from "./edit";
import { createPictureActions } from "./picture";
import { createSelectionActions } from "./selection";
import type { ActionCreatorParam, StoreInterface, UpdateAtom } from "./types";
import { createViewActions } from "./view";

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

  return {
    view: createViewActions(params),
    selection: createSelectionActions(params),
    edit: createEditActions(params),
    addItem: createAddItemActions(params),
    picture: createPictureActions(params),
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
