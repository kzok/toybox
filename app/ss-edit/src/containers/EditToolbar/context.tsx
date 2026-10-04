import React from "react";

/** the `<textarea/>` of the text item under edit, to which the toolbar hands the focus back. */
type TextEditorRefType = React.RefObject<HTMLTextAreaElement | null>;

const context = React.createContext<TextEditorRefType | null>(null);

export const TextEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  return <context.Provider value={ref}>{children}</context.Provider>;
};

export const useTextEditorRef = (): TextEditorRefType => {
  const contextValue = React.useContext(context);
  if (contextValue == null) {
    throw new Error("Please wrap the component with <TextEditorProvider/>.");
  }
  return contextValue;
};
