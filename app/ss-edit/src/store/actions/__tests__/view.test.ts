import { produce } from "immer";
import { describe, expect, it } from "vitest";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import { createViewActions } from "../view";
import { createTestTarget as createFullTarget } from "./fixtures";

describe(createViewActions, () => {
  const createTestTarget = () => {
    const { store, actions, atoms } = createFullTarget();
    return { store, actions: actions.view, atoms } as const;
  };

  describe("syncCanvasSize()", () => {
    it("updates view.canvas.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.syncCanvasSize([100, 200]);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.canvasSize = new Vec2(100, 200);
        }),
      );
    });
  });

  describe("scroll()", () => {
    it("updates view.offset.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.scroll(100, 200);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.offset = new Vec2(-100, -200);
        }),
      );
    });
  });

  describe("zoom()", () => {
    /**
     * @returns a target whose pane is 400 x 300 and whose view sits at (40, 60), so that neither
     *   the center of the pane nor the offset of the view is zero.
     */
    const setUpPannedView = () => {
      const target = createTestTarget();
      target.actions.syncCanvasSize([400, 300]);
      target.actions.scroll(-40, -60);
      return target;
    };

    /** a cursor 80px right of and 60px below the center of the pane, hence on picture (120, 120). */
    const CURSOR = new Vec2(280, 210);

    it("updates view.scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(1.2, new Vec2(0, 0));
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.scale = 1.2;
        }),
      );
      actions.zoom((s) => s + 0.1, new Vec2(0, 0));
      expect(store.get(atoms.editorView).scale).toBe(1.3);
    });

    it("has minimum scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(0, new Vec2(0, 0));
      expect(store.get(atoms.editorView).scale).toBe(0.27);
    });

    it("has maximum scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(100, new Vec2(0, 0));
      expect(store.get(atoms.editorView).scale).toBe(2);
    });

    it("pulls the offset towards the cursor when zooming in.", () => {
      const { store, actions, atoms } = setUpPannedView();
      expect(store.get(atoms.editorView).offset.tuple()).toStrictEqual([40, 60]);

      actions.zoom(2, CURSOR);

      // the offset keeps picture (120, 120) under the cursor at half its former distance.
      expect(store.get(atoms.editorView).offset.tuple()).toStrictEqual([80, 90]);
    });

    it("pushes the offset away from the cursor when zooming out.", () => {
      const { store, actions, atoms } = setUpPannedView();
      actions.zoom(0.5, CURSOR);
      expect(store.get(atoms.editorView).offset.tuple()).toStrictEqual([-40, 0]);
    });

    it("leaves the offset alone when the cursor is on the center of the pane.", () => {
      const { store, actions, atoms } = setUpPannedView();
      actions.zoom(2, new Vec2(200, 150));
      expect(store.get(atoms.editorView).offset.tuple()).toStrictEqual([40, 60]);
    });

    it("zooms around the center of the pane when no cursor is given.", () => {
      const { store, actions, atoms } = setUpPannedView();
      actions.zoom(1.5);
      expect(store.get(atoms.editorView).offset.tuple()).toStrictEqual([40, 60]);
      expect(store.get(atoms.editorView).scale).toBe(1.5);
    });

    it("moves the offset by the clamped scale rather than the requested one.", () => {
      const { store, actions, atoms } = setUpPannedView();
      actions.zoom(100, CURSOR);
      // the offset of a zoom to the maximum of 2; the requested 100 would leave it near (119, 119).
      expect(store.get(atoms.editorView).offset.tuple()).toStrictEqual([80, 90]);
      expect(store.get(atoms.editorView).scale).toBe(2);
    });
  });
});
