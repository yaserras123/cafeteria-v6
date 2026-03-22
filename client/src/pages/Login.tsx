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
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Role → dashboard route mapping.
 * Matches the roles returned by server/routers/auth.ts login mutation.
 */
const ROLE_ROUTES: Record<string, string> = {
  owner: "/dashboard/owner",
  marketer: "/dashboard/marketer",
  admin: "/dashboard/cafeteria",
  manager: "/dashboard/manager",
  waiter: "/dashboard/waiter",
  chef: "/dashboard/chef",
};

function getRouteForRole(role: string): string {
  return ROLE_ROUTES[role] ?? "/dashboard/cafeteria";
}

/**
 * Safely extract a human-readable error message from any thrown value.
 * Handles tRPC errors, plain Error objects, and non-JSON HTTP responses.
 */
function extractErrorMessage(error: unknown): string {
  if (!error) return "Login failed. Please try again.";

  // tRPC wraps errors in a shape like: { message, data: { code, httpStatus } }
  if (typeof error === "object") {
    const err = error as Record<string, any>;

    // tRPC client error: err.message is the server message
    if (typeof err.message === "string" && err.message.trim().length > 0) {
      // Filter out raw JSON parse noise
      if (
        err.message.includes("Unexpected end of JSON") ||
        err.message.includes("JSON.parse") ||
        err.message.includes("SyntaxError")
      ) {
        return "Server returned an invalid response. Please try again.";
      }
      return err.message;
    }

    // tRPC shape: err.data?.message
    if (err.data && typeof err.data.message === "string" && err.data.message.trim().length > 0) {
      return err.data.message;
    }

    // tRPC shape: err.shape?.message
    if (err.shape && typeof err.shape.message === "string" && err.shape.message.trim().length > 0) {
      return err.shape.message;
    }
  }

  if (error instanceof Error) {
    if (
      error.message.includes("Unexpected end of JSON") ||
      error.message.includes("JSON.parse") ||
      error.message.includes("SyntaxError")
    ) {
      return "Server returned an invalid response. Please try again.";
    }
    return error.message || "Login failed. Please check your credentials.";
  }

  return "Login failed. Please check your credentials.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const loginMutation = trpc.auth.login.useMutation();

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
      const result = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (!result || !result.success) {
        setErrorMessage("Login failed. Please check your credentials.");
        return;
      }

      toast.success(`Welcome, ${result.name ?? "User"}!`);

      const destination = getRouteForRole(result.role);
      setLocation(destination);
    } catch (error: unknown) {
      const msg = extractErrorMessage(error);
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
