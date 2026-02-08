import { useAtomValue } from "jotai";
import React from "react";
import { editorAtoms } from "../../store/editor";

/** svg elements for mode action */
export const ModeContent = React.memo(() => {
  const mode = useAtomValue(editorAtoms.mode);
  switch (mode.kind) {
    case "select": {
      return null; // TODO: render resizer.
    }
  }
});
