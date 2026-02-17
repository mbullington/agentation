/**
 * Content script running in MAIN world.
 * Mounts the <Agentation /> toolbar, receiving settings from the bridge via CustomEvents.
 */

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";
import type { ExtensionSettings } from "../shared/types";
import { SETTINGS_EVENT, REQUEST_SETTINGS_EVENT } from "../shared/types";

const ROOT_ID = "agentation-extension-root";

/** Check if URL matches a Chrome match pattern (simplified). */
function urlMatchesPattern(url: string, pattern: string): boolean {
  // Convert Chrome match pattern to regex.
  // Pattern format: scheme://host/path  where * is wildcard.
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  try {
    return new RegExp(`^${escaped}$`).test(url);
  } catch {
    return false;
  }
}

function AgentationWrapper() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ExtensionSettings>).detail;
      setSettings(detail);
    };

    window.addEventListener(SETTINGS_EVENT, handler);

    // Request settings from bridge in case it loaded before us.
    window.dispatchEvent(new CustomEvent(REQUEST_SETTINGS_EVENT));

    return () => {
      window.removeEventListener(SETTINGS_EVENT, handler);
    };
  }, []);

  if (!settings || !settings.enabled) return null;

  // Check if current URL matches any enabled pattern.
  const currentUrl = window.location.href;
  const matches = settings.patterns.some(
    (p) => p.enabled && urlMatchesPattern(currentUrl, p.pattern)
  );
  if (!matches) return null;

  return (
    <Agentation
      endpoint={settings.endpoint || undefined}
      webhookUrl={settings.webhookUrl || undefined}
    />
  );
}

function mount() {
  // Guard against double-injection.
  if (document.getElementById(ROOT_ID)) return;

  const container = document.createElement("div");
  container.id = ROOT_ID;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<AgentationWrapper />);
}

// Mount when DOM is ready (script runs at document_idle so it should be).
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
