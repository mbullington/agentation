import React, { useEffect, useState } from "react";
import type { ExtensionSettings, UrlPattern } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/defaults";

export function App() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [newPattern, setNewPattern] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get("settings").then((result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      setLoaded(true);
    });
  }, []);

  function save(next: ExtensionSettings) {
    setSettings(next);
    chrome.storage.sync.set({ settings: next });
  }

  function toggleEnabled() {
    save({ ...settings, enabled: !settings.enabled });
  }

  function togglePattern(index: number) {
    const patterns = settings.patterns.map((p, i) =>
      i === index ? { ...p, enabled: !p.enabled } : p
    );
    save({ ...settings, patterns });
  }

  function deletePattern(index: number) {
    const patterns = settings.patterns.filter((_, i) => i !== index);
    save({ ...settings, patterns });
  }

  function addPattern() {
    const trimmed = newPattern.trim();
    if (!trimmed) return;
    // Avoid duplicates.
    if (settings.patterns.some((p) => p.pattern === trimmed)) return;
    const patterns: UrlPattern[] = [
      ...settings.patterns,
      { pattern: trimmed, enabled: true },
    ];
    save({ ...settings, patterns });
    setNewPattern("");
  }

  function updateEndpoint(value: string) {
    save({ ...settings, endpoint: value });
  }

  function updateWebhookUrl(value: string) {
    save({ ...settings, webhookUrl: value });
  }

  if (!loaded) return null;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>Agentation</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#666" }}>
            {settings.enabled ? "On" : "Off"}
          </span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={toggleEnabled}
          />
        </label>
      </div>

      {/* URL Patterns */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: "#555",
            marginBottom: 6,
          }}
        >
          URL Patterns
        </div>
        {settings.patterns.map((p, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 4,
            }}
          >
            <input
              type="checkbox"
              checked={p.enabled}
              onChange={() => togglePattern(i)}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: p.enabled ? "#1a1a1a" : "#999",
              }}
            >
              {p.pattern}
            </span>
            <button
              onClick={() => deletePattern(i)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#999",
                fontSize: 14,
                lineHeight: 1,
                padding: "2px 4px",
              }}
              title="Remove pattern"
            >
              x
            </button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPattern()}
            placeholder="http://example.com:*/*"
            style={{
              flex: 1,
              fontSize: 12,
              padding: "4px 6px",
              border: "1px solid #ddd",
              borderRadius: 3,
              fontFamily: "monospace",
            }}
          />
          <button
            onClick={addPattern}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              border: "1px solid #ddd",
              borderRadius: 3,
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Settings */}
      <div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: "#555",
            marginBottom: 6,
          }}
        >
          Settings
        </div>
        <label
          style={{ display: "block", marginBottom: 6, fontSize: 12 }}
        >
          Endpoint URL
          <input
            type="text"
            value={settings.endpoint}
            onChange={(e) => updateEndpoint(e.target.value)}
            placeholder="http://localhost:4747"
            style={{
              display: "block",
              width: "100%",
              marginTop: 2,
              fontSize: 12,
              padding: "4px 6px",
              border: "1px solid #ddd",
              borderRadius: 3,
              fontFamily: "monospace",
            }}
          />
        </label>
        <label style={{ display: "block", fontSize: 12 }}>
          Webhook URL
          <input
            type="text"
            value={settings.webhookUrl}
            onChange={(e) => updateWebhookUrl(e.target.value)}
            placeholder="https://..."
            style={{
              display: "block",
              width: "100%",
              marginTop: 2,
              fontSize: 12,
              padding: "4px 6px",
              border: "1px solid #ddd",
              borderRadius: 3,
              fontFamily: "monospace",
            }}
          />
        </label>
      </div>
    </div>
  );
}
