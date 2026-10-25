import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import type { EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, pageCtx } from "../../store";
import { ItemStyle, TextEditorProvider } from "./index";

const meta: Meta = {
  component: ItemStyle,
};

export default meta;

export const EditingText: StoryObj<typeof meta> = {
  render: () =>
    renderItemStyle({
      kind: "text",
      id: "story-text",
      content: "Hello",
      offset: [0, 0],
      width: 200,
      fontSize: 32,
      color: "#EF3171",
    }),
};

export const EditingRect: StoryObj<typeof meta> = {
  render: () =>
    renderItemStyle({
      kind: "rect",
      id: "story-rect",
      offset: [0, 0],
      width: 200,
      height: 100,
      color: "#EF3171",
      lineWidth: 4,
    }),
};

export const EditingMosaic: StoryObj<typeof meta> = {
  render: () =>
    renderItemStyle({
      kind: "mosaic",
      id: "story-mosaic",
      offset: [0, 0],
      width: 200,
      height: 100,
      blockSize: 8,
    }),
};

export const EditingArrow: StoryObj<typeof meta> = {
  render: () =>
    renderItemStyle({
      kind: "arrow",
      id: "story-arrow",
      offset: [0, 0],
      length: 200,
      angle: 0,
      color: "#EF3171",
    }),
};

export const EditingImage: StoryObj<typeof meta> = {
  loaders: [async () => ({ image: await createImageBitmap(new ImageData(1, 1)) })],
  render: (_args, { loaded }) =>
    renderItemStyle({
      kind: "image",
      id: "story-image",
      data: loaded.image as ImageBitmap,
      offset: [0, 0],
      width: 1,
      height: 1,
    }),
};

/** @param item the item under edit */
const renderItemStyle = (item: EditorItem): React.ReactElement => {
  const Wrapper: React.FC = () => {
    const atoms = pageCtx.useAtoms();
    useHydrateAtoms([
      [
        atoms.state,
        produce(INITIAL_EDITOR_STATE, (draft) => {
          draft.editorItems.push(castDraft(item));
          draft.editorMode = { kind: "edit", itemId: item.id };
        }),
      ],
    ]);
    return (
      <div style={{ width: 240, padding: 8 }}>
        <ItemStyle />
      </div>
    );
  };
  return (
    <AppProvider>
      <TextEditorProvider>
        <Wrapper />
      </TextEditorProvider>
    </AppProvider>
  );
};
