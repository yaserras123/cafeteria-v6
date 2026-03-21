import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useRef } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const {
    redirectOnUnauthenticated = false,
    redirectPath = getLoginUrl(),
  } = options ?? {};

  const utils = trpc.useUtils();
  const hasRedirectedRef = useRef(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const isUnauthorizedError =
    meQuery.error instanceof TRPCClientError &&
    meQuery.error.data?.code === "UNAUTHORIZED";

  const isSettled = !meQuery.isLoading && !logoutMutation.isPending;

  const isAuthenticated = Boolean(meQuery.data);

  const isUnauthenticated =
    isSettled && (meQuery.data === null || meQuery.data === undefined) && !!meQuery.error
      ? isUnauthorizedError
      : isSettled && !meQuery.data;

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated,
      isUnauthenticated,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    isAuthenticated,
    isUnauthenticated,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (meQuery.data) {
        localStorage.setItem(
          "manus-runtime-user-info",
          JSON.stringify(meQuery.data)
        );
      } else {
        localStorage.removeItem("manus-runtime-user-info");
      }
    } catch {
      // ignore localStorage failures
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!isSettled) return;
    if (!isUnauthenticated) return;
    if (typeof window === "undefined") return;
    if (hasRedirectedRef.current) return;

    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;

    const targetUrl = new URL(redirectPath, window.location.origin);
    const targetPath = targetUrl.pathname;

    if (currentPath === targetPath || currentUrl === targetUrl.href) return;

    hasRedirectedRef.current = true;
    window.location.replace(targetUrl.href);
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isSettled,
    isUnauthenticated,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
