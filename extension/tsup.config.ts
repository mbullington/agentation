import { defineConfig } from "tsup";

const env = {
  "process.env.NODE_ENV": JSON.stringify("production"),
};

export default defineConfig([
  // Content script (MAIN world) - bundles React + agentation
  {
    entry: { "content/index": "src/content/index.tsx" },
    format: ["iife"],
    splitting: false,
    sourcemap: false,
    clean: true,
    noExternal: [/.*/],
    define: env,
    outExtension: () => ({ js: ".js" }),
  },
  // Bridge script (ISOLATED world) - tiny, no deps
  {
    entry: { "content/bridge": "src/content/bridge.ts" },
    format: ["iife"],
    splitting: false,
    sourcemap: false,
    noExternal: [/.*/],
    outExtension: () => ({ js: ".js" }),
  },
  // Popup
  {
    entry: { "popup/index": "src/popup/index.tsx" },
    format: ["iife"],
    splitting: false,
    sourcemap: false,
    noExternal: [/.*/],
    define: env,
    outExtension: () => ({ js: ".js" }),
  },
  // Service worker (ESM for MV3 module service worker)
  {
    entry: { "background/service-worker": "src/background/service-worker.ts" },
    format: ["esm"],
    splitting: false,
    sourcemap: false,
    noExternal: [/.*/],
    outExtension: () => ({ js: ".js" }),
  },
]);
