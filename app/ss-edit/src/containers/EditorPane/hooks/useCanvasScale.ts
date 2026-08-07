import { atom, useAtomValue } from "jotai";
import React from "react";
import { pageCtx } from "../../../store";

/**
 * @returns scale multiplier of the editor canvas
 */
export const useCanvasScale = (): number => {
  const atoms = pageCtx.useAtoms();
  return useAtomValue(React.useMemo(() => atom((get) => get(atoms.editorView).scale), [atoms]));
};
