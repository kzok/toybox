import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { AppProvider } from "../../app/AppProvider";
import { SaveImageDialog } from "./SaveImageDialog";

const meta: Meta<typeof SaveImageDialog> = {
  component: SaveImageDialog,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    save: fn(),
    close: fn(),
  },
  render: (args) => (
    <AppProvider>
      <SaveImageDialog {...args} />
    </AppProvider>
  ),
};

export default meta;

export const Default: StoryObj<typeof meta> = {};
