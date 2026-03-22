import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const REDIRECT_DELAY_MS = 5000;

/**
 * UpgradeSuccess
 *
 * Shown after a successful Stripe Checkout session.
 * - Refetches the plan context so the UI reflects the new subscription
 *   immediately without requiring a manual page reload.
 * - Redirects to the dashboard after REDIRECT_DELAY_MS milliseconds.
 */
export default function UpgradeSuccess() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const cafeteriaId = (user as any)?.cafeteriaId ?? "";

  const [secondsLeft, setSecondsLeft] = useState(Math.round(REDIRECT_DELAY_MS / 1000));

  // Refetch plan context so the UI updates immediately
  const utils = trpc.useUtils();
  useEffect(() => {
    if (cafeteriaId) {
      utils.cafeterias.getPlanContext.invalidate({ cafeteriaId });
    }
  }, [cafeteriaId, utils]);

  // Fetch current plan to display it on the page
  const { data: planData, isLoading: planLoading } =
    trpc.cafeterias.getPlanContext.useQuery(
      { cafeteriaId },
      { enabled: !!cafeteriaId }
    );

  // Countdown + redirect
  useEffect(() => {
    if (secondsLeft <= 0) {
      setLocation("/");
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, setLocation]);

  const planLabel = planData?.plan
    ? planData.plan.charAt(0).toUpperCase() + planData.plan.slice(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-green-200 max-w-md w-full p-10 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black text-slate-900 mb-3">
          Upgrade Successful!
        </h1>
        <p className="text-slate-600 mb-6">
          Your subscription has been activated. Enjoy your new features.
        </p>

        {/* Current plan */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-4 mb-8 inline-block w-full">
          <p className="text-sm text-slate-500 mb-1">Current Plan</p>
          {planLoading ? (
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <p className="text-2xl font-black text-green-700">
              {planLabel ?? "—"}
            </p>
          )}
        </div>

        {/* Redirect notice */}
        <p className="text-sm text-slate-400">
          Redirecting to dashboard in{" "}
          <span className="font-bold text-slate-600">{secondsLeft}s</span>…
        </p>

        {/* Manual redirect */}
        <button
          onClick={() => setLocation("/")}
          className="mt-4 text-sm font-medium text-green-600 hover:text-green-800 underline underline-offset-2 transition-colors"
        >
          Go to dashboard now
        </button>
      </div>
    </div>
  );
}
