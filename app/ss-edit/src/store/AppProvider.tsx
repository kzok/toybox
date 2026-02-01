import { Provider as JotaiProvider } from "jotai";
import React from "react";
import { EditorActionsProvider } from "./editor/context";

/** React component having only `children` in `props`. */
type Wrapper = React.FC<{ children: React.ReactNode }>;

/**
 * @param wrappers React wrapper components.
 * @returns concatinated React wrapper component.
 */
const concat = (...wrappers: Wrapper[]): Wrapper => {
  wrappers = wrappers.reverse();
  return ({ children }) => {
    let reactNode: React.ReactNode = children;
    for (const wrapper of wrappers) {
      reactNode = React.createElement(wrapper, null, reactNode);
    }
    return reactNode;
  };
};

export const AppProvider = concat(JotaiProvider, EditorActionsProvider);
