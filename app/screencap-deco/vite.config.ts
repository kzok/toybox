import { defineConfig, mergeConfig } from "vite";
import sharedConfig from "../../vite.config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    base: "./",
  }),
);
