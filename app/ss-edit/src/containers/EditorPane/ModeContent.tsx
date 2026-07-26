import React from "react";
import { selectors } from "../../store";

/** svg elements for mode action */
export const ModeContent = React.memo(() => {
  const mode = selectors.useEditorMode();
  switch (mode.kind) {
    case "select": {
      return null; // TODO: render resizer.
    }
  }
});
