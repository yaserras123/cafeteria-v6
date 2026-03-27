import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useState, useRef } from "react";

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
 * Simplified user builder that uses only metadata from auth.getUser()
 * This prevents infinite loading states and database dependency issues
 */
async function buildUser(supabaseUser: any): Promise<AuthUser> {
  const meta = supabaseUser.user_metadata ?? {};
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: meta.name ?? meta.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
    role: meta.role ?? "cafeteria_admin",
    cafeteriaId: meta.cafeteriaId ?? null,
    referenceCode: meta.referenceCode,
  };
}

export function useAuth(options?: { redirectOnUnauthenticated?: boolean }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isUnauthenticated: false,
  });
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    try {
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
    } catch (err: any) {
      console.error("Error in useAuth refresh:", err);
      setState({
        user: null,
        loading: false,
        error: err,
        isAuthenticated: false,
        isUnauthenticated: true,
      });
    }
  }, []);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    refreshTimeoutRef.current = setTimeout(() => {
      if (state.loading) {
        console.warn("Auth loading timeout - forcing completion");
        setState(prev => ({
          ...prev,
          loading: false,
          isUnauthenticated: true,
        }));
      }
    }, 3000); // 3 second timeout

    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
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
      } catch (err: any) {
        console.error("Error in auth state change:", err);
        setState({
          user: null,
          loading: false,
          error: err,
          isAuthenticated: false,
          isUnauthenticated: true,
        });
      }
    });

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
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
