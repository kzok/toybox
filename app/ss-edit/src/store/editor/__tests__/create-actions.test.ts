import { produce } from "immer";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { editorAtoms, INITIAL_EDITOR_STATE } from "../atoms";
import { createActions } from "../create-actions";

describe(createActions, () => {
  const createTestTarget = () => {
    const store = createStore();
    const actions = createActions(store);
    return { store, actions };
  };

  describe("updateCanvasSize()", () => {
    it("updates view.canvas.", () => {
      const { store, actions } = createTestTarget();
      expect(store.get(editorAtoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.updateCanvasSize(100, 200);
      expect(store.get(editorAtoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.view.size.width = 100;
          draft.view.size.height = 200;
        }),
      );
    });
  });

  describe("scroll()", () => {
    it("updates view.offset.", () => {
      const { store, actions } = createTestTarget();
      expect(store.get(editorAtoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.scroll(100, 200);
      expect(store.get(editorAtoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.view.offset[0] -= 100;
          draft.view.offset[1] -= 200;
        }),
      );
    });
  });

  describe("zoom()", () => {
    it("updates view.scale.", () => {
      const { store, actions } = createTestTarget();
      expect(store.get(editorAtoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom([0, 0], 1.2);
      expect(store.get(editorAtoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.view.scale = 1.2;
        }),
      );
      actions.zoom([0, 0], (s) => s + 0.1);
      expect(store.get(editorAtoms.view).scale).toBe(1.3);
    });

    it("has minimum scale.", () => {
      const { store, actions } = createTestTarget();
      expect(store.get(editorAtoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom([0, 0], 0);
      expect(store.get(editorAtoms.view).scale).toBe(0.27);
    });

    it("has maximum scale.", () => {
      const { store, actions } = createTestTarget();
      expect(store.get(editorAtoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom([0, 0], 100);
      expect(store.get(editorAtoms.view).scale).toBe(2);
    });
  });
});
