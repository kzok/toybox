import { castDraft } from "immer";
import { Point2D, type Tuple2D } from "../../utils/geometry";
import type { ActionCreatorParam } from "./types";

const ZOOM_MIN = 0.27;
const ZOOM_MAX = 2.0;

/**
 * @param params store, atoms and updateAtom
 * @returns actions for editor view
 */
export const createEditorViewActions = ({ atoms, updateAtom }: ActionCreatorParam) => {
  return {
    /**
     * update editor pane size
     * @param canvasSize [width, height]
     */
    syncCanvasSize: (canvasSize: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.canvasSize = castDraft(canvasSize);
      });
    },
    /**
     * scroll in canvas
     * @param deltaX movement X in canvas
     * @param deltaY movement Y in canvas
     */
    scroll: (deltaX: number, deltaY: number): void => {
      updateAtom(atoms.state, (draft) => {
        draft.editorView.offset[0] -= deltaX / draft.editorView.scale;
        draft.editorView.offset[1] -= deltaY / draft.editorView.scale;
      });
    },
    /**
     * zoom in canvas
     * @param next next scale
     * @param cursor cursor offset from top-left of `<canvas/>`
     */
    zoom: (next: number | ((_: number) => number), cursor?: Tuple2D): void => {
      updateAtom(atoms.state, (draft) => {
        const halfPaneSize = Point2D.new(draft.editorView.canvasSize).div(2).tuple();
        cursor = cursor ?? halfPaneSize;
        // next scale
        let scale = typeof next === "number" ? next : next(draft.editorView.scale);
        scale = Math.max(Math.min(scale, ZOOM_MAX), ZOOM_MIN);
        // next offset
        const scaleDelta = draft.editorView.scale / scale;
        const scaleOrigin = Point2D.new(cursor)
          .sub(halfPaneSize)
          .div(draft.editorView.scale)
          .add(draft.editorView.offset);
        const offset = Point2D.new(draft.editorView.offset).scale(scaleDelta, scaleOrigin).tuple();
        draft.editorView.scale = scale;
        draft.editorView.offset = offset;
      });
    },
  } as const;
};
