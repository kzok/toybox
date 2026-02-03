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

export const Example1 = createStory({
  recipe: (draft) => {
    draft.view.offset = [-100, -100];
    draft.items = [
      {
        kind: "line",
        color: "#ffff00",
        width: 5,
        head: [50, 50],
        tail: [450, 450],
      },
    ];
  },
});
