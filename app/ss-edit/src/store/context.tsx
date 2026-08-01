import { useStore } from "jotai";
import React from "react";
import { type Actions, createActions } from "./actions";
import { type Atoms, createAtoms } from "./atoms";

export type PageActions = Actions;
export type PageAtoms = Atoms;

type ContextValue = Readonly<{ atoms: Atoms; actions: Actions }>;

const context = React.createContext<ContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = (props) => {
  const store = useStore();
  const contextValue = React.useMemo((): ContextValue => {
    const atoms = createAtoms();
    const actions = createActions(store, atoms);
    return { atoms, actions };
  }, [store]);

  return <context.Provider value={contextValue}>{props.children}</context.Provider>;
};

export const useContextValue = () => {
  const contextValue = React.useContext(context);
  if (contextValue == null) {
    throw new Error("Please wrap the component with <Provider/>.");
  }
  return contextValue;
};
