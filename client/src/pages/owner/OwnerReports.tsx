import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, LayoutDashboard, Store, Users, Wallet, Settings,
  TrendingUp, Download, RefreshCw, Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Report {
  id: string;
  cafeteria_id: string;
  cafeteria_name?: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  period: string;
  created_at: string;
}

export default function OwnerReports() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const isRTL = language === 'ar';

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase.from('reports').select('*').order('created_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      toast.error(isRTL ? 'خطأ في تحميل التقارير' : 'Error loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = () => {
    const csv = [
      ['Cafeteria', 'Total Orders', 'Total Revenue', 'Average Order Value', 'Period'],
      ...reports.map(r => [
        r.cafeteria_name || r.cafeteria_id,
        r.total_orders,
        r.total_revenue,
        r.average_order_value,
        r.period
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = reports.reduce((acc, r) => acc + r.total_revenue, 0);
  const totalOrders = reports.reduce((acc, r) => acc + r.total_orders, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b-4 border-orange-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-3 rounded-xl shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRTL ? 'التقارير والإحصائيات' : 'Reports & Analytics'}
              </h1>
              <p className="text-xs text-orange-600 font-bold">{isRTL ? 'نظام المالك' : 'Owner System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchReports}
              className="h-10 w-10 text-slate-600 hover:text-orange-600"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{totalRevenue.toLocaleString()}</p>
              <p className="text-xs opacity-80">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{totalOrders}</p>
              <p className="text-xs opacity-80">{isRTL ? 'إجمالي الطلبات' : 'Total Orders'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{averageOrderValue.toFixed(2)}</p>
              <p className="text-xs opacity-80">{isRTL ? 'متوسط قيمة الطلب' : 'Avg Order Value'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md mb-6 bg-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>{isRTL ? 'من التاريخ' : 'From Date'}</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>{isRTL ? 'إلى التاريخ' : 'To Date'}</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={fetchReports}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRTL ? 'بحث' : 'Search'}
                </Button>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isRTL ? 'تصدير' : 'Export'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{isRTL ? 'لا توجد تقارير' : 'No reports found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{isRTL ? 'الكافيتريا' : 'Cafeteria'}</TableHead>
                      <TableHead>{isRTL ? 'الطلبات' : 'Orders'}</TableHead>
                      <TableHead>{isRTL ? 'الإيرادات' : 'Revenue'}</TableHead>
                      <TableHead>{isRTL ? 'متوسط الطلب' : 'Avg Order'}</TableHead>
                      <TableHead>{isRTL ? 'الفترة' : 'Period'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900">{report.cafeteria_name || report.cafeteria_id}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-none text-xs font-bold">
                            {report.total_orders}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {report.total_revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {report.average_order_value.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">{report.period}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(report.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
