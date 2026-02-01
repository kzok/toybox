import type { Meta, StoryObj } from "@storybook/react";
import { type Draft, produce } from "immer";
import { type Editor, INITIAL_EDITOR_STATE } from "../../../store/editor";
import { Painter } from "./index";

const meta: Meta = {
  component: Painter,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const emptyEditorState: Editor.State = produce(INITIAL_EDITOR_STATE, (draft) => {
  draft.view.canvas = { width: 500, height: 500 };
});

type TargetProps = React.ComponentProps<typeof Painter>;

const createStory = ({
  storyName,
  recipe,
}: Readonly<{
  storyName?: string;
  recipe?: (draft: Draft<TargetProps>) => void;
}>): StoryObj<typeof meta> => {
  let props: TargetProps = { state: emptyEditorState };
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
    draft.state.items = [
      {
        kind: "line",
        color: "#ffffcc",
        width: 5,
        head: [-50, 150],
        tail: [400, 550],
      },
      {
        kind: "line",
        color: "#ffff66",
        width: 5,
        head: [0, 250],
        tail: [450, 450],
      },
      {
        kind: "line",
        color: "#ffff00",
        width: 5,
        head: [50, 350],
        tail: [500, 350],
      },
      {
        kind: "line",
        color: "#999900",
        width: 5,
        head: [100, 450],
        tail: [550, 250],
      },
      {
        kind: "line",
        color: "#333300",
        width: 5,
        head: [150, 550],
        tail: [600, 150],
      },
    ];
  },
});
