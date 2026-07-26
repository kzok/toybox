import { useAtomValue } from "jotai";
import { useEditorAtoms } from "./context";

const useEditorMode = () => useAtomValue(useEditorAtoms().mode);
const useEditorView = () => useAtomValue(useEditorAtoms().view);
const useEditorItems = () => useAtomValue(useEditorAtoms().items);

export const selectors = {
  useEditorMode,
  useEditorView,
  useEditorItems,
} as const;
