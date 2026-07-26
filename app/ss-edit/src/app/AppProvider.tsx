import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Provider as JotaiProvider } from "jotai";
import type React from "react";
import { StrictMode } from "react";
import { EditorProvider } from "../store/editor/context";

export const AppProvider: React.FC<{
  className?: string | undefined;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <StrictMode>
    <FluentProvider className={className} theme={webLightTheme}>
      <JotaiProvider>
        <EditorProvider>{children}</EditorProvider>
      </JotaiProvider>
    </FluentProvider>
  </StrictMode>
);
