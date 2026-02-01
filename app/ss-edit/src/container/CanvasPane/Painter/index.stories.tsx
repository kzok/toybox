import type { Meta, StoryObj } from "@storybook/react";
import { type Draft, produce } from "immer";
import type { EditorState } from "../../../store/editor";
import { Painter } from "./index";

const meta: Meta = {
  component: Painter,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const emptyEditorState: EditorState = {
  items: [],
};

type TargetProps = React.ComponentProps<typeof Painter>;

const createStory = ({
  storyName,
  recipe,
}: Readonly<{
  storyName?: string;
  recipe?: (draft: Draft<TargetProps>) => void;
}>): StoryObj<typeof meta> => {
  let props: TargetProps = { width: 500, height: 500, editorState: emptyEditorState };
  if (recipe) {
    props = produce(props, (draft) => {
      recipe(draft);
    });
  }
  const result: StoryObj<typeof meta> = {
    render: () => <Painter {...props} />,
  };
  if (storyName) {
    result.storyName = storyName;
  }
  return result;
};

export const Empty = createStory({});

export const Lines = createStory({
  recipe: (draft) => {
    draft.editorState.items = [
      {
        kind: "line",
        color: "#ffffcc",
        width: 5,
        head: { x: -50, y: 150 },
        tail: { x: 400, y: 550 },
      },
      {
        kind: "line",
        color: "#ffff66",
        width: 5,
        head: { x: 0, y: 250 },
        tail: { x: 450, y: 450 },
      },
      {
        kind: "line",
        color: "#ffff00",
        width: 5,
        head: { x: 50, y: 350 },
        tail: { x: 500, y: 350 },
      },
      {
        kind: "line",
        color: "#999900",
        width: 5,
        head: { x: 100, y: 450 },
        tail: { x: 550, y: 250 },
      },
      {
        kind: "line",
        color: "#333300",
        width: 5,
        head: { x: 150, y: 550 },
        tail: { x: 600, y: 150 },
      },
    ];
  },
});
