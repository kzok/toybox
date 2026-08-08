import { useAtomValue } from "jotai";
import { type PageActions, type PageAtoms, useContextValue } from "./context";

export const useAtoms = (): PageAtoms => useContextValue().atoms;
export const useActions = (): PageActions => useContextValue().actions;

export const useEditorMode = () => useAtomValue(useAtoms().editorMode);
export const useEditorView = () => useAtomValue(useAtoms().editorView);
export const useEditorItems = () => useAtomValue(useAtoms().editorItems);
export const useDialogReactNode = () => useAtomValue(useAtoms().dialogReactNode);
export const useCanvasOffset = () => useAtomValue(useAtoms().canvasOffset);
export const useEditorPictureRect = () => useAtomValue(useAtoms().editorPictureRect);
export const useCanSave = () => useAtomValue(useAtoms().canSave);
export const useNeedConfirmBeforeUnload = () => useAtomValue(useAtoms().needConfirmBeforeUnload);
