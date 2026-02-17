export interface UrlPattern {
  pattern: string;
  enabled: boolean;
}

export interface ExtensionSettings {
  enabled: boolean;
  patterns: UrlPattern[];
  endpoint: string;
  webhookUrl: string;
}

/** Event dispatched from bridge (ISOLATED) to content (MAIN). */
export const SETTINGS_EVENT = "agentation-extension-settings";

/** Event dispatched from content (MAIN) to request settings from bridge. */
export const REQUEST_SETTINGS_EVENT = "agentation-extension-request-settings";

/** Message types sent via chrome.runtime messaging. */
export type RuntimeMessage =
  | { type: "settings-changed"; settings: ExtensionSettings }
  | { type: "get-settings" };
