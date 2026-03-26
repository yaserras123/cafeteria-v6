import React, { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { trpc } from '@/lib/trpc';
import { 
  LayoutDashboard, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  Activity, 
  CheckCircle2, 
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Store,
  Gift,
  Settings,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableQRManager } from '@/components/TableQRManager';
import { SystemTestTools } from '@/components/SystemTestTools';
import { SystemMonitorPanel } from '@/components/SystemMonitorPanel';
import { LaunchToolkitManager } from '@/components/LaunchToolkitManager';
import { PointsCalculator } from '@/components/PointsCalculator';

/**
 * OWNER DASHBOARD - CAFETERIA V2
 * Role: Admin / System Owner
 * Features: Recharge Approval, Withdrawal Approval, Global Reports, System Monitoring
 * RTL Support: Yes (via useTranslation hook)
 * Mobile Responsive: Yes (Tailwind CSS)
 */

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('recharges');
  const [globalFreeMonths, setGlobalFreeMonths] = useState<number>(0);
  const [specialFreeDays, setSpecialFreeDays] = useState<number>(30);
  const [targetRefCodes, setTargetRefCodes] = useState<string>('');
  const [grantReason, setGrantReason] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedRecharge, setSelectedRecharge] = useState<any>(null);

  // Handle scroll to show/hide scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verify user is admin
  if (!authLoading && user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-bold">Access Denied</p>
            <p className="text-sm text-gray-500 mt-2">Only system administrators can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch pending recharges
  const { data: rechargesData, isLoading: rechargesLoading } = trpc.recharges.getRequests.useQuery({ status: "pending" });
  const pendingRecharges = rechargesData?.requests;

  // Fetch pending withdrawals
  const { data: pendingWithdrawals, isLoading: withdrawalsLoading } = trpc.withdrawals.getRequests.useQuery({ status: "pending" });

  // Fetch global free months setting
  const { data: globalFreeConfig, refetch: refetchGlobalFree } = trpc.system.getGlobalFreeMonths.useQuery();
  
  // Update global free months mutation
  const updateGlobalFreeMutation = trpc.system.setGlobalFreeMonths.useMutation({
    onSuccess: () => {
      refetchGlobalFree();
      alert('Global free period updated successfully');
    }
  });

  // Grant special free period mutation
  const grantSpecialFreeMutation = trpc.system.grantSpecialFreePeriod.useMutation({
    onSuccess: (data) => {
      alert(`Successfully granted free period to ${data.processedCount} cafeterias`);
      setTargetRefCodes('');
      setGrantReason('');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  // Approve recharge mutation
  const approveRechargeMutation = trpc.recharges.approveRequest.useMutation({
    onSuccess: () => {
      setSelectedRecharge(null);
      // Invalidate the recharges query to refresh the list
      trpc.useUtils().recharges.getRequests.invalidate({ status: "pending" });
    }
  });

  // Approve withdrawal mutation
  const approveWithdrawalMutation = trpc.withdrawals.approveRequest.useMutation({
    onSuccess: () => {
      // Refresh data
    }
  });

  const isRTL = language === 'ar';

  return (
    <div className={`min-h-screen bg-gray-50 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <LayoutDashboard className="w-5 md:w-6 h-5 md:h-6 text-blue-600 flex-shrink-0" />
          <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">Owner Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
            className="px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs md:text-sm flex-shrink-0">A</div>
        </div>
      </header>

      <main className="p-3 md:p-8 max-w-7xl mx-auto pb-20">
        {/* System Monitor Panel */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">System Monitor</h2>
          <SystemMonitorPanel cafeteriaId={(user as any)?.cafeteriaId || "default-cafeteria-id"} />
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                  <TrendingUp className="w-5 md:w-6 h-5 md:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">Total Points Sold</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">125,400</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
                  <Store className="w-5 md:w-6 h-5 md:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">Active Cafeterias</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">84</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
                  <Users className="w-5 md:w-6 h-5 md:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">Total Marketers</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">32</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
                  <Activity className="w-5 md:w-6 h-5 md:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">System Health</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">99.9%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
<div className="w-full overflow-x-auto">
              <TabsList className="flex flex-nowrap gap-2 bg-gray-50 p-2 rounded-lg">
                <TabsTrigger value="recharges" className="whitespace-nowrap flex-shrink-0">Recharges</TabsTrigger>
                <TabsTrigger value="withdrawals" className="whitespace-nowrap flex-shrink-0">Withdrawals</TabsTrigger>
                <TabsTrigger value="free-periods" className="whitespace-nowrap flex-shrink-0">Free Periods</TabsTrigger>
                <TabsTrigger value="reports" className="whitespace-nowrap flex-shrink-0">Reports</TabsTrigger>
                <TabsTrigger value="qr-codes" className="whitespace-nowrap flex-shrink-0">QR Codes</TabsTrigger>
                <TabsTrigger value="launch-toolkit" className="whitespace-nowrap flex-shrink-0">Toolkit</TabsTrigger>
                <TabsTrigger value="test-tools" className="whitespace-nowrap flex-shrink-0">Tests</TabsTrigger>
              </TabsList>
            </div>

              <TabsContent value="recharges" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Approve Recharge Requests</h3>
                  
                  {selectedRecharge ? (
                    <div className="max-w-2xl mx-auto py-4">
                      <PointsCalculator
                        cafeteriaName={selectedRecharge.cafeteria?.name || "Cafeteria"}
                        cafeteriaCurrency={selectedRecharge.cafeteria?.currency || "USD"}
                        requestedAmount={selectedRecharge.amount}
                        isProcessing={approveRechargeMutation.isPending}
                        onCancel={() => setSelectedRecharge(null)}
                        onApprove={(data) => {
                          approveRechargeMutation.mutate({
                            rechargeRequestId: selectedRecharge.id,
                            approvedPoints: data.approvedPoints,
                            paidAmount: data.paidAmount,
                            paidCurrency: data.paidCurrency,
                            exchangeRateToUsd: data.exchangeRateToUsd,
                            pointsMultiplier: data.pointsMultiplier,
                            notes: `Paid ${data.paidAmount} ${data.paidCurrency} @ ${data.exchangeRateToUsd} USD/rate x ${data.pointsMultiplier} multiplier`
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      {rechargesLoading ? (
                        <p className="text-gray-500">Loading...</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="text-gray-400 text-sm border-b border-gray-100">
                                <th className="pb-3 font-medium">Cafeteria</th>
                                <th className="pb-3 font-medium">Amount</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {pendingRecharges?.map((req: any) => (
                                <tr key={req.id} className="text-sm">
                                  <td className="py-4 font-medium text-gray-900">{req.cafeteria?.name}</td>
                                  <td className="py-4 text-blue-600 font-bold">${req.amount}</td>
                                  <td className="py-4 text-gray-500">{new Date(req.createdAt).toLocaleString()}</td>
                                  <td className="py-4">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                                        onClick={() => setSelectedRecharge(req)}
                                        disabled={approveRechargeMutation.isPending}
                                      >
                                        <Calculator className="w-4 h-4" />
                                        Calculate & Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {}}
                                      >
                                        <XCircle className="w-5 h-5 text-red-600" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {(!pendingRecharges || pendingRecharges.length === 0) && (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-500">No pending recharge requests</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Approve Withdrawal Requests</h3>
                  {withdrawalsLoading ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingWithdrawals?.map((req: any) => (
                        <Card key={req.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Wallet className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-bold text-gray-900">{req.marketer?.name}</p>
                                  <p className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <span className="text-lg font-bold text-purple-600">${req.amount}</span>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => approveWithdrawalMutation.mutate({ withdrawalRequestId: req.id })}>Approve</Button>
                                  <Button size="sm" variant="outline">Reject</Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

	              <TabsContent value="free-periods" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Global Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-blue-600" />
                          Global Free Period Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                          Set the default free operation period (in months) for all newly created cafeterias.
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Free Months</label>
                            <input 
                              type="number" 
                              className="w-full p-2 border rounded mt-1"
                              value={globalFreeMonths || globalFreeConfig?.months || 0}
                              onChange={(e) => setGlobalFreeMonths(parseInt(e.target.value))}
                            />
                          </div>
                          <Button 
                            className="mt-5"
                            onClick={() => updateGlobalFreeMutation.mutate({ months: globalFreeMonths })}
                            disabled={updateGlobalFreeMutation.isPending}
                          >
                            Update
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Special Grant */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gift className="w-5 h-5 text-purple-600" />
                          Grant Special Free Period
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase">Cafeteria Reference Codes (comma separated)</label>
                          <textarea 
                            className="w-full p-2 border rounded h-20"
                            placeholder="e.g. CAF-001, CAF-002"
                            value={targetRefCodes}
                            onChange={(e) => setTargetRefCodes(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Duration (Days)</label>
                            <input 
                              type="number" 
                              className="w-full p-2 border rounded mt-1"
                              value={specialFreeDays}
                              onChange={(e) => setSpecialFreeDays(parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Reason (Optional)</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border rounded mt-1"
                              placeholder="Promotion, Support, etc."
                              value={grantReason}
                              onChange={(e) => setGrantReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => {
                            const codes = targetRefCodes.split(',').map(c => c.trim()).filter(c => c.length > 0);
                            if (codes.length === 0) return alert('Please enter at least one reference code');
                            grantSpecialFreeMutation.mutate({
                              referenceCodes: codes,
                              days: specialFreeDays,
                              reason: grantReason
                            });
                          }}
                          disabled={grantSpecialFreeMutation.isPending}
                        >
                          Grant Free Period
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-6">
	                <div className="text-center py-12">
	                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
	                  <p className="text-gray-500">Global commission reports loading...</p>
	                </div>
	              </TabsContent>

              <TabsContent value="qr-codes" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Generate Table QR Codes</h3>
                  <TableQRManager cafeteriaId={(user as any)?.cafeteriaId || "default-cafeteria-id"} />
                </div>
              </TabsContent>

<TabsContent value="launch-toolkit" className="mt-6">
	                <div className="space-y-4">
	                  <h3 className="text-lg font-bold text-gray-800">Launch Toolkit</h3>
	                  <LaunchToolkitManager />
	                </div>
	              </TabsContent>

	              <TabsContent value="test-tools" className="mt-6">
	                <div className="space-y-4">
	                  <h3 className="text-lg font-bold text-gray-800">System Test Tools</h3>
	                  <SystemTestTools cafeteriaId={(user as any)?.cafeteriaId || "default-cafeteria-id"} />
	                </div>
	              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </main>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 active:scale-95"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 md:w-6 h-5 md:h-6" />
        </button>
      )}
    </div>
  );
}
