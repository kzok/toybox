import { useAtomValue } from "jotai";
import { usePageAtoms } from "./context";

export const useEditorMode = () => useAtomValue(usePageAtoms().editorMode);
export const useEditorView = () => useAtomValue(usePageAtoms().editorView);
export const useEditorItems = () => useAtomValue(usePageAtoms().editorItems);
