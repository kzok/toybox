import { renderHook } from "@testing-library/react";
import { Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { EditorActionsProvider, useEditorActions } from "../context";

describe(useEditorActions, () => {
  describe("without Provider", () => {
    it("throws an error.", () => {
      const renderTarget = () =>
        renderHook(() => useEditorActions(), {
          wrapper: ({ children }) => <Provider>{children}</Provider>,
        });
      expect(() => renderTarget()).toThrowError("Please wrap the component with <Provider/>.");
    });
  });

  describe("without Provider", () => {
    it("doesnt throw an error.", () => {
      const renderTarget = () =>
        renderHook(() => useEditorActions(), {
          wrapper: ({ children }) => (
            <Provider>
              <EditorActionsProvider>{children}</EditorActionsProvider>
            </Provider>
          ),
        });
      expect(() => renderTarget()).not.toThrowError();
    });
  });
});
