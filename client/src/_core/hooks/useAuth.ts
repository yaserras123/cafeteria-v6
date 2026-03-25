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

async function buildUser(supabaseUser: any): Promise<AuthUser> {
  const meta = supabaseUser.user_metadata ?? {};
  
  // Try to fetch from public.users table for the most up-to-date role
  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select("role, name, cafeteriaId")
      .eq("id", supabaseUser.id)
      .single();
    
    if (!error && userData) {
      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: userData.name ?? meta.name ?? meta.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
        role: userData.role ?? meta.role ?? "admin",
        cafeteriaId: userData.cafeteriaId ?? meta.cafeteriaId ?? 1,
      };
    }
  } catch (e) {
    console.error("Error fetching user from public.users:", e);
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.name ?? meta.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
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
