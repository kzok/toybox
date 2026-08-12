import { renderHook } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vitest } from "vitest";
import { useFocusOut } from "../useFocusOut";

const dispatchFocusOut = (element: HTMLElement): Event => {
  const event = new Event("focusout", { bubbles: true });
  element.dispatchEvent(event);
  return event;
};

describe(useFocusOut, () => {
  afterEach(() => {
    vitest.restoreAllMocks();
  });

  it("calls the callback when focusout fires on the element.", () => {
    const element = document.createElement("div");
    const elementRef: React.RefObject<HTMLElement | null> = { current: element };
    const callback = vitest.fn();
    renderHook(() => useFocusOut(elementRef, callback));

    dispatchFocusOut(element);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  describe("when elementRef.current is null", () => {
    it("does not throw.", () => {
      const elementRef: React.RefObject<HTMLElement | null> = { current: null };
      const callback = vitest.fn();

      expect(() => renderHook(() => useFocusOut(elementRef, callback))).not.toThrow();
    });
  });

  describe("on unmount", () => {
    it("removes the focusout listener.", () => {
      const element = document.createElement("div");
      const elementRef: React.RefObject<HTMLElement | null> = { current: element };
      const callback = vitest.fn();
      const { unmount } = renderHook(() => useFocusOut(elementRef, callback));

      unmount();
      dispatchFocusOut(element);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("when the callback changes after mount", () => {
    it("calls the latest callback without re-registering the listener.", () => {
      const element = document.createElement("div");
      const elementRef: React.RefObject<HTMLElement | null> = { current: element };
      const addEventListener = vitest.spyOn(element, "addEventListener");
      const removeEventListener = vitest.spyOn(element, "removeEventListener");
      const first = vitest.fn();
      const second = vitest.fn();
      const { rerender } = renderHook(({ callback }) => useFocusOut(elementRef, callback), {
        initialProps: { callback: first },
      });

      rerender({ callback: second });
      dispatchFocusOut(element);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
      expect(addEventListener).toHaveBeenCalledTimes(1);
      expect(removeEventListener).not.toHaveBeenCalled();
    });
  });
});
