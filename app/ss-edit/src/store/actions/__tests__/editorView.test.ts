import { produce } from "immer";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { createAtoms, INITIAL_EDITOR_STATE } from "../../atoms";
import { createActions } from "..";
import { createEditorViewActions } from "../editorView";

describe(createEditorViewActions, () => {
  const createTestTarget = () => {
    const store = createStore();
    const atoms = createAtoms();
    const actions = createActions(store, atoms).editorView;
    return { store, actions, atoms } as const;
  };

  describe("syncCanvasSize()", () => {
    it("updates view.canvas.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.syncCanvasSize([100, 200]);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.canvasSize = [100, 200];
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
          draft.editorView.offset[0] -= 100;
          draft.editorView.offset[1] -= 200;
        }),
      );
    });
  });

  describe("zoom()", () => {
    it("updates view.scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(1.2, [0, 0]);
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorView.scale = 1.2;
        }),
      );
      actions.zoom((s) => s + 0.1, [0, 0]);
      expect(store.get(atoms.editorView).scale).toBe(1.3);
    });

    it("has minimum scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(0, [0, 0]);
      expect(store.get(atoms.editorView).scale).toBe(0.27);
    });

    it("has maximum scale.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.zoom(100, [0, 0]);
      expect(store.get(atoms.editorView).scale).toBe(2);
    });
  });
});
