import "@~/ui/style";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UnderConstruction } from "./ui/UnderConstruction";

window.addEventListener("load", () => {
  const mountDestination = document.getElementById("root");
  if (mountDestination == null) {
    console.warn(`#root element wasn't found.`);
    return; // do nothing.
  }
  const root = createRoot(mountDestination);
  root.render(
    <StrictMode>
      <UnderConstruction />
    </StrictMode>,
  );
});
