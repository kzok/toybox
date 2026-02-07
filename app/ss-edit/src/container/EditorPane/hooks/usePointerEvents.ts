import React from "react";
import { type EditorActions, useEditorActions } from "../../../store/editor";

type TrackingStatus = Readonly<{ mode: "none" } | { mode: "scroll" }>;

const TRACKING_STATUS_NONE: TrackingStatus = { mode: "none" };
const DATA_ATTR_POINTER_MODE = "data-pointer-mode";

/**
 * @param e
 * @return `true` means it supposed to be trackpad.
 */
const isTrackpad = (e: WheelEvent): boolean => {
  const isPixelMode = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL;
  const deltaY = Math.abs(e.deltaY);
  if (isPixelMode && deltaY < 50) {
    return true;
  } else if (!isPixelMode || deltaY % 100 === 0 || deltaY % 120 === 0) {
    return false;
  } else {
    return deltaY < 50; // fallback
  }
};

/**
 * pointer event handlers via DOM API
 * @note
 * Considering possible performance degration due to event frequency,
 * handling it via React was avoided.
 */
class PointerEventHandler {
  private status: TrackingStatus = TRACKING_STATUS_NONE;
  /**
   * @param element
   * @param actions
   */
  constructor(
    readonly element: HTMLElement,
    readonly actions: EditorActions,
  ) {
    this.element.addEventListener("pointermove", this.onPointerMove);
    this.element.addEventListener("pointerup", this.onPointerUp);
    this.element.addEventListener("wheel", this.onWheel);
    this.updateStatus(this.status);
  }
  /** remove event listeners */
  cleanup(): void {
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("wheel", this.onWheel);
  }
  /**
   * @param status next tracking status
   */
  updateStatus(status: TrackingStatus): void {
    this.status = status;
    if (this.status.mode !== this.element.getAttribute(DATA_ATTR_POINTER_MODE)) {
      this.element.setAttribute(DATA_ATTR_POINTER_MODE, this.status.mode);
    }
  }
  /**
   * @param e
   */
  readonly onPointerMove = (e: PointerEvent): void => {
    if (e.buttons === 1) {
      // main (left) button
      e.preventDefault();
      e.stopPropagation();
      this.element.setPointerCapture(e.pointerId);
      this.updateStatus({ mode: "scroll" });
      this.actions.scroll(e.movementX, e.movementY);
      return;
    }
  };
  /**
   * @param e
   */
  readonly onPointerUp = (e: PointerEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    this.updateStatus(TRACKING_STATUS_NONE);
  };
  /**
   * @param e
   */
  readonly onWheel = (e: WheelEvent): void => {
    if (isTrackpad(e) && !e.ctrlKey) {
      return; // ignore trackpad scroll.
    }
    e.preventDefault();
    e.stopPropagation();
    this.actions.zoom((scale) => {
      scale = 1.3 ** (e.deltaY * -0.01) * scale;
      if (0.9 < scale && scale < 1.1) {
        return 1; // snap to 100%
      }
      return scale;
    });
  };
}

/**
 * register pointer event handlers
 * @param elementRef ref object for an element
 */
export const usePointerEvents = (elementRef: React.RefObject<HTMLElement | null>): void => {
  const actions = useEditorActions();
  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (element == null) {
      return;
    }
    const handler = new PointerEventHandler(element, actions);
    return () => handler.cleanup();
  }, []);
};
