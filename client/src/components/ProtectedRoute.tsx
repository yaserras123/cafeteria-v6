import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
}

/**
 * ProtectedRoute wraps a dashboard component and enforces authentication.
 *
 * - If loading: shows a spinner
 * - If not authenticated: redirects to /login (via window.location.replace)
 * - If authenticated: renders the component
 *
 * Uses useAuth() to check session state. The redirect happens via
 * window.location.replace to ensure a hard redirect and prevent
 * back-button issues.
 */
export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { user, loading, isUnauthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (isUnauthenticated) {
      // Hard redirect to /login to prevent back-button access
      window.location.replace("/login");
    }
  }, [loading, isUnauthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isUnauthenticated) {
    return null;
  }

  return <Component />;
}
