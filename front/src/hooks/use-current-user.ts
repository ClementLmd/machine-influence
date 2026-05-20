"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@machine-influence/shared/enums";

type CurrentUser = { id: string; role: UserRole };

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const apiBaseUrl = getApiBaseUrl();
        if (!apiBaseUrl) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const userData = await res.json();
        if (!cancelled) {
          setCurrentUser({ id: userData.id, role: userData.role });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { currentUser, loading };
}
