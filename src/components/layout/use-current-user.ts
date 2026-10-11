"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/domain/models";
import { getBrowserRepositories } from "@/infrastructure/container.client";

/**
 * Reads the session in the browser so public pages stay fully static on the server.
 * `undefined` while loading, `null` when signed out.
 */
export function useCurrentUser(): AuthUser | null | undefined {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    getBrowserRepositories()
      .auth.getCurrentUser()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null));
    return () => {
      active = false;
    };
  }, []);
  return user;
}
