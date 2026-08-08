import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import type { EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, type PageState, pageCtx } from "../../store";
import { Point2D } from "../../utils/geometry";
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

export const AddingItem: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await loadImageBitmap(testImage350x240) })],
  render: (_args, { loaded }) =>
    renderEditor(
      produce(exampleState(loaded.image as ImageBitmap), (draft) => {
        draft.editorMode = castDraft({
          kind: "add-item",
          itemKind: "text",
          range: [new Point2D(-100, 0), new Point2D(100, 48)],
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
