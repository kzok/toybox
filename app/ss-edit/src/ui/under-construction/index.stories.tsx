import type { Meta, StoryFn } from "@storybook/react";
import { UnderConstruction } from "./index";

const meta: Meta = {
  component: UnderConstruction,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Basic: StoryFn = () => <UnderConstruction />;
