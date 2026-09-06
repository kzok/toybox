import React from "react";
import { type PageActions, pageCtx } from "../../../store";
import { Vec2 } from "../../../utils/geometry";

/** the scale ratio of one mouse wheel notch, whose `deltaY` Chrome sets to 100. */
const NOTCH_ZOOM_RATIO = 1.3;

/** the scale ratio per unit of `deltaY` from a trackpad pinch. */
const PINCH_ZOOM_RATIO = 1.02;

/**
 * `|deltaY|` at or above which a wheel event is read as a mouse wheel notch rather than a
 * trackpad pinch.
 * @note Chrome synthesises a pinch into a stream of `ctrl+wheel` events whose `deltaY` is 0.5-3,
 *   while a wheel notch is 100 or so. Nothing in the event says which device it came from, so the
 *   magnitude is all there is to go on. Reading a pinch as a notch is the worse of the two
 *   mistakes — one event would jump by 30% — hence the threshold sits well above the pinch range
 *   and anything below it falls back to the pinch branch.
 */
const NOTCH_DELTA_MIN = 20;

/** the scale a zoom step lands on when it crosses it. */
const SNAP_SCALE = 1;

/**
 * @param scale the current scale
 * @param deltaY `deltaY` of a `ctrl+wheel` event
 * @returns the next scale, before it is clamped to the zoom range
 * @note the snap fires on *crossing* 100% rather than on landing near it: a window around 100%
 *   would swallow every pinch step, since one is far smaller than any window worth having, and
 *   100% would become a scale the trackpad cannot leave.
 */
export const nextWheelZoomScale = (scale: number, deltaY: number): number => {
  const next =
    Math.abs(deltaY) >= NOTCH_DELTA_MIN
      ? NOTCH_ZOOM_RATIO ** (-deltaY / 100) * scale
      : PINCH_ZOOM_RATIO ** -deltaY * scale;
  return (scale - SNAP_SCALE) * (next - SNAP_SCALE) < 0 ? SNAP_SCALE : next;
};

/**
 * register wheel event handler
 */
export const useWheelEvent = (elementRef: React.RefObject<HTMLElement | null>): void => {
  const actions = pageCtx.useActions();
  React.useLayoutEffect(() => {
    const element = elementRef.current;
    if (element == null) {
      return;
    }
    const handler = new WheelHandler(element, actions);
    return () => handler.cleanup();
  }, [elementRef, actions]);
};

/**
 * Wheel event handlers via DOM API
 * @note React onWheel callback didn't work: it registers `wheel` as a passive listener, so the
 *   `preventDefault()` below is ignored there and the browser scrolls or zooms the page as well.
 */
class WheelHandler {
  constructor(
    readonly element: HTMLElement,
    readonly actions: PageActions,
  ) {
    this.element.addEventListener("wheel", this.onWheel);
  }
  /** remove event listeners */
  cleanup(): void {
    this.element.removeEventListener("wheel", this.onWheel);
  }
  /**
   * handle wheel scroll event.
   */
  private handleWheelScroll(e: WheelEvent): void {
    this.actions.view.scroll(-e.deltaX, -e.deltaY);
  }
  /**
   * handle wheel zoom event.
   */
  private handleWheelZoom(e: WheelEvent): void {
    const cursor = Vec2.new(e.clientX, e.clientY).sub(this.element.getBoundingClientRect());
    this.actions.view.zoom((scale) => nextWheelZoomScale(scale, e.deltaY), cursor);
  }
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
