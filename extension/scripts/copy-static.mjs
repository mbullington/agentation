import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

// Ensure dist exists
mkdirSync(dist, { recursive: true });

// Copy manifest.json
cpSync(resolve(root, "static/manifest.json"), resolve(dist, "manifest.json"));

// Copy icons
cpSync(resolve(root, "static/icons"), resolve(dist, "icons"), { recursive: true });

// Copy popup HTML
cpSync(resolve(root, "src/popup/index.html"), resolve(dist, "popup/index.html"));

console.log("Static files copied to dist/");
