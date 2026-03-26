import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string | undefined;
  name: string;
  role: string;
  cafeteriaId: any;
  referenceCode?: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
};

/**
 * Optimized user builder that prioritizes metadata to avoid slow DB lookups on every page load.
 */
async function buildUser(supabaseUser: any): Promise<AuthUser> {
  const meta = supabaseUser.user_metadata ?? {};
  
  // Create user object from metadata (fastest)
  const userFromMeta: AuthUser = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.name ?? meta.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
    role: meta.role ?? "admin",
    cafeteriaId: meta.cafeteriaId ?? 1,
    referenceCode: meta.referenceCode,
  };

  // Only fetch from public.users if critical data is missing from metadata
  // This significantly improves dashboard loading speed.
  if (!meta.role || !meta.cafeteriaId) {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role, name, cafeteriaId, referenceCode")
        .eq("id", supabaseUser.id)
        .single();
      
      if (!error && userData) {
        return {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: userData.name ?? userFromMeta.name,
          role: userData.role ?? userFromMeta.role,
          cafeteriaId: userData.cafeteriaId ?? userFromMeta.cafeteriaId,
          referenceCode: userData.referenceCode ?? userFromMeta.referenceCode,
        };
      }
    } catch (e) {
      console.error("Error fetching user from public.users:", e);
    }
  }

  return userFromMeta;
}

export function useAuth(options?: { redirectOnUnauthenticated?: boolean }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isUnauthenticated: false,
  });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setState({
        user: null,
        loading: false,
        error: error ?? null,
        isAuthenticated: false,
        isUnauthenticated: true,
      });
    } else {
      const user = await buildUser(data.user);
      setState({
        user,
        loading: false,
        error: null,
        isAuthenticated: true,
        isUnauthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await buildUser(session.user);
        setState({
          user,
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
  }, [refresh]);

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

  return {
    ...state,
    logout,
    refresh,
  };
}
