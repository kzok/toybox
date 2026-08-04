import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vitest } from "vitest";
import { useWindowFileDrop } from "../useWindowFileDrop";

type DragEventName = "dragenter" | "dragover" | "dragleave" | "drop";

/** the hook only reads `types` off the payload, hence the rest of `DataTransfer` is left out. */
type DragPayload = Readonly<{ types: readonly string[] }>;

const FILE_PAYLOAD: DragPayload = { types: ["Files"] };

/** jsdom has no `DragEvent` constructor, hence a plain event carrying a `dataTransfer`. */
const dispatchDrag = (name: DragEventName, dataTransfer: DragPayload = FILE_PAYLOAD): Event => {
  const event = new Event(name, { cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer, configurable: true });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
};

const setUp = () => {
  const onDrop = vitest.fn();
  const rendered = renderHook(() => useWindowFileDrop(onDrop));
  return { onDrop, ...rendered };
};

describe(useWindowFileDrop, () => {
  it("reports no drag before anything is dragged.", () => {
    const { result } = setUp();
    expect(result.current).toBe(false);
  });

  it("reports a drag while files are dragged over the window.", () => {
    const { result } = setUp();

    dispatchDrag("dragenter");
    expect(result.current).toBe(true);
  });

  it("keeps reporting a drag until the outermost element is left.", () => {
    const { result } = setUp();

    // the cursor crosses into a child element, which fires enter before the leave of its parent.
    dispatchDrag("dragenter");
    dispatchDrag("dragenter");
    dispatchDrag("dragleave");
    expect(result.current).toBe(true);

    dispatchDrag("dragleave");
    expect(result.current).toBe(false);
  });

  it("prevents the default action on dragover so that the browser doesnt open the file.", () => {
    setUp();

    const event = dispatchDrag("dragover");
    expect(event.defaultPrevented).toBe(true);
  });

  it("passes the payload to the callback on drop, then reports no drag.", () => {
    const { result, onDrop } = setUp();
    const dataTransfer: DragPayload = { types: ["Files"] };

    dispatchDrag("dragenter", dataTransfer);
    const event = dispatchDrag("drop", dataTransfer);

    expect(onDrop).toHaveBeenCalledExactlyOnceWith(dataTransfer);
    expect(event.defaultPrevented).toBe(true);
    expect(result.current).toBe(false);
  });

  it("ignores a drag that carries no file.", () => {
    const { result, onDrop } = setUp();
    const selection: DragPayload = { types: ["text/plain"] };

    dispatchDrag("dragenter", selection);
    expect(result.current).toBe(false);
    expect(dispatchDrag("dragover", selection).defaultPrevented).toBe(false);

    dispatchDrag("drop", selection);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("reflects the latest callback without re-registering the listeners.", () => {
    const addEventListener = vitest.spyOn(window, "addEventListener");
    const removeEventListener = vitest.spyOn(window, "removeEventListener");
    const stale = vitest.fn();
    const fresh = vitest.fn();
    const { rerender } = renderHook(({ onDrop }) => useWindowFileDrop(onDrop), {
      initialProps: { onDrop: stale },
    });

    rerender({ onDrop: fresh });
    dispatchDrag("drop");

    expect(stale).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledOnce();
    // one listener per drag event, registered on mount only.
    expect(addEventListener).toHaveBeenCalledTimes(4);
    expect(removeEventListener).not.toHaveBeenCalled();
  });

  it("removes the listeners on unmount.", () => {
    const { onDrop, result, unmount } = setUp();

    unmount();
    dispatchDrag("dragenter");
    dispatchDrag("drop");

    expect(result.current).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
  });
});
