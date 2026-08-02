import { useAtomValue } from "jotai";
import { type PageActions, type PageAtoms, useContextValue } from "./context";

export const usePageAtoms = (): PageAtoms => useContextValue().atoms;
export const usePageActions = (): PageActions => useContextValue().actions;

export const useEditorMode = () => useAtomValue(usePageAtoms().editorMode);
export const useEditorView = () => useAtomValue(usePageAtoms().editorView);
export const useEditorItems = () => useAtomValue(usePageAtoms().editorItems);
export const useDialogReactNode = () => useAtomValue(usePageAtoms().dialogReactNode);
export const useCanvasOffset = () => useAtomValue(usePageAtoms().canvasOffset);
export const useEntirePictureRect = () => useAtomValue(usePageAtoms().entirePictureRect);
export const useCanSave = () => useAtomValue(usePageAtoms().canSave);
export const useNeedConfirmBeforeUnload = () =>
  useAtomValue(usePageAtoms().needConfirmBeforeUnload);
