import type { Meta, StoryObj } from "@storybook/react";
import { type Draft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../store/AppProvider";
import { type EditorState, editorAtoms, INITIAL_EDITOR_STATE } from "../../store/editor";
import { EditorPane } from "./index";

const meta: Meta = {
  component: EditorPane,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const createStory = ({
  storyName,
  recipe,
}: Readonly<{
  storyName?: string;
  recipe?: (draft: Draft<EditorState>) => void;
}>): StoryObj<typeof meta> => {
  let state: EditorState = INITIAL_EDITOR_STATE;
  if (recipe) {
    state = produce(state, (draft) => {
      recipe(draft);
    });
  }
  const Wrapper: React.FC = () => {
    useHydrateAtoms([[editorAtoms.state, state]]);
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
  const result: StoryObj<typeof meta> = {
    render: () => (
      <AppProvider>
        <Wrapper />
      </AppProvider>
    ),
  };
  if (storyName) {
    result.storyName = storyName;
  }
  return result;
};

export const Empty = createStory({});

export const LineItems = createStory({
  recipe: (draft) => {
    draft.items = [
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

export const OffsetAndScale = createStory({
  recipe: (draft) => {
    draft.view.scale = 2;
    draft.view.offset = [1200, 1300];
    draft.items = [
      {
        kind: "line",
        color: "#ffffcc",
        width: 5,
        head: [950, 1150],
        tail: [1400, 1550],
      },
      {
        kind: "line",
        color: "#ffff66",
        width: 5,
        head: [1000, 1250],
        tail: [1450, 1450],
      },
      {
        kind: "line",
        color: "#ffff00",
        width: 5,
        head: [1150, 1350],
        tail: [1500, 1350],
      },
      {
        kind: "line",
        color: "#999900",
        width: 5,
        head: [1100, 1450],
        tail: [1550, 1250],
      },
      {
        kind: "line",
        color: "#333300",
        width: 5,
        head: [1150, 1550],
        tail: [1600, 1150],
      },
    ];
  },
});
