import type { Meta, StoryObj } from "@storybook/react";
import { type Draft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import { INITIAL_EDITOR_STATE, type PageState, useEditorAtoms } from "../../store";
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
  play,
}: Readonly<{
  storyName?: string;
  recipe?: (draft: Draft<PageState>) => void;
  play?: StoryObj<typeof meta>["play"];
}>): StoryObj<typeof meta> => {
  let state: PageState = INITIAL_EDITOR_STATE;
  if (recipe) {
    state = produce(state, (draft) => {
      recipe(draft);
    });
  }
  const Wrapper: React.FC = () => {
    const atoms = useEditorAtoms();
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
  if (play) {
    result.play = play;
  }
  return result;
};

export const Empty = createStory({});
