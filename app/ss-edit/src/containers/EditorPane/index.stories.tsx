import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, type Draft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { expect, userEvent, waitFor } from "storybook/test";
import { AppProvider } from "../../app/AppProvider";
import { INITIAL_EDITOR_STATE, type PageState, useEditorAtoms } from "../../store";
import { Point2D, type Tuple2D } from "../../utils/geometry";
import { randomId } from "../../utils/misc";
import { EditorPane } from "./index";

const meta: Meta = {
  component: EditorPane,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

/**
 * @param offset
 * @returns example line items
 */
const lineItems = (offset: Tuple2D = [0, 0]): PageState.Item.Line[] => {
  const base = [
    {
      color: "#ffffcc",
      head: [-50, 150],
      tail: [400, 550],
    },
    {
      color: "#ffff66",
      head: [0, 250],
      tail: [450, 450],
    },
    {
      color: "#ffff00",
      head: [50, 350],
      tail: [500, 350],
    },
    {
      color: "#999900",
      head: [100, 450],
      tail: [550, 250],
    },
    {
      color: "#333300",
      head: [150, 550],
      tail: [600, 150],
    },
  ] as const;
  return base
    .map((item): PageState.Item.Line => ({ ...item, kind: "line", id: randomId(), width: 5 }))
    .map((item) => {
      const head = Point2D.new(item.head).add(offset).tuple();
      const tail = Point2D.new(item.tail).add(offset).tuple();
      return { ...item, head, tail };
    });
};

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

export const LineItems = createStory({
  recipe: (draft) => {
    draft.items = castDraft(lineItems());
  },
});

export const OffsetAndScale = createStory({
  recipe: (draft) => {
    draft.view.scale = 2;
    draft.view.offset = [1200, 1300];
    draft.items = castDraft(lineItems([1000, 1000]));
  },
});

export const SelectMode = createStory({
  recipe: (draft) => {
    draft.items = castDraft(lineItems());
  },
  play: async ({ canvasElement }) => {
    const firstLine = canvasElement.querySelector("line")!;
    userEvent.click(firstLine);
    await waitFor(() => {
      expect(firstLine.closest("g")).toHaveAttribute("data-selected", "true");
    });
  },
});
