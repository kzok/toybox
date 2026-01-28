import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * shared vite config
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react()],
});
