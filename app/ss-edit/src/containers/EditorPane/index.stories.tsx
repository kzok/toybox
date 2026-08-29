import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import { clampArrowLength, type EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, type PageState, pageCtx } from "../../store";
import { Vec2 } from "../../utils/geometry";
import testImage350x240 from "./fixtures/350x240.png";
import { EditorPane } from "./index";

const meta: Meta = {
  component: EditorPane,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Empty: StoryObj<typeof meta> = {
  render: () => renderEditor(INITIAL_EDITOR_STATE),
};

export const Example: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) => renderEditor(exampleState(loaded.image as ImageBitmap)),
};

export const Editing: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(exampleState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = { kind: "edit", itemId: "story-text" };
      }),
    ),
};

export const Rects: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) => renderEditor(rectsState(loaded.image as ImageBitmap)),
};

/**
 * the thick rect selected, the thin one left alone so that the two read side by side.
 * @note the whole box is tinted, the middle of the rect included: that is the hit area as well,
 *   so what the tint covers is exactly what a click on it would take.
 */
export const RectSelected: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(rectsState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = castDraft({
          kind: "select",
          selectedIds: ["story-rect-thick"],
        } satisfies PageState.Mode.Select);
      }),
    ),
};

/**
 * the thick rect being edited, which is the only way to resize one.
 * @note deliberately unlike `RectSelected`: edit mode leaves the middle unpainted, so that
 *   whatever the rect is drawn around stays visible while it is being resized.
 */
export const RectEditing: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(rectsState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = { kind: "edit", itemId: "story-rect-thick" };
      }),
    ),
};

export const Arrows: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) => renderEditor(arrowsState(loaded.image as ImageBitmap)),
};

/**
 * one diagonal arrow of the fan selected, the rest left alone so that the two read side by side.
 * @note the tint is the hit area, and is a band along the arrow rather than the box it spans:
 *   deliberately unlike `RectSelected`, where the whole box takes the pointer. the box of a
 *   diagonal arrow is mostly empty, and taking all of it would put whatever sits in those corners
 *   out of reach — here the arrows either side of it stay clickable.
 */
export const ArrowSelected: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(arrowsState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = castDraft({
          kind: "select",
          selectedIds: ["story-arrow-1"],
        } satisfies PageState.Mode.Select);
      }),
    ),
};

/**
 * one diagonal arrow of the fan being edited, which is the only way to change its length or
 * direction.
 * @note deliberately unlike `ArrowSelected`: the band is outlined rather than tinted, so that the
 *   arrow it is being dragged around stays visible, and it carries a handle on each end.
 */
export const ArrowEditing: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(arrowsState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = { kind: "edit", itemId: "story-arrow-1" };
      }),
    ),
};

export const AddingItem: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(exampleState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = castDraft({
          kind: "add-item",
          itemKind: "text",
          range: [new Vec2(-100, 0), new Vec2(100, 48)],
        } satisfies PageState.Mode.AddItem);
      }),
    ),
};

/**
 * @param image image item data
 * @returns a state with an image item and a text item on it
 */
const exampleState = (image: ImageBitmap): PageState =>
  produce(INITIAL_EDITOR_STATE, (draft) => {
    draft.editorItems.push(
      castDraft({
        kind: "image",
        id: "story-image",
        data: image,
        offset: [-image.width / 2, -image.height / 2],
        width: image.width,
        height: image.height,
      } satisfies EditorItem.Image),
    );
    draft.editorItems.push(
      castDraft({
        kind: "text",
        id: "story-text",
        // NOTE: long enough to check both an explicit line break and auto wrapping.
        content: "Hello world!\nこんにちは、世界！これは折り返しを確認するための長いテキストです。",
        offset: [-image.width / 2, -image.height / 2],
        width: image.width,
        fontSize: 32,
        color: "#EF3171",
      } satisfies EditorItem.Text),
    );
  });

/**
 * @param image image item data
 * @returns `exampleState` with two rect items laid over it
 * @note a thin one laid fully on the screenshot and a thick one hanging off its bottom right
 *   corner, so that the outline and the shadow can be read against the screenshot and against the
 *   transparent plane alike.
 */
const rectsState = (image: ImageBitmap): PageState =>
  produce(exampleState(image), (draft) => {
    draft.editorItems.push(
      castDraft({
        kind: "rect",
        id: "story-rect-thin",
        offset: [-140, 10],
        width: 120,
        height: 70,
        color: "#EF3171",
        lineWidth: 2,
      } satisfies EditorItem.Rect),
      castDraft({
        kind: "rect",
        id: "story-rect-thick",
        offset: [20, 60],
        width: 200,
        height: 140,
        color: "#EF3171",
        lineWidth: 6,
      } satisfies EditorItem.Rect),
    );
  });

/** how many arrows the fan below is made of */
const ARROW_FAN_COUNT = 8;

/**
 * @param image image item data
 * @returns `exampleState` with arrows laid over it
 * @note a fan radiating from one point, so that every angle is read against the same origin and a
 *   rotation that is off shows up as a fan that is not even. some of it hangs off the screenshot,
 *   so that the outline and the shadow can be read against the transparent plane as well. the fan
 *   is drawn at the shortest length `clampArrowLength` allows, which is where the head is closest
 *   to swallowing the shaft.
 * @note plus one long arrow, which is where the taper has the room to be read.
 */
const arrowsState = (image: ImageBitmap): PageState =>
  produce(exampleState(image), (draft) => {
    for (let i = 0; i < ARROW_FAN_COUNT; i++) {
      draft.editorItems.push(
        castDraft({
          kind: "arrow",
          id: `story-arrow-${i}`,
          offset: [0, 0],
          length: clampArrowLength(0),
          angle: ((Math.PI * 2) / ARROW_FAN_COUNT) * i,
          color: "#EF3171",
        } satisfies EditorItem.Arrow),
      );
    }
    draft.editorItems.push(
      castDraft({
        kind: "arrow",
        id: "story-arrow-long",
        offset: [-180, -160],
        length: 350,
        angle: 0,
        color: "#EF3171",
      } satisfies EditorItem.Arrow),
    );
  });

const renderEditor = (state: PageState): React.ReactElement => {
  const Wrapper: React.FC = () => {
    const atoms = pageCtx.useAtoms();
    useHydrateAtoms([[atoms.state, state]]);
    return (
      <div
        style={{
          display: "grid",
          width: 500,
          height: 500,
          alignItems: "stretch",
          justifyItems: "stretch",
        }}
      >
        <EditorPane />
      </div>
    );
  };
  return (
    <AppProvider>
      <Wrapper />
    </AppProvider>
  );
};

/**
 * decodes an image asset URL into an `ImageBitmap` for use as item data.
 * @param src image asset URL
 */
const loadImageBitmap = (src: string): Promise<ImageBitmap> =>
  fetch(src)
    .then((res) => res.blob())
    .then((blob) => createImageBitmap(blob));
