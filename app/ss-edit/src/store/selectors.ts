import { useAtomValue } from "jotai";
import { useEditorAtoms } from "./context";

const useEditorMode = () => useAtomValue(useEditorAtoms().editorMode);
const useEditorView = () => useAtomValue(useEditorAtoms().editorView);
const useEditorItems = () => useAtomValue(useEditorAtoms().editorItems);

export const selectors = {
  useEditorMode,
  useEditorView,
  useEditorItems,
} as const;
