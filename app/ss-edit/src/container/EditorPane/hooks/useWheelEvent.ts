import React from "react";
import { type EditorActions, useEditorActions } from "../../../store/editor";

/**
 * Wheel event handlers via DOM API
 * @note React onWheel callback didn't work.
 */
class PointerEventHandler {
  /**
   * @param element
   * @param actions
   */
  constructor(
    readonly element: HTMLElement,
    readonly actions: EditorActions,
  ) {
    this.element.addEventListener("wheel", this.onWheel);
  }
  /** remove event listeners */
  cleanup(): void {
    this.element.removeEventListener("wheel", this.onWheel);
  }
  /**
   * handle wheel scroll event.
   * @param e
   */
  private handleWheelScroll(e: WheelEvent): void {
    this.actions.scroll(-e.deltaX, -e.deltaY);
  }
  /**
   * handle wheel zoom event.
   * @param e
   */
  private handleWheelZoom(e: WheelEvent): void {
    const cursor = [e.offsetX, e.offsetY] as const;
    this.actions.zoom(cursor, (scale) => {
      scale = 1.3 ** (e.deltaY * -0.01) * scale;
      if (0.9 < scale && scale < 1.1) {
        return 1; // snap to 100%
      }
      return scale;
    });
  }
  /**
   * @param e
   */
  readonly onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey) {
      this.handleWheelZoom(e);
    } else {
      this.handleWheelScroll(e);
    }
  };
}

/**
 * register wheel event handler
 * @param elementRef ref object for an element
 */
export const useWheelEvent = (elementRef: React.RefObject<HTMLElement | null>): void => {
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
