import type { Preview } from "@storybook/react-vite";
import "./preview.css";
// TODO: move this style to a shared module.
import "../app/ss-edit/src/utils/styles/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
