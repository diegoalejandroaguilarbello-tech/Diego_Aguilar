"use client";

import { useEffect } from "react";
import { captureAttribution } from "../../lib/client-attribution";

export default function Tracking() {
  useEffect(() => {
    const attribution = captureAttribution();
    const pageKey = `visit:${attribution.sessionId}:${window.location.pathname}`;
    try {
      if (sessionStorage.getItem(pageKey)) return;
      sessionStorage.setItem(pageKey, "1");
    } catch {
      // The server also deduplicates visits when browser storage is unavailable.
    }
    fetch("/api/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        ...attribution,
        path: window.location.pathname,
      }),
    }).catch(() => undefined);
  }, []);
  return null;
}
