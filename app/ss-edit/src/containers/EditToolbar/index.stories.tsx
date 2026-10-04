import type { Meta, StoryObj } from "@storybook/react";
import { castDraft, produce } from "immer";
import { useHydrateAtoms } from "jotai/utils";
import { AppProvider } from "../../app/AppProvider";
import type { EditorItem } from "../../features/editorItem";
import { INITIAL_EDITOR_STATE, pageCtx } from "../../store";
import { EditToolbar } from "./index";

const meta: Meta = {
  component: EditToolbar,
};

export default meta;

const TEXT_ITEM: EditorItem.Text = {
  kind: "text",
  id: "story-text",
  content: "Hello",
  offset: [0, 0],
  width: 200,
  fontSize: 32,
  color: "#EF3171",
};

export const EditingText: StoryObj<typeof meta> = {
  render: () => {
    const Wrapper: React.FC = () => {
      const atoms = pageCtx.useAtoms();
      useHydrateAtoms([
        [
          atoms.state,
          produce(INITIAL_EDITOR_STATE, (draft) => {
            draft.editorItems.push(castDraft(TEXT_ITEM));
            draft.editorMode = { kind: "edit", itemId: TEXT_ITEM.id };
          }),
        ],
      ]);
      // NOTE: the toolbar is positioned against the nearest positioned ancestor.
      return (
        <div style={{ position: "relative", width: 300, height: 80 }}>
          <EditToolbar />
        </div>
      );
    };
    return (
      <AppProvider>
        <Wrapper />
      </AppProvider>
    );
  },
};
