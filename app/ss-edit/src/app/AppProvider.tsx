import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Provider as JotaiProvider } from "jotai";
import type React from "react";
import { StrictMode } from "react";
import { StoreProvider } from "../store/context";

/**
 * `webLightTheme` with the font of `@~/ui` in place of the one Fluent ships with, so that the
 * shell and the text drawn onto the picture follow a single declaration.
 * @note the theme lands as custom properties on the provider element, hence the `var()` is left
 *   for the browser to resolve against `:root` rather than read out here.
 */
const theme = { ...webLightTheme, fontFamilyBase: "var(--font-family)" };

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
