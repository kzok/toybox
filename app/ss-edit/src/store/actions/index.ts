import { produce } from "immer";
import type { Atoms } from "../atoms";
import { createAddItemModeActions } from "./addItemMode";
import { createEditModeActions } from "./editMode";
import { createPictureActions } from "./picture";
import { createSelectModeActions } from "./selectMode";
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
    selectMode: createSelectModeActions(params),
    editMode: createEditModeActions(params),
    addItemMode: createAddItemModeActions(params),
    picture: createPictureActions(params),
  } as const;
};

export type Actions = ReturnType<typeof createActions>;
