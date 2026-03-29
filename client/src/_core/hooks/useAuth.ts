import { useCallback, useEffect, useState, useRef } from "react";
import { trpcVanilla as trpc } from "@/lib/trpcVanilla";

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

export function useAuth(options?: { redirectOnUnauthenticated?: boolean }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isUnauthenticated: false,
  });
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const result = await trpc.auth.me.query();
      
      if (result && result.user) {
        const user: AuthUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          cafeteriaId: result.user.cafeteriaId,
          referenceCode: result.user.referenceCode,
        };
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
      console.error("Error in useAuth fetchUser:", err);
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
    refreshTimeoutRef.current = setTimeout(() => {
      if (state.loading) {
        console.warn("Auth loading timeout - forcing completion");
        setState(prev => ({
          ...prev,
          loading: false,
          isUnauthenticated: true,
        }));
      }
    }, 3000);

    fetchUser();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchUser]);

  const logout = useCallback(async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    await trpc.auth.logout.mutate();
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
    refresh: fetchUser,
  };
}
