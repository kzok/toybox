import { renderHook } from "@testing-library/react";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { StoreProvider, useEditorActions } from "../context";

describe(useEditorActions, () => {
  describe("without Provider", () => {
    it("throws an error.", () => {
      const renderTarget = () =>
        renderHook(() => useEditorActions(), {
          wrapper: ({ children }) => <Provider>{children}</Provider>,
        });
      expect(() => renderTarget()).toThrow("Please wrap the component with <Provider/>.");
    });
  });

  describe("with Provider", () => {
    it("doesnt throw an error.", () => {
      const renderTarget = () =>
        renderHook(() => useEditorActions(), {
          wrapper: ({ children }) => (
            <Provider>
              <StoreProvider>{children}</StoreProvider>
            </Provider>
          ),
        });
      expect(() => renderTarget()).not.toThrow();
    });
  });
});
