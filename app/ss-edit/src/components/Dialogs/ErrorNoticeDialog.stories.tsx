import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import { AppProvider } from "../../app/AppProvider";
import { ErrorNoticeDialog } from "./ErrorNoticeDialog";

/**
 * A real `Error` captures the stack trace of the running bundle, whose file names and
 * line numbers change on every build and make visual snapshots unstable.
 * Overwrite it with a fixed one so the story renders deterministically.
 *
 * @param message error message
 * @returns an `Error` with a stable stack trace
 */
const stableError = (message: string): Error => {
  const error = new Error(message);
  error.stack = [
    `Error: ${message}`,
    "    at readDroppedFile (fileLoader.ts:42:11)",
    "    at handleDrop (DropArea.tsx:18:5)",
  ].join("\n");
  return error;
};

const meta: Meta<typeof ErrorNoticeDialog> = {
  component: ErrorNoticeDialog,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    error: stableError("Failed to read the dropped file."),
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
    error: stableError(
      `Failed to load the image: ${"unsupported-format-".repeat(20)}.bin is not a supported image file.`,
    ),
  },
};

export const NonErrorValue: StoryObj<typeof meta> = {
  args: {
    error: { code: 42, path: "a.png" },
  },
};
