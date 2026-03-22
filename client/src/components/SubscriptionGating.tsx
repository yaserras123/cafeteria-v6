import React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlanCheck } from "@/hooks/usePlanCheck";

// ---------------------------------------------------------------------------
// UpgradeModal
// ---------------------------------------------------------------------------

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

/**
 * UpgradeModal
 *
 * Displays a modal prompting the user to upgrade their subscription plan.
 * The upgrade action navigates to the /upgrade route (placeholder for future
 * billing integration).
 *
 * TODO: Replace the /upgrade navigation with real billing integration when
 * the payment provider is connected.
 */
export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  if (!open) return null;

  const handleUpgrade = () => {
    // TODO: Integrate with billing provider (e.g., Stripe, Paddle)
    // For now, navigate to the placeholder upgrade route
    window.location.href = "/upgrade";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Upgrade Required</h2>
            <p className="text-slate-500 text-sm">
              {reason ||
                "This feature is not available on your current plan. Upgrade to unlock it."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-200"
            >
              Upgrade Plan
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-slate-500">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatureGate
// ---------------------------------------------------------------------------

interface FeatureGateProps {
  /** The feature key to check against the plan limits */
  feature: "premiumReports" | "sections";
  /** Content to render when the feature is available */
  children: React.ReactNode;
  /** Optional custom fallback UI when the feature is locked */
  fallback?: React.ReactNode;
}

/**
 * FeatureGate
 *
 * Wraps content that requires a specific plan feature.
 * If the feature is not available on the current plan, it renders a locked
 * fallback UI instead of the children.
 *
 * Usage:
 *   <FeatureGate feature="premiumReports">
 *     <ReportsComponent />
 *   </FeatureGate>
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, isLoading, plan } = usePlanCheck();

  // While loading, render nothing to avoid flash of locked UI
  if (isLoading) return null;

  if (!hasFeature(feature)) {
    if (fallback) return <>{fallback}</>;
    return <LockedFeatureCard feature={feature} plan={plan} />;
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// LockedFeatureCard (internal)
// ---------------------------------------------------------------------------

interface LockedFeatureCardProps {
  feature: string;
  plan?: string;
}

const FEATURE_LABELS: Record<string, string> = {
  premiumReports: "Premium Reports & Analytics",
  sections: "Multiple Sections",
};

function LockedFeatureCard({ feature, plan }: LockedFeatureCardProps) {
  const [showModal, setShowModal] = React.useState(false);
  const label = FEATURE_LABELS[feature] || feature;

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">{label}</h3>
          <p className="text-sm text-slate-500">
            {plan
              ? `Your current <strong>${plan}</strong> plan does not include this feature.`
              : "This feature is not available on your current plan."}
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-100"
        >
          Upgrade to Unlock
        </Button>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        reason={`${label} requires a higher subscription plan.`}
      />
    </>
  );
}
