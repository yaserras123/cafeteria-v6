import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

/**
 * usePlanContext
 *
 * Fetches the subscription plan and feature limits from the backend.
 * This is the single source of truth for plan enforcement on the frontend.
 * No hardcoded limits — all data comes from the backend getPlanContext API.
 */
export function usePlanContext() {
  const { user } = useAuth();
  const cafeteriaId = (user as any)?.cafeteriaId ?? "";

  const { data, isLoading, error } = trpc.cafeterias.getPlanContext.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId }
  );

  return {
    plan: data?.plan,
    limits: data?.limits,
    isLoading,
    error,
  };
}
