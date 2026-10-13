"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Cloudflare Turnstile, verified by Supabase Auth (enable it under Auth → Bot protection, or
 * [auth.captcha] locally). Without NEXT_PUBLIC_TURNSTILE_SITE_KEY the widget is skipped entirely.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface Turnstile {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let scriptPromise: Promise<Turnstile> | undefined;

function loadTurnstile(): Promise<Turnstile> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function CaptchaWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId = turnstile.render(container.current, {
          sitekey: SITE_KEY,
          size: "flexible",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [onToken]);

  return <div ref={container} className="min-h-16.5" />;
}

/**
 * Bot check for auth forms. Tokens are single-use, so call `reset()` after every submission.
 * `ready` is true when no captcha is configured.
 */
export function useCaptcha(): { widget: ReactNode; token: string | undefined; ready: boolean; reset: () => void } {
  const [token, setToken] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  return {
    widget: SITE_KEY ? <CaptchaWidget key={round} onToken={setToken} /> : null,
    token: token ?? undefined,
    ready: !SITE_KEY || token !== null,
    reset: () => {
      setToken(null);
      setRound((r) => r + 1);
    },
  };
}
