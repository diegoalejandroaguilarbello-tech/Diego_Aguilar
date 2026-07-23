"use client";

import { useEffect, useRef, useState } from "react";

const LOCAL_TOKEN = "local-preview-token";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "local" | "unconfigured" | "error">("loading");

  useEffect(() => {
    let active = true;
    let widgetId = "";
    fetch("/api/config/turnstile", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ mode: "turnstile" | "local" | "unconfigured"; siteKey: string }>)
      .then(async (config) => {
        if (!active) return;
        if (config.mode === "local") {
          onToken(LOCAL_TOKEN);
          setStatus("local");
          return;
        }
        if (config.mode === "unconfigured" || !config.siteKey) {
          onToken("");
          setStatus("unconfigured");
          return;
        }
        await loadTurnstileScript();
        if (!active || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: config.siteKey,
          theme: "auto",
          size: "flexible",
          appearance: "always",
          execution: "render",
          language: "es",
          callback: (token: string) => { onToken(token); setStatus("ready"); },
          "expired-callback": () => { onToken(""); setStatus("loading"); },
          "error-callback": () => { onToken(""); setStatus("error"); },
        });
        setStatus("loading");
      })
      .catch(() => setStatus("error"));
    return () => {
      active = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  return (
    <div className="turnstileWrap">
      <div className="turnstileHeading">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>Verifica que eres humano</strong>
          <small>Completa la comprobación de seguridad para continuar.</small>
        </div>
      </div>
      <div className="turnstileContainer" ref={container} />
      {status === "loading" && <small className="turnstileStatus">Preparando verificación de seguridad…</small>}
      {status === "ready" && <small className="turnstileSuccess">✓ Verificación completada correctamente.</small>}
      {status === "local" && <small className="turnstileSuccess">✓ Verificación local activa.</small>}
      {status === "unconfigured" && <small className="turnstileError">El cotizador requiere configurar Turnstile antes de publicarlo.</small>}
      {status === "error" && <small className="turnstileError">No se pudo cargar la verificación. Recarga la página.</small>}
    </div>
  );
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]');
  if (existing) return new Promise<void>((resolve, reject) => {
    existing.addEventListener("load", () => resolve(), { once: true });
    existing.addEventListener("error", () => reject(new Error("turnstile")), { once: true });
  });
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("turnstile")), { once: true });
    document.head.appendChild(script);
  });
}
