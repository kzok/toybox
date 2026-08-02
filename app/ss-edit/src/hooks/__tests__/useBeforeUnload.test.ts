import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vitest } from "vitest";
import { useBeforeUnload } from "../useBeforeUnload";

const dispatchBeforeUnload = (): Event => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe(useBeforeUnload, () => {
  afterEach(() => {
    vitest.restoreAllMocks();
  });

  describe("when enabled", () => {
    it("prevents the default action on beforeunload.", () => {
      renderHook(() => useBeforeUnload(true));

      const event = dispatchBeforeUnload();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe("when disabled", () => {
    it("doesnt prevent the default action on beforeunload.", () => {
      renderHook(() => useBeforeUnload(false));

      const event = dispatchBeforeUnload();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("when enabled changes after mount", () => {
    it("reflects the latest value without re-registering the listener.", () => {
      const addEventListener = vitest.spyOn(window, "addEventListener");
      const removeEventListener = vitest.spyOn(window, "removeEventListener");
      const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
        initialProps: { enabled: false },
      });
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

      rerender({ enabled: true });
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

      expect(addEventListener).toHaveBeenCalledTimes(1);
      expect(removeEventListener).not.toHaveBeenCalled();
    });
  });

  describe("on unmount", () => {
    it("removes the beforeunload listener.", () => {
      const { unmount } = renderHook(() => useBeforeUnload(true));

      unmount();
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });
  });
});
