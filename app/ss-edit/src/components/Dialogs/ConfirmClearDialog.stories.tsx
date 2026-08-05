import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { AppProvider } from "../../app/AppProvider";
import { ConfirmClearDialog } from "./ConfirmClearDialog";

const meta: Meta<typeof ConfirmClearDialog> = {
  component: ConfirmClearDialog,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    resolve: fn(),
  },
  render: (args) => (
    <AppProvider>
      <ConfirmClearDialog {...args} />
    </AppProvider>
  ),
};

export default meta;

export const Default: StoryObj<typeof meta> = {};
