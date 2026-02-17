/**
 * Bridge script running in ISOLATED world.
 * Relays chrome.storage settings to the MAIN world content script via CustomEvents.
 */

import type { ExtensionSettings } from "../shared/types";
import {
  SETTINGS_EVENT,
  REQUEST_SETTINGS_EVENT,
} from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/defaults";

function dispatchSettings(settings: ExtensionSettings) {
  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, { detail: settings })
  );
}

async function loadAndDispatch() {
  const result = await chrome.storage.sync.get("settings");
  const settings: ExtensionSettings = result.settings ?? DEFAULT_SETTINGS;
  dispatchSettings(settings);
}

// On load, push current settings to MAIN world.
loadAndDispatch();

// MAIN world can request settings (e.g. if it loads after bridge).
window.addEventListener(REQUEST_SETTINGS_EVENT, () => {
  loadAndDispatch();
});

// When settings change in storage, push to MAIN world.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.settings) {
    dispatchSettings(changes.settings.newValue as ExtensionSettings);
  }
});

// Service worker can also push updates via messaging.
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "settings-changed") {
    dispatchSettings(message.settings as ExtensionSettings);
  }
});
