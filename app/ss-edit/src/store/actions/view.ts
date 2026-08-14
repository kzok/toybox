import { Vec2 } from "../../utils/geometry";
import type { ActionCreatorParam } from "./types";

const ZOOM_MIN = 0.27;
const ZOOM_MAX = 2.0;

/**
 * @param params store, atoms and updateAtom
 * @returns actions for the editor view
 */
export const createViewActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /**
     * update editor pane size
     * @param canvasSize (width, height)
     */
    syncCanvasSize: (canvasSize: Vec2.Tuple): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.canvasSize = Vec2.new(canvasSize);
      });
    },
    /**
     * scroll in canvas
     * @param deltaX movement X in canvas
     * @param deltaY movement Y in canvas
     */
    scroll: (deltaX: number, deltaY: number): void => {
      updateAtom(atoms.state, (draft) => {
        const { offset, scale } = draft.editorView;
        draft.editorView.offset = offset.sub(Vec2.new(deltaX, deltaY).div(scale));
      });
    },
    /**
     * zoom in canvas
     * @param next next scale
     * @param cursor cursor offset from top-left of `<canvas/>`
     */
    zoom: (next: number | ((_: number) => number), cursor?: Vec2): void => {
      updateAtom(atoms.state, (draft) => {
        const { offset, canvasSize } = draft.editorView;
        const halfPaneSize = canvasSize.div(2);
        cursor ??= halfPaneSize;
        // next scale
        let scale = typeof next === "number" ? next : next(draft.editorView.scale);
        scale = Math.max(Math.min(scale, ZOOM_MAX), ZOOM_MIN);
        // next offset
        const scaleDelta = draft.editorView.scale / scale;
        const scaleOrigin = cursor.sub(halfPaneSize).div(draft.editorView.scale).add(offset);
        draft.editorView.scale = scale;
        draft.editorView.offset = offset.scale(scaleDelta, scaleOrigin);
      });
    },
  } as const;
};
