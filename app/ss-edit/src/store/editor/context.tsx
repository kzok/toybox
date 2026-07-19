import { useStore } from "jotai";
import React from "react";
import { type Actions, createActions } from "./actions";
import { type Atoms, createAtoms } from "./atoms";

export type EditorActions = Actions;
export type EditorAtoms = Atoms;

type ContextValue = Readonly<{ atoms: Atoms; actions: Actions }>;

const context = React.createContext<ContextValue | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = (props) => {
  const store = useStore();
  const contextValue = React.useMemo((): ContextValue => {
    const atoms = createAtoms();
    const actions = createActions(store, atoms);
    return { atoms, actions };
  }, [store]);

  return <context.Provider value={contextValue}>{props.children}</context.Provider>;
};

/**
 * @returns editor atoms.
 */
export const useEditorAtoms = (): Atoms => useContextValue().atoms;

/**
 * @returns editor actions.
 */
export const useEditorActions = (): Actions => useContextValue().actions;

const useContextValue = () => {
  const contextValue = React.useContext(context);
  if (contextValue == null) {
    throw new Error("Please wrap the component with <Provider/>.");
  }
  return contextValue;
};
