import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardGrid } from '@/components/DashboardGrid';
import { 
  LayoutDashboard,
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * WAITER DASHBOARD - New Design with Grid Layout
 * Role: Waiter/Server
 * Features: Take Orders, View Active Orders, Process Payments
 * Mobile Responsive: Yes (Grid-based with large buttons)
 * RTL Support: Yes
 */
export default function WaiterDashboardNew() {
  const { user, loading: authLoading, logout } = useAuth();
  const { language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verify user is waiter
  if (!authLoading && user?.role !== 'waiter') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-bold">Access Denied</p>
            <p className="text-sm text-gray-500 mt-2">Only waiters can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRTL = language === 'ar';

  const dashboardItems = [
    {
      id: 'new-order',
      title: isRTL ? 'طلب جديد' : 'New Order',
      description: isRTL ? 'إنشاء طلب جديد' : 'Create a new order',
      icon: ShoppingCart,
      color: 'blue',
      href: '/dashboard/waiter/new-order',
    },
    {
      id: 'active-orders',
      title: isRTL ? 'الطلبات النشطة' : 'Active Orders',
      description: isRTL ? 'عرض الطلبات الجارية' : 'View active orders',
      icon: Clock,
      color: 'orange',
      href: '/dashboard/waiter/active-orders',
    },
    {
      id: 'completed-orders',
      title: isRTL ? 'الطلبات المكتملة' : 'Completed Orders',
      description: isRTL ? 'عرض الطلبات المنتهية' : 'View completed orders',
      icon: CheckCircle,
      color: 'green',
      href: '/dashboard/waiter/completed-orders',
    },
    {
      id: 'payment',
      title: isRTL ? 'الدفع' : 'Payment',
      description: isRTL ? 'معالجة الدفع' : 'Process payment',
      icon: DollarSign,
      color: 'teal',
      href: '/dashboard/waiter/payment',
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {isRTL ? 'لوحة تحكم النادل' : 'Waiter Dashboard'}
            </h1>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-4">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'W'}
            </div>
            <Button 
              onClick={logout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isRTL ? 'تسجيل خروج' : 'Logout'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white p-4 space-y-3">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <Button 
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              variant="outline"
              size="sm"
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isRTL ? 'تسجيل خروج' : 'Logout'}
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {isRTL ? `مرحباً ${user?.name || 'النادل'}` : `Welcome ${user?.name || 'Waiter'}`}
          </h2>
          <p className="text-gray-600">
            {isRTL ? 'اختر من الخيارات أدناه لإدارة الطلبات' : 'Select an option below to manage orders'}
          </p>
        </div>

        {/* Dashboard Grid */}
        <DashboardGrid items={dashboardItems} columns={2} />
      </main>
    </div>
  );
}
