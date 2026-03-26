import React, { useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { trpc } from '@/lib/trpc';
import { 
  LayoutDashboard, 
  TrendingUp,
  Users,
  Store,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * OWNER DASHBOARD - CAFETERIA V2
 * Role: Admin / System Owner
 * Features: Recharge Approval, Withdrawal Approval, Global Reports, System Monitoring
 * RTL Support: Yes (via useTranslation hook)
 * Mobile Responsive: Yes (Tailwind CSS)
 * Fixed: Scrollable Tabs for mobile compatibility
 */

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('recharges');
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

        {/* Main Content Tabs - Mobile Responsive */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Scrollable Tabs for Mobile */}
              <div className="w-full overflow-x-auto">
                <TabsList className="w-full flex flex-nowrap gap-2 bg-gray-50 p-2 rounded-lg">
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
                  
                  {rechargesLoading ? (
                    <p className="text-center text-gray-500">Loading recharge requests...</p>
                  ) : pendingRecharges && pendingRecharges.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRecharges.map((recharge: any) => (
                        <Card key={recharge.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900">{recharge.cafeteria?.name}</p>
                                <p className="text-sm text-gray-500">${recharge.amount}</p>
                              </div>
                              <Button onClick={() => setSelectedRecharge(recharge)} size="sm">
                                Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No pending recharge requests</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="withdrawals" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Approve Withdrawal Requests</h3>
                  {withdrawalsLoading ? (
                    <p className="text-center text-gray-500">Loading withdrawal requests...</p>
                  ) : pendingWithdrawals && pendingWithdrawals.length > 0 ? (
                    <div className="space-y-4">
                      {pendingWithdrawals.map((withdrawal: any) => (
                        <Card key={withdrawal.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900">{withdrawal.marketer?.name}</p>
                                <p className="text-sm text-gray-500">${withdrawal.amount}</p>
                              </div>
                              <Button 
                                onClick={() => approveWithdrawalMutation.mutate({ withdrawalRequestId: withdrawal.id })}
                                size="sm"
                              >
                                Approve
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No pending withdrawal requests</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="free-periods" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Free Periods Management</h3>
                  <p className="text-sm text-gray-500">Manage global and special free periods for cafeterias</p>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Global Reports</h3>
                  <p className="text-sm text-gray-500">View system-wide reports and analytics</p>
                </div>
              </TabsContent>

              <TabsContent value="qr-codes" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">QR Code Management</h3>
                  <p className="text-sm text-gray-500">QR Code management features coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="launch-toolkit" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Launch Toolkit</h3>
                  <p className="text-sm text-gray-500">Launch toolkit features coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="test-tools" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">System Test Tools</h3>
                  <p className="text-sm text-gray-500">System test tools coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
