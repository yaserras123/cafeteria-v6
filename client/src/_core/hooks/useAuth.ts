/**
 * useAuth — Supabase-only authentication hook.
 *
 * Replaces the legacy tRPC-based auth hook. All session data comes
 * directly from Supabase Auth; no database queries are performed.
 *
 * Fallback values are provided so the app works even when the
 * public.users table does not exist:
 *   role        → "admin"
 *   cafeteriaId → 1
 */
import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string | undefined;
  name: string;
  role: string;
  cafeteriaId: number;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
};

function buildUser(supabaseUser: import("@supabase/supabase-js").User): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name:
      meta.name ??
      meta.full_name ??
      supabaseUser.email?.split("@")[0] ??
      "User",
    role: meta.role ?? "admin",
    cafeteriaId: meta.cafeteriaId ?? 1,
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isUnauthenticated: false,
  });

  useEffect(() => {
    // Fetch the initial session
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setState({
          user: null,
          loading: false,
          error: error ?? null,
          isAuthenticated: false,
          isUnauthenticated: true,
        });
      } else {
        setState({
          user: buildUser(data.user),
          loading: false,
          error: null,
          isAuthenticated: true,
          isUnauthenticated: false,
        });
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({
          user: buildUser(session.user),
          loading: false,
          error: null,
          isAuthenticated: true,
          isUnauthenticated: false,
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          isUnauthenticated: true,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isUnauthenticated: true,
    });
  }, []);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isUnauthenticated: true,
        error: error ?? null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        user: buildUser(data.user),
        isAuthenticated: true,
        isUnauthenticated: false,
        error: null,
      }));
    }
  }, []);

  return {
    ...state,
    logout,
    refresh,
  };
}
