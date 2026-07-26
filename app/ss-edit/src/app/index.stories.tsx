import type { Meta, StoryObj } from "@storybook/react";
import { App } from "./index";

const meta: Meta = {
  component: App,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const InitialState: StoryObj = {
  render: () => <App />,
};
