import path from "node:path";
import { defineConfig, mergeConfig } from "vite";
import config from "./vite.config";
export default mergeConfig(
  config,
  defineConfig({
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
    },
  })
);
