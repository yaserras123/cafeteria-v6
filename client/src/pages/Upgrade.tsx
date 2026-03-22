import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowLeft, Loader2, Zap, TrendingUp, ShieldCheck, Info } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { usePlanCheck } from '@/hooks/usePlanCheck';
import { cn } from '@/lib/utils';

interface PlanFeature {
  name: string;
  starter: string | boolean;
  growth: string | boolean;
  pro: string | boolean;
  highlight?: boolean;
}

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { plan: currentPlan } = usePlanCheck();
  const [loadingPlan, setLoadingPlan] = useState<'growth' | 'pro' | null>(null);

  // Create checkout session mutation
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small cafeterias starting out',
      price: 'Free',
      period: 'Forever',
      badge: null,
      color: 'bg-white border-slate-200',
      buttonVariant: 'outline' as const,
      buttonText: currentPlan === 'starter' ? 'Current Plan' : 'Basic Features',
      buttonDisabled: currentPlan === 'starter',
      icon: <Info className="w-5 h-5 text-slate-400" />,
    },
    {
      id: 'growth',
      name: 'Growth',
      description: 'For growing operations needing full insights',
      price: '$29',
      period: 'per month',
      badge: 'Most Popular',
      bestValue: true,
      color: 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500 ring-offset-2',
      buttonVariant: 'default' as const,
      buttonText: currentPlan === 'growth' ? 'Current Plan' : (currentPlan === 'pro' ? 'Included' : 'Unlock Growth Plan'),
      buttonDisabled: currentPlan === 'growth' || currentPlan === 'pro',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      glow: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For power users and enterprise scale',
      price: '$99',
      period: 'per month',
      badge: 'Power User',
      color: 'bg-purple-50/50 border-purple-200',
      buttonVariant: 'default' as const,
      buttonText: currentPlan === 'pro' ? 'Current Plan' : 'Start Scaling Now',
      buttonDisabled: currentPlan === 'pro',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
    },
  ];

  const features: PlanFeature[] = [
    { name: 'Staff Members', starter: '3 Staff', growth: '10 Staff', pro: 'Unlimited' },
    { name: 'Tables & Seating', starter: '10 Tables', growth: '50 Tables', pro: 'Unlimited' },
    { name: 'Multiple Sections', starter: false, growth: true, pro: true, highlight: true },
    { name: 'Premium Reports', starter: false, growth: true, pro: true, highlight: true },
    { name: 'Performance Analytics', starter: false, growth: true, pro: true },
    { name: 'Priority Support', starter: false, growth: false, pro: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Upgrade Your Plan</h1>
              <p className="text-sm text-slate-500 font-medium">Choose the perfect plan for your cafeteria</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Urgency / Value Banner */}
        <div className="mb-12 bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
              <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              Unlock Your Full Potential
            </h2>
            <p className="text-blue-50 font-medium max-w-xl">
              Starter plan is limited to 3 staff. Upgrade to <strong>Growth</strong> now to unlock full reporting, multiple sections, and manage up to 10 staff members.
            </p>
          </div>
          <div className="relative z-10">
            <Badge className="bg-white/20 text-white border-none px-4 py-2 text-sm backdrop-blur-md">
              Growth Plan: Best Value
            </Badge>
          </div>
          {/* Decorative Background Icon */}
          <TrendingUp className="absolute -right-8 -bottom-8 w-48 h-48 text-blue-500/20" />
        </div>

        {/* Plans Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={cn(
                "relative border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col",
                plan.color,
                plan.glow && "shadow-xl shadow-blue-100"
              )}
            >
              {plan.badge && (
                <div className={cn(
                  "absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider text-white z-10",
                  plan.id === 'growth' ? "bg-blue-600" : "bg-purple-600"
                )}>
                  {plan.badge}
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {plan.icon}
                  <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {plan.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-slate-600 font-medium min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                    <span className="text-sm text-slate-500 font-bold">/{plan.period}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={async () => {
                    if (plan.buttonDisabled || !user?.cafeteriaId) return;
                    
                    setLoadingPlan(plan.id as 'growth' | 'pro');
                    try {
                      const result = await checkoutMutation.mutateAsync({
                        plan: plan.id as 'growth' | 'pro',
                      });
                      window.location.href = result.url;
                    } catch (error) {
                      console.error('Checkout error:', error);
                      alert('Failed to start checkout. Please try again.');
                      setLoadingPlan(null);
                    }
                  }}
                  disabled={plan.buttonDisabled || loadingPlan !== null}
                  variant={plan.buttonVariant}
                  className={cn(
                    "w-full font-black uppercase tracking-wider h-12 text-sm shadow-md",
                    plan.id === 'growth' && !plan.buttonDisabled && "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
                    plan.id === 'pro' && !plan.buttonDisabled && "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                  )}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>

                {/* Features List */}
                <div className="space-y-3 pt-6 border-t border-slate-200 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">What's Included</p>
                  {features.map((feature, fIdx) => {
                    const value = feature[plan.id as keyof PlanFeature] as string | boolean;
                    const isIncluded = value !== false;

                    return (
                      <div key={fIdx} className={cn(
                        "flex items-start gap-3 p-2 rounded-lg transition-colors",
                        feature.highlight && isIncluded && plan.id !== 'starter' ? "bg-white shadow-sm border border-slate-100" : ""
                      )}>
                        {isIncluded ? (
                          <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5", plan.id === 'growth' ? "text-blue-600" : plan.id === 'pro' ? "text-purple-600" : "text-green-500")} />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={cn(
                            "text-xs font-bold text-slate-900",
                            !isIncluded && "text-slate-400"
                          )}>
                            {feature.name}
                          </p>
                          {typeof value === 'string' && (
                            <p className="text-[10px] text-slate-500 font-medium">{value}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl mb-16">
          <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Detailed Feature Comparison</h3>
            <Badge variant="outline" className="font-bold">Full Transparency</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Feature</th>
                  <th className="px-8 py-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Starter</th>
                  <th className="px-8 py-5 text-center text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50/30">Growth</th>
                  <th className="px-8 py-5 text-center text-xs font-black text-purple-600 uppercase tracking-widest">Pro</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b border-slate-100 transition-colors hover:bg-slate-50/50",
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    )}
                  >
                    <td className="px-8 py-4">
                      <p className="text-sm font-bold text-slate-900">{feature.name}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      {feature.starter === false ? (
                        <X className="w-5 h-5 text-slate-200 mx-auto" />
                      ) : (
                        <span className="text-xs font-black text-slate-600">{feature.starter}</span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-center bg-blue-50/30">
                      {feature.growth === false ? (
                        <X className="w-5 h-5 text-slate-200 mx-auto" />
                      ) : (
                        <span className="text-xs font-black text-blue-700">{feature.growth}</span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-center">
                      {feature.pro === false ? (
                        <X className="w-5 h-5 text-slate-200 mx-auto" />
                      ) : (
                        <span className="text-xs font-black text-purple-700">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Secure Billing via Stripe</p>
          <p className="text-sm text-slate-500 font-medium">© 2026 Cafeteria Management System • All plans include core features</p>
        </div>
      </footer>
    </div>
  );
}
