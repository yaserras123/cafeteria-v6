import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  allowedRoles: string[];
}

/**
 * Role → dashboard route mapping.
 * Used to redirect users to their correct dashboard when they lack
 * permission to access the requested route.
 */
const ROLE_ROUTES: Record<string, string> = {
  owner: "/dashboard/owner",
  marketer: "/dashboard/marketer",
  admin: "/dashboard/cafeteria",
  manager: "/dashboard/manager",
  waiter: "/dashboard/waiter",
  chef: "/dashboard/chef",
};

/**
 * ProtectedRoute wraps a dashboard component and enforces both
 * authentication and role-based access control (RBAC).
 *
 * - If loading: shows a spinner
 * - If not authenticated: redirects to /login (SPA navigation)
 * - If authenticated but role not in allowedRoles: redirects to user's
 *   correct dashboard based on their role (SPA navigation)
 * - If authenticated and role is allowed: renders the component
 *
 * Uses useAuth() to check session state and user role. Redirects use
 * setLocation() for SPA navigation (wouter) instead of window.location.replace.
 */
export function ProtectedRoute({
  component: Component,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, isUnauthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → redirect to login
    if (isUnauthenticated) {
      setLocation("/login");
      return;
    }

    // Authenticated but role not allowed → redirect to user's correct dashboard
    if (user && user.role) {
      const userRole = user.role as string;
      if (!allowedRoles.includes(userRole)) {
        const correctRoute = ROLE_ROUTES[userRole] ?? "/";
        setLocation(correctRoute);
      }
    }
  }, [loading, isUnauthenticated, user, allowedRoles, setLocation]);

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

  // Check if user role is allowed
  if (user && user.role) {
    const userRole = user.role as string;
    if (!allowedRoles.includes(userRole)) {
      return null;
    }
  }

  return <Component />;
}
