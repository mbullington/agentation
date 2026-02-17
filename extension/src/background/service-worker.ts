/**
 * Service worker for the Agentation Chrome extension.
 * Manages default settings and dynamic content script registration.
 *
 * Uses standard ServiceWorker lifecycle events (install/activate) rather than
 * chrome.runtime.onInstalled/onStartup for broader compatibility.
 */

import type { ExtensionSettings } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/defaults";

/** Seed default settings on install. */
self.addEventListener("install", () => {
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
  chrome.storage.sync.get("settings").then((result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  });
});

/** Update dynamic scripts on activate. */
self.addEventListener("activate", () => {
  chrome.storage.sync.get("settings").then((result) => {
    if (result.settings) {
      updateDynamicScripts(result.settings as ExtensionSettings);
    }
  });
});

/**
 * The manifest already covers localhost and 127.0.0.1.
 * We register additional patterns dynamically here.
 */
const MANIFEST_PATTERNS = new Set([
  "http://localhost:*/*",
  "http://127.0.0.1:*/*",
]);

async function updateDynamicScripts(settings: ExtensionSettings) {
  try {
    await chrome.scripting.unregisterContentScripts({
      ids: ["agentation-dynamic-bridge", "agentation-dynamic-content"],
    });
  } catch {
    // Scripts may not exist yet.
  }

  if (!settings.enabled) return;

  const extraPatterns = settings.patterns
    .filter((p) => p.enabled && !MANIFEST_PATTERNS.has(p.pattern))
    .map((p) => p.pattern);

  if (extraPatterns.length === 0) return;

  await chrome.scripting.registerContentScripts([
    {
      id: "agentation-dynamic-bridge",
      matches: extraPatterns,
      js: ["content/bridge.js"],
      runAt: "document_start",
      world: "ISOLATED" as chrome.scripting.ExecutionWorld,
    },
    {
      id: "agentation-dynamic-content",
      matches: extraPatterns,
      js: ["content/index.js"],
      runAt: "document_idle",
      world: "MAIN" as chrome.scripting.ExecutionWorld,
    },
  ]);
}

/** When settings change, update dynamic scripts and notify open tabs. */
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync" || !changes.settings) return;

  const settings = changes.settings.newValue as ExtensionSettings;
  await updateDynamicScripts(settings);

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id != null) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: "settings-changed",
          settings,
        });
      } catch {
        // Tab may not have content script.
      }
    }
  }
});
