import { expect, type Page, test } from "@playwright/test";
import {
  addArrowByDrag,
  arrowTailHandle,
  arrowTipHandle,
  boundingBoxOf,
  centerOf,
  dragBy,
  editArrow,
  editorPane,
  expectCenteredAt,
  expectMode,
  openApp,
  type Point,
  panePointToViewport,
  parkCursor,
  saveAsPng,
} from "./helpers";

/** an arrow dragged left to right on an arbitrary spot of the pane, 400px long. */
const MAIN_TAIL: Point = { x: 200, y: 220 };
const MAIN_TIP: Point = { x: 600, y: 220 };

/** the shortest an arrow can be made, three times the length of its own head. */
const MIN_LENGTH = 120;

/** lays a 400px arrow out and opens its editor, answering where its two ends are on screen. */
const setUp = async (page: Page): Promise<{ tail: Point; tip: Point }> => {
  await openApp(page);
  await addArrowByDrag(page, MAIN_TAIL, MAIN_TIP);
  await editArrow(page);
  return {
    tail: await panePointToViewport(page, MAIN_TAIL),
    tip: await panePointToViewport(page, MAIN_TIP),
  };
};

/** drags one of the two handles by `delta`, gripping it where it grips the item: its own centre. */
const dragHandleBy = async (page: Page, end: "tail" | "tip", delta: Point): Promise<void> => {
  const handle = end === "tail" ? arrowTailHandle(page) : arrowTipHandle(page);
  await dragBy(page, centerOf(await boundingBoxOf(handle)), delta);
};

test("turns and lengthens the arrow from its tip, leaving the tail where it is", async ({
  page,
}) => {
  const { tail, tip } = await setUp(page);

  await dragHandleBy(page, "tip", { x: -100, y: 120 });

  // a rect's handle resizes a box from its corner; an arrow has no box worth gripping, so the tip
  // simply goes where the pointer leaves it and the arrow turns to follow.
  await expectCenteredAt(arrowTipHandle(page), { x: tip.x - 100, y: tip.y + 120 });
  await expectCenteredAt(arrowTailHandle(page), tail);
});

test("moves the tail, leaving the tip where it is", async ({ page }) => {
  const { tail, tip } = await setUp(page);

  await dragHandleBy(page, "tail", { x: 60, y: -40 });

  // the end that is not being dragged is the anchor, whichever end that is — which is what lets an
  // arrow be turned about either of them.
  await expectCenteredAt(arrowTailHandle(page), { x: tail.x + 60, y: tail.y - 40 });
  await expectCenteredAt(arrowTipHandle(page), tip);
});

test("does not collapse the arrow below the minimum length", async ({ page }) => {
  const { tail, tip } = await setUp(page);

  // drag the tip all the way onto the tail, which asks for a length of zero.
  await dragHandleBy(page, "tip", { x: tail.x - tip.x, y: tail.y - tip.y });

  // the tail is the anchor, so the arrow stops at its minimum length pointing away from it. the
  // direction is +x because `Math.atan2(0, 0)` is +0, the same fallback a click without a drag has.
  await expectCenteredAt(arrowTailHandle(page), tail);
  await expectCenteredAt(arrowTipHandle(page), { x: tail.x + MIN_LENGTH, y: tail.y });
});

test("holds the tip still when the tail is dragged past the minimum length", async ({ page }) => {
  const { tip } = await setUp(page);

  // drag the tail all the way onto the tip, from the other side.
  await dragHandleBy(page, "tail", { x: MAIN_TIP.x - MAIN_TAIL.x, y: 0 });

  // NOTE: the tail is what the pointer holds, so it is the tail that stops short — the tip must
  //   not be pushed along to make room for the minimum length, which is what setting the tail
  //   outright and clamping the length separately would do.
  await expectCenteredAt(arrowTipHandle(page), tip);
  await expectCenteredAt(arrowTailHandle(page), { x: tip.x - MIN_LENGTH, y: tip.y });
});

test("keeps the resized arrow in the exported picture", async ({ page }) => {
  await setUp(page);

  await dragHandleBy(page, "tip", { x: -100, y: 120 });

  // leave edit mode by clicking an empty corner of the pane, as a user would.
  const pane = await boundingBoxOf(editorPane(page));
  await page.mouse.click(pane.x + 20, pane.y + 20);
  await expectMode(page, "select");

  await parkCursor(page);
  await expect.soft(page).toHaveScreenshot("screenshot-resized-arrow.png");
  expect.soft(await saveAsPng(page)).toMatchSnapshot("export-resized-arrow.png");
});
