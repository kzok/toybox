import { castDraft, produce } from "immer";
import { describe, expect, it, vi } from "vitest";
import { clampArrowLength, type EditorItem } from "../../../features/editorItem";
import { Vec2 } from "../../../utils/geometry";
import { INITIAL_EDITOR_STATE } from "../../atoms";
import { createEditModeActions } from "../editMode";
import {
  createArrowItem,
  createImageItem,
  createMosaicItem,
  createRectItem,
  createTestTarget,
  createTestTargetWithItems,
  createTextItem,
} from "./fixtures";

// NOTE: this environment's jsdom does not implement Range.prototype.getClientRects(), which
// splitLines() depends on to lay text out, so it is stubbed here to give resizeTextFontSize()
// a text item of a known line count to measure.
vi.mock("../../../features/editorItem/textLayout", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../features/editorItem/textLayout")>()),
  splitLines: vi.fn((): readonly string[] => ["first line", "second line"]),
}));

describe(createEditModeActions, () => {
  describe("enter()", () => {
    it("gets into edit mode with the specified item.", () => {
      const { store, actions, atoms } = createTestTarget();
      expect(store.get(atoms.state)).toStrictEqual(INITIAL_EDITOR_STATE);
      actions.editMode.enter("item-1");
      expect(store.get(atoms.state)).toStrictEqual(
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorMode = { kind: "edit", itemId: "item-1" };
        }),
      );
    });

    it("overwrites the target item of edit mode.", () => {
      const { store, actions, atoms } = createTestTarget();
      actions.editMode.enter("item-1");
      actions.editMode.enter("item-2");
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: "item-2" });
    });

    it("keeps the state as it is when the item is already being edited.", () => {
      const item = createTextItem("item-1", "");
      const { store, actions, atoms } = createTestTargetWithItems(item);
      actions.editMode.enter(item.id);

      actions.editMode.enter(item.id);

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
      actions.editMode.setText(textItem.id, "こんにちは");
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === textItem.id)).toStrictEqual({
        ...textItem,
        content: "こんにちは",
      });
    });

    it("keeps items unchanged when the item is not a text item.", () => {
      const { store, actions, atoms, imageItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setText(imageItem.id, "こんにちは");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("keeps items unchanged when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setText("missing-id", "こんにちは");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("move()", () => {
    const setUp = () => {
      const item1 = createImageItem("item-1", [0, 0]);
      const item2 = createImageItem("item-2", [100, 100]);
      const target = createTestTargetWithItems(item1, item2);
      target.actions.editMode.enter(item1.id);
      return { ...target, item1, item2 } as const;
    };

    it("moves the item under edit alone, staying in edit mode.", () => {
      const { store, actions, atoms, item1, item2 } = setUp();
      actions.editMode.move([10, 20]);
      expect(store.get(atoms.editorMode)).toStrictEqual({ kind: "edit", itemId: item1.id });
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([10, 20]);
      expect(items.find((item) => item.id === item2.id)?.offset).toStrictEqual(item2.offset);
    });

    it("scales the movement delta by the inverse of the view scale.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));
      actions.editMode.move([10, 20]);
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === item1.id)?.offset).toStrictEqual([5, 10]);
    });

    it("keeps the very same items list on a zero delta, which would count as unsaved otherwise.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.move([0, 0]);
      expect(store.get(atoms.editorItems)).toBe(before);
    });

    it("does nothing outside edit mode.", () => {
      const { store, actions, atoms, item1 } = setUp();
      actions.selectMode.select(item1.id);
      const before = store.get(atoms.state);
      actions.editMode.move([10, 20]);
      expect(store.get(atoms.state)).toBe(before);
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
      actions.editMode.resizeImage(item.id, [110, 55]);

      const resized = store.get(atoms.editorItems).find((i) => i.id === item.id);
      expect(resized?.kind).toBe("image");
      expect((resized as EditorItem.Image).width).toBeCloseTo(110);
      expect((resized as EditorItem.Image).height).toBeCloseTo(55);
      expect(resized?.offset).toStrictEqual([0, 0]);
    });

    it("projects an off-ratio target onto the diagonal instead of matching it exactly.", () => {
      const { store, actions, atoms, item } = setUp();

      // not on the 2:1 diagonal; only the projection onto it drives the resize.
      actions.editMode.resizeImage(item.id, [110, 40]);

      const resized = store
        .get(atoms.editorItems)
        .find((i) => i.id === item.id) as EditorItem.Image;
      expect(resized.width).toBeCloseTo(104);
      expect(resized.height).toBeCloseTo(52);
    });

    it("does not shrink either dimension below the minimum size.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeImage(item.id, [-1000, -500]);

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
      actions.editMode.resizeImage(item.id, [220, 110]);

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

      actions.editMode.resizeImage(textItem.id, [10, 5]);

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.editMode.resizeImage("missing-id", [10, 5])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("resizeTextFontSize()", () => {
    // width: 100, fontSize: 32, laid out as 2 lines by the stub above, hence
    // lineHeight: 40 and a drawn box of 100 x 80.
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

      // an aspect-correct target (1.5x the 100 x 80 box), so the factor is reached exactly.
      actions.editMode.resizeTextFontSize(item.id, [150, 120]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toStrictEqual({
        width: 150,
        fontSize: 48,
        offset: [0, 0],
      });
    });

    it("projects an off-ratio target onto the diagonal and rounds the font size.", () => {
      const { store, actions, atoms, item } = setUp();

      // not on the box's diagonal; the projection asks for 40.2px, which is rounded down.
      actions.editMode.resizeTextFontSize(item.id, [150, 70]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 125,
        fontSize: 40,
      });
    });

    it("stops shrinking at the minimum font size, and the width with it.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeTextFontSize(item.id, [-1000, -1000]);

      // 12 / 32 of the original width, rather than collapsing along with the pointer.
      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 38,
        fontSize: 12,
      });
    });

    it("stops growing at the maximum font size, and the width with it.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeTextFontSize(item.id, [1080, 1040]);

      // 72 / 32 of the original width, rather than growing along with the pointer.
      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 225,
        fontSize: 72,
      });
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 300,240 screen-px target is 150,120 canvas units — same as the first test.
      actions.editMode.resizeTextFontSize(item.id, [300, 240]);

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

      actions.editMode.resizeTextFontSize(imageItem.id, [100, 50]);

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.editMode.resizeTextFontSize("missing-id", [10, 5])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("setTextFontSize()", () => {
    // width: 100, fontSize: 32
    const setUp = () => {
      const textItem = createTextItem("item-1", "hello");
      const imageItem = createImageItem("item-2", [0, 0]);
      const target = createTestTargetWithItems(textItem, imageItem);
      return { ...target, textItem, imageItem } as const;
    };

    const textItemOf = (items: readonly EditorItem[], id: string) => {
      const item = items.find((item) => item.id === id);
      if (item?.kind !== "text") throw new Error("not a text item");
      return { width: item.width, fontSize: item.fontSize, offset: item.offset };
    };

    it("scales the width by the same factor as the font size, keeping the offset.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.editMode.setTextFontSize(textItem.id, 48);
      expect(textItemOf(store.get(atoms.editorItems), textItem.id)).toStrictEqual({
        width: 150,
        fontSize: 48,
        offset: [0, 0],
      });
    });

    it("rounds a fractional font size.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.editMode.setTextFontSize(textItem.id, 40.4);
      expect(textItemOf(store.get(atoms.editorItems), textItem.id)).toMatchObject({
        width: 125,
        fontSize: 40,
      });
    });

    it("stops at the minimum font size, and the width with it.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.editMode.setTextFontSize(textItem.id, 1);
      expect(textItemOf(store.get(atoms.editorItems), textItem.id)).toMatchObject({
        width: 38,
        fontSize: 12,
      });
    });

    it("stops at the maximum font size, and the width with it.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.editMode.setTextFontSize(textItem.id, 1000);
      expect(textItemOf(store.get(atoms.editorItems), textItem.id)).toMatchObject({
        width: 225,
        fontSize: 72,
      });
    });

    it("keeps the very same items list on the current font size, which would count as unsaved otherwise.", () => {
      const { store, actions, atoms, textItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setTextFontSize(textItem.id, textItem.fontSize);
      expect(store.get(atoms.editorItems)).toBe(before);
    });

    it("keeps items unchanged when the item is not a text item.", () => {
      const { store, actions, atoms, imageItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setTextFontSize(imageItem.id, 48);
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("keeps items unchanged when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setTextFontSize("missing-id", 48);
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("setTextColor()", () => {
    const setUp = () => {
      const textItem = createTextItem("item-1", "hello");
      const imageItem = createImageItem("item-2", [0, 0]);
      const target = createTestTargetWithItems(textItem, imageItem);
      return { ...target, textItem, imageItem } as const;
    };

    it("updates the color of the specified text item.", () => {
      const { store, actions, atoms, textItem } = setUp();
      actions.editMode.setTextColor(textItem.id, "#000");
      const items = store.get(atoms.editorItems);
      expect(items.find((item) => item.id === textItem.id)).toStrictEqual({
        ...textItem,
        color: "#000",
      });
    });

    it("keeps the very same items list on the current color, which would count as unsaved otherwise.", () => {
      const { store, actions, atoms, textItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setTextColor(textItem.id, textItem.color);
      expect(store.get(atoms.editorItems)).toBe(before);
    });

    it("keeps items unchanged when the item is not a text item.", () => {
      const { store, actions, atoms, imageItem } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setTextColor(imageItem.id, "#000");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("keeps items unchanged when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);
      actions.editMode.setTextColor("missing-id", "#000");
      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("resizeTextWidth()", () => {
    // width: 100, fontSize: 32, hence a minimum width of 128.
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

    it("sets the width from the pointer, keeping the font size and the offset.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeTextWidth(item.id, [400, 0]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toStrictEqual({
        width: 400,
        fontSize: 32,
        offset: [0, 0],
      });
    });

    it("ignores the y component of the pointer.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeTextWidth(item.id, [400, -1000]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({ width: 400 });
    });

    it("rounds a fractional width, so that it never misses the line cache.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeTextWidth(item.id, [400.4, 0]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({ width: 400 });
    });

    it("stops shrinking at the minimum width, leaving the font size alone.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeTextWidth(item.id, [-1000, 0]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({
        width: 128,
        fontSize: 32,
      });
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, an 800 screen-px target is 400 canvas units — same as the first test.
      actions.editMode.resizeTextWidth(item.id, [800, 0]);

      expect(textItemOf(store.get(atoms.editorItems), item.id)).toMatchObject({ width: 400 });
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

      actions.editMode.resizeTextWidth(imageItem.id, [408, 0]);

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.editMode.resizeTextWidth("missing-id", [408, 0])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("resizeRect()", () => {
    // width: 100, height: 50, drawn 7px larger on both axes by its line width of 4.
    const setUp = () => {
      const item = createRectItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    /**
     * @param store the test target's store
     * @param atoms the test target's atoms
     * @returns the rect item under test, after whatever was done to it
     */
    const resizedOf = (
      store: ReturnType<typeof setUp>["store"],
      atoms: ReturnType<typeof setUp>["atoms"],
    ) => store.get(atoms.editorItems).find((i) => i.id === "item-1") as EditorItem.Rect;

    it("takes the two sides independently, keeping the offset.", () => {
      const { store, actions, atoms, item } = setUp();

      // the drawn box is padded by 7, so a 207 x 107 target leaves a 200 x 100 line box.
      actions.editMode.resizeRect(item.id, [207, 107]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(200);
      expect(resized.height).toBeCloseTo(100);
      expect(resized.offset).toStrictEqual([0, 0]);
    });

    it("changes one side without disturbing the other.", () => {
      const { store, actions, atoms, item } = setUp();

      // the height component matches the item's current drawn height (50 + 7).
      actions.editMode.resizeRect(item.id, [207, 57]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(200);
      expect(resized.height).toBeCloseTo(50);
    });

    it("does not shrink either side below the minimum length.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeRect(item.id, [-1000, -1000]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(16);
      expect(resized.height).toBeCloseTo(16);
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 414,214 screen-px target is 207,107 canvas units — as in the first test.
      actions.editMode.resizeRect(item.id, [414, 214]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(200);
      expect(resized.height).toBeCloseTo(100);
    });

    it("does nothing when the item is not a rect item.", () => {
      const textItem = createTextItem("text-1", "hello");
      const { store, actions, atoms } = createTestTargetWithItems(textItem);

      actions.editMode.resizeRect(textItem.id, [207, 107]);

      expect(store.get(atoms.editorItems)).toStrictEqual([textItem]);
    });

    it("does nothing when the item does not exist.", () => {
      const { store, actions, atoms } = setUp();
      const before = store.get(atoms.editorItems);

      expect(() => actions.editMode.resizeRect("missing-id", [207, 107])).not.toThrow();

      expect(store.get(atoms.editorItems)).toStrictEqual(before);
    });
  });

  describe("resizeMosaic()", () => {
    // width: 100, height: 50, drawn at exactly that size.
    const setUp = () => {
      const item = createMosaicItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    /**
     * @param store the test target's store
     * @param atoms the test target's atoms
     * @returns the mosaic item under test, after whatever was done to it
     */
    const resizedOf = (
      store: ReturnType<typeof setUp>["store"],
      atoms: ReturnType<typeof setUp>["atoms"],
    ) => store.get(atoms.editorItems).find((i) => i.id === "item-1") as EditorItem.Mosaic;

    it("takes the two sides independently, keeping the offset.", () => {
      const { store, actions, atoms, item } = setUp();

      // unlike a rect, nothing pads the drawn box, so the pointer is the new corner as it is.
      actions.editMode.resizeMosaic(item.id, [200, 100]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(200);
      expect(resized.height).toBeCloseTo(100);
      expect(resized.offset).toStrictEqual([0, 0]);
    });

    it("does not shrink either side below the minimum length.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeMosaic(item.id, [-1000, -1000]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(16);
      expect(resized.height).toBeCloseTo(16);
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 400,200 screen-px target is 200,100 canvas units — as in the first test.
      actions.editMode.resizeMosaic(item.id, [400, 200]);

      const resized = resizedOf(store, atoms);
      expect(resized.width).toBeCloseTo(200);
      expect(resized.height).toBeCloseTo(100);
    });

    it("does nothing when the item is not a mosaic item.", () => {
      const rectItem = createRectItem("rect-1", [0, 0]);
      const { store, actions, atoms } = createTestTargetWithItems(rectItem);

      actions.editMode.resizeMosaic(rectItem.id, [200, 100]);

      expect(store.get(atoms.editorItems)).toStrictEqual([rectItem]);
    });
  });

  describe("resizeArrowTip()", () => {
    // 200 long, pointing right, its tail on the origin.
    const setUp = () => {
      const item = createArrowItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    /**
     * @param store the test target's store
     * @param atoms the test target's atoms
     * @returns the arrow item under test, after whatever was done to it
     */
    const resizedOf = (
      store: ReturnType<typeof setUp>["store"],
      atoms: ReturnType<typeof setUp>["atoms"],
    ) => store.get(atoms.editorItems).find((i) => i.id === "item-1") as EditorItem.Arrow;

    it("takes the length and the direction from where the tip is put, keeping the tail.", () => {
      const { store, actions, atoms, item } = setUp();

      // three-four-five down and to the right of the tail, hence 500 long.
      actions.editMode.resizeArrowTip(item.id, [300, 400]);

      const resized = resizedOf(store, atoms);
      expect(resized.length).toBeCloseTo(500);
      expect(resized.angle).toBeCloseTo(Math.atan2(400, 300));
      expect(resized.offset).toStrictEqual([0, 0]);
    });

    it("turns the arrow around when the tip is put behind the tail.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeArrowTip(item.id, [-300, 0]);

      const resized = resizedOf(store, atoms);
      expect(resized.length).toBeCloseTo(300);
      expect(resized.angle).toBeCloseTo(Math.PI);
    });

    it("holds the length at the minimum while still following the direction.", () => {
      const { store, actions, atoms, item } = setUp();

      actions.editMode.resizeArrowTip(item.id, [0, 1]);

      const resized = resizedOf(store, atoms);
      expect(resized.length).toBe(clampArrowLength(0));
      // the angle is taken from the pointer even where the length has stopped.
      expect(resized.angle).toBeCloseTo(Math.PI / 2);
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a 600,800 screen-px target is 300,400 canvas units — as in the first test.
      actions.editMode.resizeArrowTip(item.id, [600, 800]);

      expect(resizedOf(store, atoms).length).toBeCloseTo(500);
    });

    it("does nothing when the item is not an arrow item.", () => {
      const rectItem = createRectItem("rect-1", [0, 0]);
      const { store, actions, atoms } = createTestTargetWithItems(rectItem);

      actions.editMode.resizeArrowTip(rectItem.id, [300, 400]);

      expect(store.get(atoms.editorItems)).toStrictEqual([rectItem]);
    });
  });

  describe("resizeArrowTail()", () => {
    // 200 long, pointing right from the origin, hence its tip is at (200, 0).
    const setUp = () => {
      const item = createArrowItem("item-1", [0, 0]);
      const target = createTestTargetWithItems(item);
      return { ...target, item } as const;
    };

    const resizedOf = (
      store: ReturnType<typeof setUp>["store"],
      atoms: ReturnType<typeof setUp>["atoms"],
    ) => store.get(atoms.editorItems).find((i) => i.id === "item-1") as EditorItem.Arrow;

    it("moves the tail to where it is put, leaving the tip where it was.", () => {
      const { store, actions, atoms, item } = setUp();

      // the tail goes to (-100, 0), which leaves it 300 from the tip at (200, 0).
      actions.editMode.resizeArrowTail(item.id, [-100, 0]);

      const resized = resizedOf(store, atoms);
      expect(resized.offset[0]).toBeCloseTo(-100);
      expect(resized.offset[1]).toBeCloseTo(0);
      expect(resized.length).toBeCloseTo(300);
      expect(resized.angle).toBeCloseTo(0);
    });

    it("turns the arrow around when the tail is put past the tip.", () => {
      const { store, actions, atoms, item } = setUp();

      // the tail goes to (500, 0), which is 300 beyond the tip at (200, 0).
      actions.editMode.resizeArrowTail(item.id, [500, 0]);

      const resized = resizedOf(store, atoms);
      expect(resized.offset[0]).toBeCloseTo(500);
      expect(resized.length).toBeCloseTo(300);
      expect(resized.angle).toBeCloseTo(Math.PI);
    });

    it("holds the tip still by placing the tail back from it at the minimum length.", () => {
      const { store, actions, atoms, item } = setUp();
      const minimum = clampArrowLength(0);

      // the tail is dragged right up to the tip, closer than an arrow is allowed to be short.
      actions.editMode.resizeArrowTail(item.id, [199, 0]);

      const resized = resizedOf(store, atoms);
      expect(resized.length).toBe(minimum);
      expect(resized.angle).toBeCloseTo(0);
      // NOTE: the point of the derivation — the tail lands where the minimum puts it rather than
      //   where the pointer asked, so that the tip stays on the (200, 0) it was pointing at.
      expect(resized.offset[0]).toBeCloseTo(200 - minimum);
      expect(resized.offset[1]).toBeCloseTo(0);
    });

    it("scales the pointer position by the inverse of the view scale.", () => {
      const { store, actions, atoms, item } = setUp();
      actions.view.zoom(2, new Vec2(0, 0));

      // at 2x zoom, a -200 screen-px target is -100 canvas units — as in the first test.
      actions.editMode.resizeArrowTail(item.id, [-200, 0]);

      expect(resizedOf(store, atoms).length).toBeCloseTo(300);
    });

    it("does nothing when the item is not an arrow item.", () => {
      const rectItem = createRectItem("rect-1", [0, 0]);
      const { store, actions, atoms } = createTestTargetWithItems(rectItem);

      actions.editMode.resizeArrowTail(rectItem.id, [-100, 0]);

      expect(store.get(atoms.editorItems)).toStrictEqual([rectItem]);
    });
  });

  describe("leaving edit mode", () => {
    const blank = createTextItem("blank-item", " \n ");
    const filled = createTextItem("filled-item", "hello");

    const setUp = () => {
      const target = createTestTargetWithItems(blank, filled);
      target.actions.editMode.enter(blank.id);
      return target;
    };

    it("drops the blank target item on clearing the selection.", () => {
      const { store, actions, atoms } = setUp();
      actions.selectMode.clear();
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("drops the blank target item on selecting another item.", () => {
      const { store, actions, atoms } = setUp();
      actions.selectMode.select(filled.id);
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("drops the blank target item on entering edit mode for another item.", () => {
      const { store, actions, atoms } = setUp();
      actions.editMode.enter(filled.id);
      expect(store.get(atoms.editorItems)).toStrictEqual([filled]);
    });

    it("keeps the target item when its content is not blank.", () => {
      const { store, actions, atoms } = createTestTargetWithItems(blank, filled);
      actions.editMode.enter(filled.id);

      actions.selectMode.clear();

      // blank items other than the target one are left as they are.
      expect(store.get(atoms.editorItems)).toStrictEqual([blank, filled]);
    });

    it("keeps items as they are when the mode is not edit mode.", () => {
      const { store, actions, atoms } = createTestTargetWithItems(blank, filled);
      actions.selectMode.select(blank.id);

      actions.selectMode.clear();

      expect(store.get(atoms.editorItems)).toStrictEqual([blank, filled]);
    });
  });
});
