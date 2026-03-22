import React from "react";
import { useLocation } from "wouter";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * UpgradeCancel
 *
 * Shown when the user cancels the Stripe Checkout flow.
 * Offers a clear call-to-action to retry the upgrade or return to the dashboard.
 */
export default function UpgradeCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-md w-full p-10 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-slate-400" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black text-slate-900 mb-3">
          Upgrade Canceled
        </h1>
        <p className="text-slate-600 mb-8">
          No charges were made. You can retry the upgrade whenever you are ready.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            className="w-full font-bold"
            onClick={() => setLocation("/upgrade")}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
