import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowLeft, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface PlanFeature {
  name: string;
  starter: string | boolean;
  growth: string | boolean;
  pro: string | boolean;
}

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<'growth' | 'pro' | null>(null);

  // Create checkout session mutation
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation();

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small cafeterias',
      price: 'Free',
      period: 'Forever',
      badge: null,
      color: 'bg-slate-50 border-slate-200',
      buttonVariant: 'outline' as const,
      buttonText: 'Current Plan',
      buttonDisabled: true,
    },
    {
      name: 'Growth',
      description: 'For growing operations',
      price: '$29',
      period: 'per month',
      badge: 'Popular',
      color: 'bg-blue-50 border-blue-200 ring-2 ring-blue-500',
      buttonVariant: 'default' as const,
      buttonText: 'Upgrade Now',
      buttonDisabled: false,
    },
    {
      name: 'Pro',
      description: 'For enterprise scale',
      price: '$99',
      period: 'per month',
      badge: 'Best Value',
      color: 'bg-purple-50 border-purple-200',
      buttonVariant: 'default' as const,
      buttonText: 'Upgrade Now',
      buttonDisabled: false,
    },
  ];

  const features: PlanFeature[] = [
    { name: 'Staff Members', starter: '3', growth: '10', pro: 'Unlimited' },
    { name: 'Tables', starter: '10', growth: '50', pro: 'Unlimited' },
    { name: 'Multiple Sections', starter: false, growth: true, pro: true },
    { name: 'Premium Reports', starter: false, growth: true, pro: true },
    { name: 'Analytics Dashboard', starter: false, growth: true, pro: true },
    { name: 'Priority Support', starter: false, growth: false, pro: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
              <h1 className="text-2xl font-bold text-slate-900">Upgrade Your Plan</h1>
              <p className="text-sm text-slate-500">Choose the perfect plan for your cafeteria</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Plans Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start free and upgrade whenever you need more features. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card
                key={idx}
                className={`border-2 ${plan.color} overflow-hidden transition-all hover:shadow-lg ${
                  plan.badge ? 'md:scale-105' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl font-black text-slate-900">
                      {plan.name}
                    </CardTitle>
                    {plan.badge && (
                      <Badge className="bg-blue-500 text-white border-none font-bold text-xs uppercase">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-sm text-slate-600">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                      <span className="text-sm text-slate-500">/{plan.period}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={async () => {
                      if (plan.buttonDisabled || !user?.cafeteriaId) return;
                      
                      setLoadingPlan(plan.name.toLowerCase() as 'growth' | 'pro');
                      try {
                        const result = await checkoutMutation.mutateAsync({
                          plan: plan.name.toLowerCase() as 'growth' | 'pro',
                        });
                        // Redirect to Stripe Checkout
                        window.location.href = result.url;
                      } catch (error) {
                        console.error('Checkout error:', error);
                        alert('Failed to start checkout. Please try again.');
                        setLoadingPlan(null);
                      }
                    }}
                    disabled={plan.buttonDisabled || loadingPlan !== null}
                    variant={plan.buttonVariant}
                    className="w-full font-bold h-10"
                  >
                    {loadingPlan === plan.name.toLowerCase() ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>

                  {/* Features List */}
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    {features.map((feature, fIdx) => {
                      const value = feature[plan.name.toLowerCase() as keyof PlanFeature] as
                        | string
                        | boolean;
                      const isIncluded = value !== false;

                      return (
                        <div key={fIdx} className="flex items-start gap-3">
                          {isIncluded ? (
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{feature.name}</p>
                            {typeof value === 'string' && (
                              <p className="text-xs text-slate-500">{value}</p>
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
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900">Detailed Feature Comparison</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Growth</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-slate-900">Pro</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{feature.name}</td>
                    <td className="px-6 py-4 text-center">
                      {feature.starter === false ? (
                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-slate-700">{feature.starter}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {feature.growth === false ? (
                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-slate-700">{feature.growth}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {feature.pro === false ? (
                        <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-slate-700">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ / Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Flexible Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
              <p>
                No long-term contracts. Cancel anytime with no penalties.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Have questions about which plan is right for you?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://help.manus.im', '_blank')}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2024 Cafeteria Management System • All plans include core features</p>
        </div>
      </footer>
    </div>
  );
}
