import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { AppProvider } from "../../app/AppProvider";
import { ErrorNoticeDialog } from "./ErrorNoticeDialog";

const meta: Meta<typeof ErrorNoticeDialog> = {
  component: ErrorNoticeDialog,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    error: new Error("Failed to read the dropped file."),
    resolve: fn(),
  },
  render: (args) => (
    <AppProvider>
      <ErrorNoticeDialog {...args} />
    </AppProvider>
  ),
};

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const LongMessage: StoryObj<typeof meta> = {
  args: {
    error: new Error(
      `Failed to load the image: ${"unsupported-format-".repeat(20)}.bin is not a supported image file.`,
    ),
  },
};

export const NonErrorValue: StoryObj<typeof meta> = {
  args: {
    error: { code: 42, path: "a.png" },
  },
};
