import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Provider as JotaiProvider } from "jotai";
import type React from "react";
import { StrictMode } from "react";
import { StoreProvider } from "../store/context";

const theme = {
  ...webLightTheme,
  // use font-family set in the global style.
  fontFamilyBase: "var(--font-family)",
};

export const AppProvider: React.FC<{
  className?: string | undefined;
  children: React.ReactNode;
}> = ({ className, children }) => (
  <StrictMode>
    <FluentProvider className={className} theme={theme}>
      <JotaiProvider>
        <StoreProvider>{children}</StoreProvider>
      </JotaiProvider>
    </FluentProvider>
  </StrictMode>
);
