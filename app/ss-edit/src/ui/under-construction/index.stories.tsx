import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen } from "storybook/test";
import { UnderConstruction } from "./index";

const meta: Meta = {
  component: UnderConstruction,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Basic: StoryObj<typeof meta> = {
  render: () => <UnderConstruction />,
  play: async () => {
    expect(await screen.findByText("🚧 Under construction 🚧")).toBeInTheDocument();
  },
};
