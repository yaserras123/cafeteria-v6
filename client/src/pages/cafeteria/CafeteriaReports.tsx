import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, LayoutDashboard, UtensilsCrossed, Table2, Users, CreditCard, Settings,
  TrendingUp, DollarSign, ShoppingCart, Clock, Download, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface OrderSummary {
  id: string;
  tableNumber?: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  closedAt?: string;
  itemsCount: number;
}

interface TopItem {
  name: string;
  count: number;
  revenue: number;
}

export default function CafeteriaReports() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  const cafeteriaId = user?.cafeteriaId;

  const navigationItems = [
    { label: isRTL ? 'لوحة التحكم' : 'Dashboard', path: '/dashboard/cafeteria-admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: isRTL ? 'المنيو' : 'Menu', path: '/dashboard/cafeteria-admin/menu', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { label: isRTL ? 'الطاولات' : 'Tables', path: '/dashboard/cafeteria-admin/tables', icon: <Table2 className="w-5 h-5" /> },
    { label: isRTL ? 'الموظفين' : 'Staff', path: '/dashboard/cafeteria-admin/staff', icon: <Users className="w-5 h-5" /> },
    { label: isRTL ? 'التقارير' : 'Reports', path: '/dashboard/cafeteria-admin/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: isRTL ? 'شحن النقاط' : 'Recharge', path: '/dashboard/cafeteria-admin/recharge', icon: <CreditCard className="w-5 h-5" /> },
    { label: isRTL ? 'الإعدادات' : 'Settings', path: '/dashboard/cafeteria-admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start.setHours(0, 0, 0, 0);
    }
    return { start: start.toISOString(), end: now.toISOString() };
  };

  const fetchReports = async () => {
    if (!cafeteriaId) return;
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, cafeteria_tables(table_number), order_items(*, menu_items(name, price))')
        .eq('cafeteria_id', cafeteriaId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const mappedOrders: OrderSummary[] = (ordersData || []).map((o: any) => ({
        id: o.id,
        tableNumber: o.cafeteria_tables?.table_number,
        status: o.status,
        totalAmount: Number(o.total_amount || 0),
        createdAt: o.created_at,
        closedAt: o.closed_at,
        itemsCount: (o.order_items || []).length,
      }));
      setOrders(mappedOrders);

      // Calculate top items
      const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      (ordersData || []).forEach((o: any) => {
        (o.order_items || []).forEach((item: any) => {
          const name = item.menu_items?.name || 'Unknown';
          if (!itemCounts[name]) {
            itemCounts[name] = { name, count: 0, revenue: 0 };
          }
          itemCounts[name].count += item.quantity || 1;
          itemCounts[name].revenue += Number(item.total_price || 0);
        });
      });
      const sortedItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setTopItems(sortedItems);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      toast.error(isRTL ? 'خطأ في تحميل التقارير' : 'Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [cafeteriaId, period]);

  const totalRevenue = orders.filter(o => o.status === 'closed').reduce((s, o) => s + o.totalAmount, 0);
  const closedOrders = orders.filter(o => o.status === 'closed').length;
  const openOrders = orders.filter(o => o.status === 'open').length;
  const avgOrderValue = closedOrders > 0 ? totalRevenue / closedOrders : 0;

  const periodLabels: Record<string, { en: string; ar: string }> = {
    today: { en: 'Today', ar: 'اليوم' },
    week: { en: 'Last 7 Days', ar: 'آخر 7 أيام' },
    month: { en: 'This Month', ar: 'هذا الشهر' },
    year: { en: 'This Year', ar: 'هذا العام' },
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; labelAr: string; color: string }> = {
      open: { label: 'Open', labelAr: 'مفتوح', color: 'bg-blue-100 text-blue-700' },
      closed: { label: 'Closed', labelAr: 'مغلق', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelled', labelAr: 'ملغي', color: 'bg-red-100 text-red-700' },
    };
    const s = map[status] || map.open;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{isRTL ? s.labelAr : s.label}</span>;
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader showBackButton={true} showHomeButton={true}
        title={isRTL ? 'التقارير والإحصائيات' : 'Reports & Analytics'}
        icon={<BarChart3 className="w-5 h-5" />}
        onMenuToggle={setMenuOpen}
        menuOpen={menuOpen}
      />
      <div className="flex">
        <DashboardNavigation items={navigationItems} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              {isRTL ? periodLabels[period].ar : periodLabels[period].en}
            </h2>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{isRTL ? 'اليوم' : 'Today'}</SelectItem>
                  <SelectItem value="week">{isRTL ? 'آخر 7 أيام' : 'Last 7 Days'}</SelectItem>
                  <SelectItem value="month">{isRTL ? 'هذا الشهر' : 'This Month'}</SelectItem>
                  <SelectItem value="year">{isRTL ? 'هذا العام' : 'This Year'}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchReports} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {isRTL ? 'تحديث' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">{isRTL ? 'الطلبات المكتملة' : 'Completed Orders'}</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{closedOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500">{isRTL ? 'طلبات مفتوحة' : 'Open Orders'}</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{openOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500">{isRTL ? 'متوسط قيمة الطلب' : 'Avg Order Value'}</p>
                </div>
                <p className="text-2xl font-bold text-gray-800">{avgOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders">
            <TabsList className="mb-4">
              <TabsTrigger value="orders">{isRTL ? 'الطلبات' : 'Orders'}</TabsTrigger>
              <TabsTrigger value="top-items">{isRTL ? 'الأصناف الأكثر طلباً' : 'Top Items'}</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    {isRTL ? 'سجل الطلبات' : 'Orders Log'} ({orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-8 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>{isRTL ? 'لا توجد طلبات في هذه الفترة' : 'No orders in this period'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>{isRTL ? 'رقم الطلب' : 'Order ID'}</TableHead>
                            <TableHead>{isRTL ? 'الطاولة' : 'Table'}</TableHead>
                            <TableHead>{isRTL ? 'الأصناف' : 'Items'}</TableHead>
                            <TableHead>{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                            <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-gray-50">
                              <TableCell className="font-mono text-xs text-gray-600">#{order.id.slice(0, 8)}</TableCell>
                              <TableCell className="font-medium">
                                {order.tableNumber ? (isRTL ? `طاولة ${order.tableNumber}` : `Table ${order.tableNumber}`) : '-'}
                              </TableCell>
                              <TableCell className="text-gray-600">{order.itemsCount}</TableCell>
                              <TableCell className="font-semibold text-green-700">{order.totalAmount.toFixed(2)}</TableCell>
                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                              <TableCell className="text-gray-500 text-sm">
                                {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Items Tab */}
            <TabsContent value="top-items">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    {isRTL ? 'الأصناف الأكثر طلباً' : 'Top Selling Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-8 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
                  ) : topItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>{isRTL ? '#' : '#'}</TableHead>
                            <TableHead>{isRTL ? 'الصنف' : 'Item'}</TableHead>
                            <TableHead>{isRTL ? 'عدد الطلبات' : 'Orders Count'}</TableHead>
                            <TableHead>{isRTL ? 'الإيرادات' : 'Revenue'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topItems.map((item, index) => (
                            <TableRow key={item.name} className="hover:bg-gray-50">
                              <TableCell>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  index === 1 ? 'bg-gray-100 text-gray-700' :
                                  index === 2 ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-50 text-blue-600'
                                }`}>
                                  {index + 1}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-gray-800">{item.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[100px]">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{ width: `${(item.count / (topItems[0]?.count || 1)) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-700 font-medium">{item.count}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold text-green-700">{item.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
