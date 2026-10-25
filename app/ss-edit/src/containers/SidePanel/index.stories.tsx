import type { Meta, StoryObj } from "@storybook/react";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import { INITIAL_EDITOR_STATE, type PageState, pageCtx } from "../../store";
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

/** @param editorMode the mode whose button shows as checked */
const renderPanel = (editorMode: PageState.Mode): React.ReactElement => {
  const Wrapper: React.FC = () => {
    const atoms = pageCtx.useAtoms();
    useHydrateAtoms([[atoms.state, { ...INITIAL_EDITOR_STATE, editorMode }]]);
    return (
      <div style={{ display: "grid", width: 240, height: 400 }}>
        <SidePanel />
      </div>
    );
  };
  return (
    <AppProvider>
      <Wrapper />
    </AppProvider>
  );
};
