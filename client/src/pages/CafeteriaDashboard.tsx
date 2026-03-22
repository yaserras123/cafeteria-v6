import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Store, 
  Users, 
  Settings, 
  ShoppingCart, 
  TableIcon,
  Utensils,
  Wallet,
  FileText,
  Languages,
  LogOut,
  Plus,
  Lock,
  Zap,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { usePlanCheck } from '@/hooks/usePlanCheck';
import { UpgradeModal, FeatureGate } from '@/components/SubscriptionGating';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function CafeteriaDashboard() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [, setLocation] = useLocation();
  const cafeteriaId = user?.cafeteriaId;
  const { plan, limits } = usePlanCheck();

  // Queries
  const { data: cafeteriaInfo } = trpc.cafeterias.getInfo.useQuery(
    { cafeteriaId: cafeteriaId! },
    { enabled: !!cafeteriaId }
  );

  const { data: backendStaff = [] } = trpc.staff.getStaff.useQuery(
    { cafeteriaId: cafeteriaId! },
    { enabled: !!cafeteriaId }
  );

  const { data: backendTables = [] } = trpc.tables.getTables.useQuery(
    { cafeteriaId: cafeteriaId! },
    { enabled: !!cafeteriaId }
  );

  const { data: backendOrders = [] } = trpc.orders.getOrders.useQuery(
    { cafeteriaId: cafeteriaId! },
    { enabled: !!cafeteriaId, refetchInterval: 5000 }
  );

  const { data: backendItems = [] } = trpc.menu.getMenuItems.useQuery(
    { cafeteriaId: cafeteriaId! },
    { enabled: !!cafeteriaId }
  );

  // State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // Calculate stats
  const activeOrders = backendOrders.filter((o: any) => o.status === 'open').length;
  const totalRevenue = backendOrders
    .filter((o: any) => o.status === 'closed')
    .reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);

  // Quick action cards
  const quickActions = [
    {
      title: 'Menu',
      description: `${backendItems.length} items`,
      icon: Utensils,
      color: 'from-orange-500 to-orange-600',
      action: () => setLocation('/dashboard/cafeteria/menu'),
      badge: backendItems.length,
    },
    {
      title: 'Tables',
      description: `${backendTables.length} tables`,
      icon: TableIcon,
      color: 'from-blue-500 to-blue-600',
      action: () => setLocation('/dashboard/cafeteria/tables'),
      badge: backendTables.length,
    },
    {
      title: 'Staff',
      description: `${backendStaff.length}/${limits?.maxStaff || 'unlimited'}`,
      icon: Users,
      color: 'from-green-500 to-green-600',
      action: () => setLocation('/dashboard/cafeteria/staff'),
      badge: backendStaff.length,
      locked: backendStaff.length >= (limits?.maxStaff || 999),
    },
    {
      title: 'Orders',
      description: `${activeOrders} active`,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      action: () => setLocation('/dashboard/cafeteria/orders'),
      badge: activeOrders,
    },
    {
      title: 'Recharge',
      description: 'Request balance',
      icon: Wallet,
      color: 'from-pink-500 to-pink-600',
      action: () => setLocation('/dashboard/cafeteria/recharge'),
    },
    {
      title: 'Reports',
      description: 'Analytics & insights',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
      action: () => setLocation('/dashboard/cafeteria/reports'),
      locked: plan === 'starter',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-lg shadow-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {(cafeteriaInfo as any)?.name || 'Cafeteria'}
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                {plan.toUpperCase()} Plan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={(v) => setLanguage(v as 'ar' | 'en')}>
              <SelectTrigger className="w-[100px] h-10 border-slate-200">
                <Languages className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/dashboard/cafeteria/settings')}
                  className="h-10 w-10 text-slate-600 hover:text-slate-900"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-600 hover:text-red-600 font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Upgrade Banner */}
        {plan === 'starter' && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Unlock Premium Features</h3>
                  <p className="text-sm text-slate-600 mt-1">Upgrade to Growth to manage more staff, unlock detailed reports, and scale your operations.</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/upgrade')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold whitespace-nowrap"
              >
                Upgrade Now
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Orders</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{activeOrders}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">${totalRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Members</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{backendStaff.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menu Items</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{backendItems.length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Utensils className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            const isLocked = action.locked;

            return (
              <Card
                key={idx}
                className={`border-none shadow-md hover:shadow-xl transition-all cursor-pointer group overflow-hidden ${
                  isLocked ? 'opacity-75' : ''
                }`}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${action.color}`}
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`bg-gradient-to-br ${action.color} p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {action.badge !== undefined && (
                      <Badge className="bg-slate-100 text-slate-700 border-none font-bold">
                        {action.badge}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-slate-600 mb-6">{action.description}</p>

                  <Button
                    onClick={isLocked ? () => {
                      setUpgradeReason(`Upgrade to unlock ${action.title.toLowerCase()}`);
                      setShowUpgradeModal(true);
                    } : action.action}
                    className={`w-full font-bold ${
                      isLocked
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : `bg-gradient-to-r ${action.color} text-white hover:shadow-lg`
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Open
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {backendStaff.length === 0 && (
          <div className="mt-12 text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Get Started</h3>
            <p className="text-slate-600 mb-6">Add your first staff member to begin managing your cafeteria.</p>
            <Button
              onClick={() => setLocation('/dashboard/cafeteria/staff')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        )}
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />
    </div>
  );
}
