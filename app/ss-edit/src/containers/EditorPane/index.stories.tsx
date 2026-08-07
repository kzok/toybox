import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import type { EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, type PageState, pageCtx } from "../../store";
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
  render: (_args, { loaded }) => {
    const image = loaded.image as ImageBitmap;
    const state = produce(INITIAL_EDITOR_STATE, (draft) => {
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
          content: "Hello world!",
          offset: [-image.width / 2, image.height / 2],
          width: image.width,
          fontSize: 48,
          color: "#EF3171",
        } satisfies EditorItem.Text),
      );
    });
    return renderEditor(state);
  },
};

const renderEditor = (state: PageState): React.ReactElement => {
  const Wrapper: React.FC = () => {
    const atoms = pageCtx.useAtoms();
    useHydrateAtoms([[atoms.state, state]]);
    return (
      <div
        style={{
          display: "inline-grid",
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
