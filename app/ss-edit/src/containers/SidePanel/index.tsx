import { ToggleButton, Toolbar, ToolbarButton, ToolbarDivider } from "@fluentui/react-components";
import {
  ArrowUpRightRegular,
  BlurRegular,
  CursorRegular,
  ImageAddRegular,
  RectangleLandscapeRegular,
  TextTRegular,
} from "@fluentui/react-icons";
import clsx from "clsx";
import React from "react";
import type { AddableItemKind } from "../../features/editorItem";
import { type PageState, pageCtx } from "../../store";
import styles from "./index.module.css";

type Tool = "select" | AddableItemKind;

const TOOLS = [
  { value: "text", label: "Add text", icon: <TextTRegular /> },
  { value: "rect", label: "Add rectangle", icon: <RectangleLandscapeRegular /> },
  { value: "arrow", label: "Add arrow", icon: <ArrowUpRightRegular /> },
  { value: "mosaic", label: "Add mosaic", icon: <BlurRegular /> },
] as const satisfies readonly Readonly<{
  value: AddableItemKind;
  label: string;
  icon: React.ReactElement;
}>[];

/** a side panel on the left of the editor pane */
export const SidePanel = React.memo<{
  className?: string | undefined;
}>((props) => {
  const actions = pageCtx.useActions();
  const editorMode = pageCtx.useEditorMode();
  const currentTool = toolOf(editorMode);

  return (
    <div className={clsx(props.className, styles.container)}>
      <Toolbar className={styles.toolbar} aria-label="Tools" vertical>
        <ToggleButton
          className={styles.button}
          appearance="subtle"
          icon={<CursorRegular />}
          checked={currentTool === "select"}
          onClick={() => {
            if (editorMode.kind !== "select") {
              actions.selectMode.clear();
            }
          }}
        >
          Select
        </ToggleButton>
        <ToolbarDivider />
        {TOOLS.map(({ value, label, icon }) => (
          <ToggleButton
            key={value}
            className={styles.button}
            appearance="subtle"
            icon={icon}
            checked={value === currentTool}
            onClick={() => actions.addItemMode.enter(value)}
          >
            {label}
          </ToggleButton>
        ))}
        <ToolbarDivider />
        <ToolbarButton
          className={styles.button}
          icon={<ImageAddRegular />}
          onClick={() => actions.picture.addFromFilePicker()}
        >
          Add image
        </ToolbarButton>
      </Toolbar>
    </div>
  );
});

/** @returns the tool whose button shows the given mode */
const toolOf = (editorMode: PageState.Mode): Tool | null => {
  switch (editorMode.kind) {
    case "select":
      return "select";
    case "add-item":
      return editorMode.itemKind;
    case "edit":
      return null;
    default:
      editorMode satisfies never;
      throw new Error(`unknown editorMode: ${JSON.stringify(editorMode)}`);
  }
};
