import "@~/ui/style";
import { createRoot } from "react-dom/client";
import { App } from "./app";

window.addEventListener("load", async () => {
  // wait for self-hosted custom fonts.
  await document.fonts.ready;
  const mountDestination = document.getElementById("root");
  if (mountDestination == null) {
    console.error(`#root element wasn't found.`);
    return; // do nothing.
  }
  const root = createRoot(mountDestination);
  root.render(<App />);
});
