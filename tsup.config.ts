import { defineConfig } from "tsup";
import { copyFileSync } from "fs";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "motion"],
  treeshake: true,
  onSuccess: async () => {
    // Copy styles.css to dist
    copyFileSync("src/styles.css", "dist/styles.css");
    console.log("✓ Copied styles.css to dist/");
  },
});
