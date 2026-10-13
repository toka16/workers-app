"use client";

import { useRouter as useAppRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createContext, use, useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useRouter } from "@/i18n/navigation";

interface EditorGuard {
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** Navigates within the app, asking first when the current step has unsaved changes. */
  navigate: (href: string) => void;
  /** Runs `action` (sign-out, language switch…) right away, or once the user agrees to drop unsaved changes. */
  confirm: (action: () => void) => void;
}

const GuardContext = createContext<EditorGuard | null>(null);

/**
 * Marks the extra history entry pushed while a step is dirty. Back then lands on the real entry for the
 * same URL (so nothing visible changes) and we can ask before actually leaving.
 */
const SENTINEL = "__editorGuard";

function onSentinel(): boolean {
  return window.history.state?.[SENTINEL] === true;
}

function pushSentinel() {
  window.history.pushState({ ...window.history.state, [SENTINEL]: true }, "");
}

/**
 * Protects unsaved step changes across the whole dashboard: in-app links (sidebar, logo, status pill…),
 * the browser Back button, actions that go through `confirm`, and closing the tab.
 */
export function EditorGuardProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("dashboard.editor");
  const router = useRouter();
  // Hrefs read from rendered <a> elements already carry the locale prefix, so they bypass next-intl's router.
  const appRouter = useAppRouter();
  const [dirty, setDirtyState] = useState(false);
  // Read by event listeners and by navigations that run right after setDirty(false) in the same handler.
  const dirtyRef = useRef(false);
  const dirtyUrl = useRef<string | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const setDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirtyState(value);
  }, []);

  const confirm = useCallback((action: () => void) => {
    if (dirtyRef.current) setPending(() => action);
    else action();
  }, []);

  // Leaving from the guard's extra entry replaces it, so a later Back doesn't stop on a duplicate of this page.
  const navigate = useCallback(
    (href: string) => confirm(() => (onSentinel() ? router.replace(href) : router.push(href))),
    [confirm, router],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    dirtyUrl.current = window.location.href;
    if (!onSentinel()) pushSentinel();
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onPopState = () => {
      // Only a Back off the extra entry keeps the URL; anything else is a real navigation we can't hold up.
      if (!dirtyRef.current || window.location.href !== dirtyUrl.current) return;
      pushSentinel();
      setPending(() => () => window.history.go(-2));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Catch every in-app link, including ones rendered by server components (logo, status pill), before
  // next/link handles the click.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!dirtyRef.current && !onSentinel()) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      const here = window.location;
      if (url.origin !== here.origin || (url.pathname === here.pathname && url.search === here.search)) return;
      event.preventDefault();
      event.stopPropagation();
      const href = `${url.pathname}${url.search}${url.hash}`;
      confirm(() => (onSentinel() ? appRouter.replace(href) : appRouter.push(href)));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [appRouter, confirm]);

  function discard() {
    const action = pending!;
    setPending(null);
    setDirty(false);
    action();
  }

  return (
    <GuardContext value={{ dirty, setDirty, navigate, confirm }}>
      {children}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("discardTitle")}</DialogTitle>
            <DialogDescription>{t("discardText")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              {t("keepEditing")}
            </Button>
            <Button variant="destructive" onClick={discard}>
              {t("discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GuardContext>
  );
}

/** Null outside the dashboard, where there is nothing to protect. */
export function useEditorGuard(): EditorGuard | null {
  return use(GuardContext);
}

/** A Link that goes through the unsaved-changes check inside the dashboard and behaves normally elsewhere. */
export function GuardedLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const guard = useEditorGuard();
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (guard?.dirty && !event.defaultPrevented) {
          event.preventDefault();
          guard.navigate(href);
        }
      }}
      {...props}
    />
  );
}
