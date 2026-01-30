import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * shared vite config
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react()],
});
