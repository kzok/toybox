import type { Draft } from "immer";
import type { createStore, PrimitiveAtom } from "jotai";
import type { Atoms } from "../atoms";

export type StoreInterface = Pick<ReturnType<typeof createStore>, "get" | "set">;

export type UpdateAtom = <T>(atom: PrimitiveAtom<T>, recipe: (_: Draft<T>) => void) => void;

export type ActionCreatorParam = {
  store: StoreInterface;
  atoms: Atoms;
  updateAtom: UpdateAtom;
};
