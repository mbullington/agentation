import type { ExtensionSettings } from "./types";

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  patterns: [
    { pattern: "http://localhost:*/*", enabled: true },
    { pattern: "http://127.0.0.1:*/*", enabled: true },
  ],
  endpoint: "",
  webhookUrl: "",
};
