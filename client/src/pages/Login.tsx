import { useState } from "react";
import { useLocation } from "wouter";
import { trpcVanilla as trpc } from "@/lib/trpcVanilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const ROLE_ROUTES: Record<string, string> = {
  owner: "/dashboard/owner",
  marketer: "/dashboard/marketer",
  admin: "/dashboard/cafeteria-admin",
  cafeteria_admin: "/dashboard/cafeteria-admin",
  manager: "/dashboard/manager",
  waiter: "/dashboard/waiter",
  chef: "/dashboard/chef",
};

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

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await trpc.auth.login.mutate({
        email: email.trim(),
        password: password,
      });

      if (result.success) {
        localStorage.setItem('last_activity', Date.now().toString());
        toast.success(`Welcome, ${result.name}!`);
        setLocation(ROLE_ROUTES[result.role] || "/dashboard/cafeteria-admin");
      } else {
        setErrorMessage(result.message || "Invalid email or password.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Cafeteria System</CardTitle>
          <CardDescription className="text-slate-500">Sign in to your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Username or Email</label>
              <Input
                type="text"
                placeholder="Enter your credentials"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-slate-50 border-slate-200 pr-12 focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" /> {errorMessage}
              </div>
            )}
            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
