import type { Meta, StoryObj } from "@storybook/react";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import type { EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, type PageState, pageCtx } from "../../store";
import { TextEditorProvider } from "../ItemStyle";
import { SidePanel } from "./index";

const meta: Meta = {
  component: SidePanel,
};

export default meta;

export const SelectMode: StoryObj<typeof meta> = {
  render: () => renderPanel({ kind: "select", selectedIds: [] }),
};

export const AddItemMode: StoryObj<typeof meta> = {
  render: () => renderPanel({ kind: "add-item", itemKind: "rect", range: null }),
};

const EDITED_RECT: EditorItem.Rect = {
  kind: "rect",
  id: "story-rect",
  offset: [0, 0],
  width: 200,
  height: 100,
  color: "#EF3171",
  lineWidth: 4,
};

export const EditMode: StoryObj<typeof meta> = {
  render: () => renderPanel({ kind: "edit", itemId: EDITED_RECT.id }, [EDITED_RECT]),
};

/**
 * @param editorMode the mode whose content the panel shows
 * @param editorItems the items that the mode refers to
 */
const renderPanel = (
  editorMode: PageState.Mode,
  editorItems: readonly EditorItem[] = [],
): React.ReactElement => {
  const Wrapper: React.FC = () => {
    const atoms = pageCtx.useAtoms();
    useHydrateAtoms([[atoms.state, { ...INITIAL_EDITOR_STATE, editorMode, editorItems }]]);
    return (
      <div style={{ display: "grid", width: 240, height: 400 }}>
        <SidePanel />
      </div>
    );
  };
  return (
    <AppProvider>
      <TextEditorProvider>
        <Wrapper />
      </TextEditorProvider>
    </AppProvider>
  );
};
