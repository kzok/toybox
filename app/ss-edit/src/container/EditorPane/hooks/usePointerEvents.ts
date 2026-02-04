import React from "react";
import { type EditorActions, useEditorActions } from "../../../store/editor";

type TrackingStatus = Readonly<{ mode: "none" } | { mode: "scroll" }>;

const TRACKING_STATUS_NONE: TrackingStatus = { mode: "none" };
const DATA_ATTR_POINTER_MODE = "data-pointer-mode";

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
    this.updateStatus(this.status);
  }
  /** remove event listeners */
  cleanup(): void {
    this.element.removeEventListener("pointermove", this.onPointerMove);
    this.element.removeEventListener("pointerup", this.onPointerUp);
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
