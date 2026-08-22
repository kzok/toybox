import { castDraft, produce } from "immer";
import { describe, expect, it, vi } from "vitest";
import type { EditorItem } from "../../../features/editorItem";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import { createEditActions } from "../edit";
import {
  createImageItem,
  createTestTarget,
  createTestTargetWithItems,
  createTextItem,
} from "./fixtures";

// NOTE: this environment's jsdom does not implement Range.prototype.getClientRects(), which
// splitLines() depends on to lay text out, so it is stubbed here to give resizeText() a text
// item of a known line count to measure.
vi.mock("../../../features/editorItem/textLayout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../features/editorItem/textLayout")>()),
  splitLines: vi.fn((): readonly string[] => ["first line", "second line"]),
}));

describe(createEditActions, () => {
  describe("enter()", () => {
    it("gets into edit mode with the specified item.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.edit.enter("item-1");
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorMode = { kind: "edit", itemId: "item-1" };
        }),
      );
    });

    it("overwrites the target item of edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.edit.enter("item-1");
      actions.edit.enter("item-2");
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: "item-2" });
    });

    it("keeps the state as it is when the item is already being edited.", () => {
      const item = createTextItem("item-1", "");
      const { store, actions, atoms } = createTestTargetWithItems(item);
      actions.edit.enter(item.id);

      actions.edit.enter(item.id);

      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: item.id });
      expect(store.get(atoms.editorItems)).toStrictEqual([item]);
    });
  });

  describe("setText()", () => {
    const setUp = () => {
      const textItem = createTextItem("item-1", "hello");
      const imageItem = createImageItem("item-2", [0, 0]);
      const target = createTestTargetWithItems(textItem, imageItem);
      return { ...target, textItem, imageItem } as const;
    };

    it("updates the content of the specified text item.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.edit.setText(textItem.id, "こんにちは");
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === textItem.id)).toStrictEqual({
        ...textItem,
        content: "こんにちは",
      });
    });

    it("keeps items unchanged when the item is not a text item.", () => {
      const { store, actions, atoms, imageItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.edit.setText(imageItem.id, "こんにちは");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("keeps items unchanged when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);
      actions.edit.setText("missing-id", "こんにちは");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("resizeImage()", () => {
    // width: 100, height: 50 (aspect ratio 2:1)
    const setUp = () => {
      const item = createImageItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    it("scales width and height together, keeping the aspect ratio and the offset.", () => {
      const { store, actions, atoms, item } = setUp();

      // an aspect-correct target (2:1, same ratio as the item), so it is reached exactly.
      actions.edit.resizeImage(item.id, [110, 55]);

      const resized = store.get(atoms.editorItems).find((i) => i.id === item.id);
      expect(resized?.kind).toBe("image");
      expect((resized as EditorItem.Image).width).toBeCloseTo(110);
      expect((resized as EditorItem.Image).height).toBeCloseTo(55);
      expect(resized?.offset).toStrictEqual([0, 0]);
    });

    it("projects an off-ratio target onto the diagonal instead of matching it exactly.", () => {
      const { store, actions, atoms, item } = setUp();

      // not on the 2:1 diagonal; only the projection onto it drives the resize.
      actions.edit.resizeImage(item.id, [110, 40]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(104);
      expect(resized.height).toBeCloseTo(52);
    });

    it("does not shrink either dimension below the minimum size.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.edit.resizeImage(item.id, [-1000, -500]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(72);
      expect(resized.height).toBeCloseTo(36);
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 220,110 screen-px target is 110,55 canvas units — same as the first test.
      actions.edit.resizeImage(item.id, [220, 110]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(110);
      expect(resized.height).toBeCloseTo(55);
    });

    it("keeps items unchanged when the item is not an image item.", () => {
      const { store, actions, atoms } = setUp();
      const textItem = createTextItem("item-2", "hello");
      store.set(
        atoms.state,
        produce(store.get(atoms.state), (draft) => {
          draft.editorItems.push(castDraft(textItem));
        }),
      );
      const before = store.get(atoms.editorItems);

      actions.edit.resizeImage(textItem.id, [10, 5]);

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.edit.resizeImage("missing-id", [10, 5])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("resizeText()", () => {
    // width: 100, fontSize: 32, laid out as 2 lines by the stub above, hence
    // padding: 4, lineHeight: 48 and a drawn box of 108 x 104.
    const setUp = () => {
      const item = createTextItem("item-1", "first line\nsecond line");
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    const textItemOf = (
      items: readonly EditorItem[],
      id: string,
    ): Pick<EditorItem.Text, "width" | "fontSize" | "offset"> => {
      const item = items.find((item) => item.id === id);
      if (item?.kind !== "text") throw new Error("not a text item");
      return { width: item.width, fontSize: item.fontSize, offset: item.offset };
    };

    it("scales the font size and the width together, keeping the offset.", () => {
      const { store, actions, atoms, item } = setUp();

      // an aspect-correct target (1.5x the 108 x 104 box), so the factor is reached exactly.
      actions.edit.resizeText(item.id, [162, 156]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toStrictEqual({
        width: 150,
        fontSize: 48,
        offset: [0, 0],
      });
    });

    it("projects an off-ratio target onto the diagonal and rounds the font size.", () => {
      const { store, actions, atoms, item } = setUp();

      // not on the box's diagonal; the projection asks for 40.3px, which is rounded down.
      actions.edit.resizeText(item.id, [162, 104]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 125,
        fontSize: 40,
      });
    });

    it("stops shrinking at the minimum font size, and the width with it.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.edit.resizeText(item.id, [-1000, -1000]);

      // 12 / 32 of the original width, rather than collapsing along with the pointer.
      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 38,
        fontSize: 12,
      });
    });

    it("stops growing at the maximum font size, and the width with it.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.edit.resizeText(item.id, [1080, 1040]);

      // 72 / 32 of the original width, rather than growing along with the pointer.
      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 225,
        fontSize: 72,
      });
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 324,312 screen-px target is 162,156 canvas units — same as the first test.
      actions.edit.resizeText(item.id, [324, 312]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 150,
        fontSize: 48,
      });
    });

    it("keeps items unchanged when the item is not a text item.", () => {
      const { store, actions, atoms } = setUp();
      const imageItem = createImageItem("item-2", [0, 0]);
      store.set(
        atoms.state,
        produce(store.get(atoms.state), (draft) => {
          draft.editorItems.push(castDraft(imageItem));
        }),
      );
      const before = store.get(atoms.editorItems);

      actions.edit.resizeText(imageItem.id, [100, 50]);

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.edit.resizeText("missing-id", [10, 5])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("leaving edit mode", () => {
    const blank = createTextItem("blank-item", " \n ");
    const filled = createTextItem("filled-item", "hello");

    const setUp = () => {
      const target = createTestTargetWithItems(blank, filled);
      target.actions.edit.enter(blank.id);
      return target;
    };

    it("drops the blank target item on clearing the selection.", () => {
      const { store, actions, atoms } = setUp();
      actions.selection.clear();
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("drops the blank target item on selecting another item.", () => {
      const { store, actions, atoms } = setUp();
      actions.selection.select(filled.id);
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("drops the blank target item on entering edit mode for another item.", () => {
      const { store, actions, atoms } = setUp();
      actions.edit.enter(filled.id);
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("keeps the target item when its content is not blank.", () => {
      const { store, actions, atoms } = createTestTargetWithItems(blank, filled);
      actions.edit.enter(filled.id);

      actions.selection.clear();

      // blank items other than the target one are left as they are.
      expect(store.get(atoms.editorItems)).toStrictEqual([blank, filled]);
    });

    it("keeps items as they are when the mode is not edit mode.", () => {
      const { store, actions, atoms } = createTestTargetWithItems(blank, filled);
      actions.selection.select(blank.id);

      actions.selection.clear();

      expect(store.get(atoms.editorItems)).toStrictEqual([blank, filled]);
    });
  });
});
