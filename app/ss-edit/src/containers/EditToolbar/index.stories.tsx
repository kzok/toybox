import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import type { EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, pageCtx } from "../../store";
import { EditToolbar, TextEditorProvider } from "./index";

const meta: Meta = {
  component: EditToolbar,
};

export default meta;

export const EditingText: StoryObj<typeof meta> = {
  render: () =>
    renderToolbar({
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
    renderToolbar({
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
    renderToolbar({
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
    renderToolbar({
      kind: "arrow",
      id: "story-arrow",
      offset: [0, 0],
      length: 200,
      angle: 0,
      color: "#EF3171",
    }),
};

/** @param item the item under edit */
const renderToolbar = (item: EditorItem): React.ReactElement => {
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
    // NOTE: the toolbar is positioned against the nearest positioned ancestor.
    return (
      <div style={{ position: "relative", width: 300, height: 80 }}>
        <EditToolbar />
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
