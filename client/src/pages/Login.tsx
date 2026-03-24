import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Role → dashboard route mapping.
 * Matches the roles returned by server/routers/auth.ts login mutation.
 */
const ROLE_ROUTES: Record<string, string> = {
  owner: "/dashboard/owner",
  marketer: "/dashboard/marketer",
  admin: "/dashboard/cafeteria",
  cafeteria_admin: "/dashboard/manager",
  manager: "/dashboard/manager",
  waiter: "/dashboard/waiter",
  chef: "/dashboard/chef",
};

function getRouteForRole(role?: string): string {
  if (!role) return "/dashboard/manager";
  return ROLE_ROUTES[role] ?? "/dashboard/manager";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        setErrorMessage(`Login Error: ${error.message}`);
        return;
      }

      if (!data.user) {
        setErrorMessage("Login failed: No user returned from Supabase.");
        return;
      }

      const role: string =
        data.user.user_metadata?.role ?? "cafeteria_admin";
      const name: string =
        data.user.user_metadata?.name ??
        data.user.user_metadata?.full_name ??
        data.user.email?.split("@")[0] ??
        "User";

      toast.success(`Welcome, ${name}!`);
      setLocation(getRouteForRole(role));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Cafeteria System</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message area */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
