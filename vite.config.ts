import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

/**
 * Injects the markup shared by every application into their `index.html`.
 *
 * The snippets live in `config/html/` as plain files rather than as a template
 * language, which keeps them under biome and leaves each `index.html` valid HTML.
 * The price is that the injection is invisible from `index.html` itself, so every
 * application marks the spot with a comment.
 *
 * Note that the snippets are read once when this config loads: editing one while
 * the dev server runs takes a restart to show up.
 */
const sharedHead = (): Plugin => {
  const gtag = readFileSync(resolve(import.meta.dirname, "config/html/gtag.js"), "utf8");
  return {
    name: "shared-head",
    transformIndexHtml: {
      // before vite injects the bundle's own tags, so the tag runs first.
      order: "pre",
      handler: () => [{ tag: "script", children: gtag, injectTo: "head" }],
    },
  };
};

/**
 * shared vite config
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react(), sharedHead()],
  build: {
    assetsInlineLimit: 0,
  },
});
