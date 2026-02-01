import type { Meta, StoryObj } from "@storybook/react";
import { AppProvider } from "../../store/AppProvider";
import { CanvasPane } from "./index";

const meta: Meta = {
  component: CanvasPane,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const Wrapper: React.FC<{ children: React.ReactNode }> = (props) => (
  <AppProvider>
    <div
      style={{
        display: "inline-grid",
        width: 500,
        height: 500,
        alignItems: "stretch",
        justifyItems: "stretch",
      }}
    >
      {props.children}
    </div>
  </AppProvider>
);

export const Empty: StoryObj = {
  render: () => (
    <Wrapper>
      <CanvasPane />
    </Wrapper>
  ),
};
