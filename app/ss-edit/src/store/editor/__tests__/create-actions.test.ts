import { produce } from "immer";
import { createStore } from "jotai";
import { describe, expect, it } from "vitest";
import { editorAtoms, INITIAL_EDITOR_STATE } from "../atoms";
import { createActions } from "../create-actions";

describe(createActions, () => {
  describe("updateCanvasSize()", () => {
    it("updates view.canvas.", () => {
      const store = createStore();
      const actions = createActions(store);
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
      const store = createStore();
      const actions = createActions(store);
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
});
