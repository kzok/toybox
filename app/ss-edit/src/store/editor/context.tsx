import { useStore } from "jotai";
import React from "react";
import { createActions } from "./create-actions";

export type EditorActions = ReturnType<typeof createActions>;

const context = React.createContext<EditorActions | null>(null);

export const EditorActionsProvider: React.FC<{ children: React.ReactNode }> = (props) => {
  const store = useStore();
  const contextValue = React.useMemo(() => createActions(store), [store]);

  return <context.Provider value={contextValue}>{props.children}</context.Provider>;
};

/**
 * @returns editor actions from the context.
 */
export const useEditorActions = (): EditorActions => {
  const actions = React.useContext(context);
  if (actions == null) {
    throw new Error("Please wrap the component with <Provider/>.");
  }
  return actions;
};
