import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardGrid } from '@/components/DashboardGrid';
import { 
  LayoutDashboard,
  Store,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * OWNER DASHBOARD - New Design with Grid Layout
 * Role: System Owner
 * Features: Manage Marketers, Cafeterias, Reports, System Settings
 * Mobile Responsive: Yes (Grid-based with large buttons)
 * RTL Support: Yes
 */
export default function OwnerDashboardNew() {
  const { user, loading: authLoading, logout } = useAuth();
  const { language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verify user is owner
  if (!authLoading && user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-bold">Access Denied</p>
            <p className="text-sm text-gray-500 mt-2">Only system owners can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRTL = language === 'ar';

  const dashboardItems = [
    {
      id: 'marketers',
      title: isRTL ? 'إدارة المسوقين' : 'Manage Marketers',
      description: isRTL ? 'إضافة وإدارة المسوقين' : 'Add and manage marketers',
      icon: Users,
      color: 'purple',
      href: '/dashboard/owner/marketers',
    },
    {
      id: 'cafeterias',
      title: isRTL ? 'إدارة الكافيتريات' : 'Manage Cafeterias',
      description: isRTL ? 'عرض وإدارة الكافيتريات' : 'View and manage cafeterias',
      icon: Store,
      color: 'green',
      href: '/dashboard/owner/cafeterias',
    },
    {
      id: 'points',
      title: isRTL ? 'إدارة النقاط' : 'Points Management',
      description: isRTL ? 'إدارة نقاط النظام' : 'Manage system points',
      icon: TrendingUp,
      color: 'blue',
      href: '/dashboard/owner/points',
    },
    {
      id: 'reports',
      title: isRTL ? 'التقارير' : 'Reports',
      description: isRTL ? 'عرض التقارير الشاملة' : 'View comprehensive reports',
      icon: BarChart3,
      color: 'teal',
      href: '/dashboard/owner/reports',
    },
    {
      id: 'recharges',
      title: isRTL ? 'طلبات الشحن' : 'Recharge Requests',
      description: isRTL ? 'الموافقة على طلبات الشحن' : 'Approve recharge requests',
      icon: TrendingUp,
      color: 'orange',
      href: '/dashboard/owner/recharges',
    },
    {
      id: 'settings',
      title: isRTL ? 'الإعدادات' : 'Settings',
      description: isRTL ? 'إعدادات النظام' : 'System settings',
      icon: Settings,
      color: 'gray',
      href: '/dashboard/owner/settings',
    },
  ];

  return (
    <div className={`min-h-screen bg-[#F5F1E9] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Custom Header based on Image */}
      <header className="bg-[#EFE7D9] px-6 py-4 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl">
             <Store className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 leading-tight">
              {isRTL ? 'كافيتريا السعادة' : 'Happiness Cafeteria'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500 font-bold">{isRTL ? 'مرحباً،' : 'Welcome,'}</p>
                <p className="text-sm font-black text-gray-800">{user?.name || 'ياسر'}</p>
             </div>
             <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md overflow-hidden">
                <Users className="w-6 h-6" />
             </div>
           </div>

           <div className="flex items-center gap-4 border-r border-gray-300 pr-4">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
                className="bg-transparent text-xs font-bold text-gray-700 cursor-pointer outline-none"
              >
                <option value="en">EN</option>
                <option value="ar">AR</option>
              </select>
              <button onClick={logout} className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-bold">{isRTL ? 'تسجيل خروج' : 'Logout'}</span>
              </button>
           </div>
        </div>
      </header>

      {/* Main Content - Large Grid Buttons */}
      <main className="max-w-md mx-auto px-6 py-10">
        <div className="grid grid-cols-2 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            const colors: Record<string, string> = {
              purple: 'bg-[#A855F7]',
              green: 'bg-[#22C55E]',
              blue: 'bg-[#3B82F6]',
              teal: 'bg-[#14B8A6]',
              orange: 'bg-[#F97316]',
              gray: 'bg-[#64748B]',
            };
            const bgColor = colors[item.color] || 'bg-blue-500';

            return (
              <button
                key={item.id}
                onClick={() => { window.location.href = item.href; }}
                className={`${bgColor} w-full aspect-square rounded-[32px] p-6 shadow-xl flex flex-col items-center justify-center gap-3 transform active:scale-95 transition-all duration-200 border-b-4 border-black/10`}
              >
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                   <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-black text-lg leading-tight">{item.title}</h3>
                  <p className="text-white/80 text-[10px] font-bold mt-1 line-clamp-1">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
