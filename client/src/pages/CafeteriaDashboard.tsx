import { useState } from 'react';
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
  ChevronRight,
  Bell,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Phone,
  Hash,
  Key,
  ToggleLeft,
  ToggleRight,
  User,
  DollarSign,
  Coins,
  TrendingUp
} from 'lucide-react';
import { usePlanCheck } from '@/hooks/usePlanCheck';
import { UpgradeModal } from '@/components/SubscriptionGating';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // Calculate stats
  const activeOrders = backendOrders.filter((o: any) => o.status === 'open').length;
  const totalRevenue = backendOrders
    .filter((o: any) => o.status === 'closed')
    .reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);

  // Main action grid
  const mainActions = [
    {
      title: 'Menu',
      icon: Utensils,
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      count: backendItems.length,
      action: () => setLocation('/dashboard/cafeteria/menu'),
    },
    {
      title: 'Dashboard',
      icon: TrendingUp,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      count: activeOrders,
      action: () => setActiveTab('overview'),
    },
    {
      title: 'Staff',
      icon: Users,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      count: backendStaff.length,
      action: () => setActiveTab('staff'),
    },
    {
      title: 'Tables',
      icon: TableIcon,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      count: backendTables.length,
      action: () => setActiveTab('tables'),
    },
    {
      title: 'Orders',
      icon: ShoppingCart,
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50',
      count: activeOrders,
      action: () => setActiveTab('orders'),
    },
    {
      title: 'Reports',
      icon: FileText,
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-50',
      locked: plan === 'starter',
      action: () => {
        if (plan === 'starter') {
          setUpgradeReason('Unlock detailed reports and analytics');
          setShowUpgradeModal(true);
        } else {
          setActiveTab('reports');
        }
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20">
      {/* Header */}
      <header className="bg-white border-b-4 border-blue-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {(cafeteriaInfo as any)?.name || 'Cafeteria'}
              </h1>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                {plan.toUpperCase()} Plan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Bell className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-12 w-12 text-slate-600 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upgrade Banner */}
        {plan === 'starter' && (
          <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
            <CardContent className="p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <Zap className="w-8 h-8" />
                <div>
                  <h3 className="font-black text-lg">Unlock Premium</h3>
                  <p className="text-sm text-blue-100">More staff, detailed reports & more</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation('/upgrade')}
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
              >
                Upgrade
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="bg-purple-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Orders</p>
              <p className="text-4xl font-black text-purple-600 mt-2">{activeOrders}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="bg-green-500 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Revenue</p>
              <p className="text-4xl font-black text-green-600 mt-2">${totalRevenue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 px-2">Quick Access</h2>
          <div className="grid grid-cols-2 gap-4">
            {mainActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Card
                  key={idx}
                  onClick={action.action}
                  className={`border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden ${
                    action.locked ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`h-3 bg-gradient-to-r ${action.color}`} />
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${action.color} shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-black text-lg text-slate-900">{action.title}</h3>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-base px-3 py-1">
                        {action.count}
                      </Badge>
                      {action.locked && <Lock className="w-4 h-4 text-amber-500" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Tabs for detailed views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-slate-200 rounded-xl p-1 shadow-md">
            <TabsTrigger value="overview" className="text-xs font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-xs font-bold data-[state=active]:bg-green-500 data-[state=active]:text-white rounded-lg">
              Staff
            </TabsTrigger>
            <TabsTrigger value="tables" className="text-xs font-bold data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-lg">
              Tables
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs font-bold data-[state=active]:bg-pink-500 data-[state=active]:text-white rounded-lg">
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-4 border-blue-500">
                <CardTitle className="text-xl font-black text-slate-900">Welcome Back!</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-600 mb-4">Your cafeteria is running smoothly. Here's what's happening today:</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <span className="font-bold text-slate-900">Active Orders</span>
                    <span className="text-2xl font-black text-purple-600">{activeOrders}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <span className="font-bold text-slate-900">Staff On Duty</span>
                    <span className="text-2xl font-black text-green-600">{backendStaff.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                    <span className="font-bold text-slate-900">Menu Items</span>
                    <span className="text-2xl font-black text-orange-600">{backendItems.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-4 border-green-500 flex items-center justify-between">
                <CardTitle className="text-xl font-black text-slate-900">Staff Members</CardTitle>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={() => setLocation('/dashboard/cafeteria/staff')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {backendStaff.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">No staff members yet</p>
                    <Button
                      onClick={() => setLocation('/dashboard/cafeteria/staff')}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      Add First Staff
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backendStaff.slice(0, 5).map((staff: any) => (
                      <div key={staff.id} className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                            {staff.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{staff.name}</p>
                            <p className="text-xs text-slate-600 uppercase font-semibold">{staff.role}</p>
                          </div>
                        </div>
                        <Badge className={`${staff.status === 'active' ? 'bg-green-500' : 'bg-slate-300'} text-white border-none font-bold`}>
                          {staff.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-4 border-purple-500 flex items-center justify-between">
                <CardTitle className="text-xl font-black text-slate-900">Tables</CardTitle>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  onClick={() => setLocation('/dashboard/cafeteria/tables')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {backendTables.length === 0 ? (
                  <div className="text-center py-12">
                    <TableIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">No tables yet</p>
                    <Button
                      onClick={() => setLocation('/dashboard/cafeteria/tables')}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                      Create First Table
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {backendTables.slice(0, 6).map((table: any) => (
                      <div
                        key={table.id}
                        className={`p-4 rounded-xl border-2 text-center font-bold ${
                          table.status === 'available'
                            ? 'bg-green-50 border-green-300 text-green-700'
                            : table.status === 'occupied'
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                        }`}
                      >
                        Table {table.tableNumber}
                        <p className="text-xs mt-1">{table.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6 mt-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b-4 border-pink-500">
                <CardTitle className="text-xl font-black text-slate-900">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {activeOrders === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">No active orders</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backendOrders
                      .filter((o: any) => o.status === 'open')
                      .slice(0, 5)
                      .map((order: any) => (
                        <div key={order.id} className="p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border-2 border-pink-200 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">Order #{order.id}</p>
                            <p className="text-xs text-slate-600">{order.items?.length || 0} items</p>
                          </div>
                          <Badge className="bg-pink-500 text-white border-none font-bold">
                            ${Number(order.totalAmount || 0).toFixed(2)}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Settings Card */}
        <Card className="border-0 shadow-lg mb-12">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-4 border-slate-400">
            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div className="flex items-center gap-3">
                <Languages className="w-6 h-6 text-slate-600" />
                <span className="font-bold text-slate-900">Language</span>
              </div>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'ar' | 'en')}>
                <SelectTrigger className="w-[120px] border-2 border-slate-300 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setLocation('/dashboard/cafeteria/settings')}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold h-14 text-lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Full Settings
            </Button>
          </CardContent>
        </Card>
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
