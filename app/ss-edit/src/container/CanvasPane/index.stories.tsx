import type { Meta, StoryObj } from "@storybook/react";
import { CanvasPane } from "./index";
import type { EditorState } from "./types";

const meta: Meta = {
  component: CanvasPane,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const emptyEditorState: EditorState = {
  items: [],
};

export const Empty: StoryObj<typeof meta> = {
  render: () => <CanvasPane width={500} height={500} editorState={emptyEditorState} />,
};
