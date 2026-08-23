import React from "react";

type AnchorRefType = React.RefObject<HTMLElement | null>;

const context = React.createContext<AnchorRefType | null>(null);

export const Provider = context.Provider;

export const useContextValue = () => {
  const contextValue = React.useContext(context);
  if (contextValue == null) {
    throw new Error("Please wrap the component with <Provider/>.");
  }
  return contextValue;
};
