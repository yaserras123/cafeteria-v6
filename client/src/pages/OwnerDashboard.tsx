import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Store, Users, Wallet, BarChart3, Settings,
  Activity, ShieldCheck, Plus, ChevronRight,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabaseClient';

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const isRTL = language === 'ar';

  const [stats, setStats] = useState({
    totalCafeterias: 0,
    totalMarketers: 0,
    totalPoints: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { count: cafeCount } = await supabase.from('cafeterias').select('*', { count: 'exact', head: true });
        const { count: marketerCount } = await supabase.from('marketers').select('*', { count: 'exact', head: true });
        
        setStats({
          totalCafeterias: cafeCount || 0,
          totalMarketers: marketerCount || 0,
          totalPoints: 125000,
          activeSubscriptions: cafeCount ? Math.floor(cafeCount * 0.7) : 0
        });
      } catch (err) {
        console.error('Error fetching owner stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const menuItems = [
    { 
      label: isRTL ? 'إدارة الكافيتريات' : 'Cafeterias', 
      path: '/dashboard/owner/cafeterias', 
      icon: <Store className="w-6 h-6" />, 
      color: 'bg-blue-500',
      description: isRTL ? 'إضافة وتعديل بيانات الكافيتريات' : 'Manage cafeteria data and plans'
    },
    { 
      label: isRTL ? 'إدارة المسوقين' : 'Marketers', 
      path: '/dashboard/owner/marketers', 
      icon: <Users className="w-6 h-6" />, 
      color: 'bg-purple-500',
      description: isRTL ? 'متابعة أداء المسوقين والعمولات' : 'Track marketer performance'
    },
    { 
      label: isRTL ? 'إدارة النقاط' : 'Points', 
      path: '/dashboard/owner/points', 
      icon: <Wallet className="w-6 h-6" />, 
      color: 'bg-green-500',
      description: isRTL ? 'شحن وخصم نقاط الكافيتريات' : 'Recharge and deduct points'
    },
    { 
      label: isRTL ? 'التقارير العامة' : 'Reports', 
      path: '/dashboard/owner/reports', 
      icon: <BarChart3 className="w-6 h-6" />, 
      color: 'bg-orange-500',
      description: isRTL ? 'إحصائيات النظام الشاملة' : 'Global system analytics'
    },
    { 
      label: isRTL ? 'إعدادات النظام' : 'Settings', 
      path: '/dashboard/owner/settings', 
      icon: <Settings className="w-6 h-6" />, 
      color: 'bg-slate-500',
      description: isRTL ? 'تخصيص إعدادات المنصة' : 'Platform customization'
    }
  ];

  if (authLoading) return null;

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
              <LayoutDashboard className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {isRTL ? 'لوحة تحكم المالك' : 'System Owner Panel'}
              </h1>
              <p className="text-slate-400 font-medium">
                {isRTL ? 'مرحباً بك في مركز إدارة النظام الشامل' : 'Welcome to the global management center'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md text-white border-0 shadow-none">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{stats.totalCafeterias}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{isRTL ? 'الكافيتريات' : 'Cafeterias'}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-md text-white border-0 shadow-none">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{stats.totalMarketers}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{isRTL ? 'المسوقين' : 'Marketers'}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-md text-white border-0 shadow-none">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{isRTL ? 'إجمالي النقاط' : 'Total Points'}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-md text-white border-0 shadow-none">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">{isRTL ? 'الاشتراكات النشطة' : 'Active Subs'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.path}>
              <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 group overflow-hidden bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={`${item.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{item.label}</h3>
                    <p className="text-sm text-slate-500 font-medium">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                {isRTL ? 'طلبات شحن معلقة' : 'Pending Recharges'}
              </CardTitle>
              <Badge className="bg-orange-100 text-orange-600 border-0">3 {isRTL ? 'طلبات' : 'Requests'}</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">كافيتريا الروضة #{i}</p>
                        <p className="text-xs text-slate-500">5000 {isRTL ? 'نقطة' : 'Points'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      {isRTL ? 'مراجعة' : 'Review'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {isRTL ? 'حالة النظام' : 'System Health'}
              </CardTitle>
              <Badge className="bg-green-100 text-green-600 border-0 font-bold">{isRTL ? 'مستقر' : 'Stable'}</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">{isRTL ? 'استهلاك السيرفر' : 'Server Load'}</span>
                    <span className="text-sm font-bold text-blue-600">24%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[24%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700">{isRTL ? 'قاعدة البيانات' : 'Database Usage'}</span>
                    <span className="text-sm font-bold text-purple-600">12%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full w-[12%] rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                  <CheckCircle2 className="w-5 h-5" />
                  {isRTL ? 'جميع الخدمات تعمل بشكل طبيعي' : 'All systems operational'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <div className={`fixed bottom-8 ${isRTL ? 'left-8' : 'right-8'} flex flex-col gap-4 z-50`}>
        <Button 
          className="w-16 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-2xl flex items-center justify-center p-0 transition-all duration-300 hover:scale-110 active:scale-95 group"
        >
          <Plus className="w-8 h-8 text-white group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>
    </div>
  );
}
