import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { ActionButton, ActionGrid } from '@/components/ActionButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Store,
  Plus,
  Edit,
  Eye,
  Trash2,
  Search,
  LayoutDashboard,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Calculator,
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function OwnerCafeterias() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isRTL = language === 'ar';

  // Mock data - replace with actual API call
  const cafeterias = [
    {
      id: '1',
      name: 'Cafe Downtown',
      referenceCode: 'P10010101',
      points: 5000,
      status: 'active',
      marketerId: 'MKT001',
    },
    {
      id: '2',
      name: 'Cafe Mall',
      referenceCode: 'P10010102',
      points: 3500,
      status: 'active',
      marketerId: 'MKT001',
    },
    {
      id: '3',
      name: 'Cafe Airport',
      referenceCode: 'P10010103',
      points: 2000,
      status: 'inactive',
      marketerId: 'MKT002',
    },
  ];

  const navigationItems = [
    {
      label: isRTL ? 'لوحة التحكم' : 'Dashboard',
      path: '/dashboard/owner',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: isRTL ? 'الكافيتريات' : 'Cafeterias',
      path: '/dashboard/owner/cafeterias',
      icon: <Store className="w-5 h-5" />,
    },
    {
      label: isRTL ? 'المسوقين' : 'Marketers',
      path: '/dashboard/owner/marketers',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: isRTL ? 'النقاط' : 'Points',
      path: '/dashboard/owner/points',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      label: isRTL ? 'التقارير' : 'Reports',
      path: '/dashboard/owner/reports',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: isRTL ? 'الإعدادات' : 'Settings',
      path: '/dashboard/owner/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const filteredCafeterias = cafeterias.filter((cafe) =>
    cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cafe.referenceCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!authLoading && user?.role !== 'owner') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-bold">{isRTL ? 'تم رفض الوصول' : 'Access Denied'}</p>
            <p className="text-sm text-gray-500 mt-2">
              {isRTL ? 'فقط مالك النظام يمكنه الوصول إلى هذه الصفحة' : 'Only system owner can access this page.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader
        title={isRTL ? 'إدارة الكافيتريات' : 'Manage Cafeterias'}
        icon={<Store className="w-5 h-5" />}
        onMenuToggle={setMenuOpen}
        menuOpen={menuOpen}
      />

      <div className="flex">
        <DashboardNavigation
          items={navigationItems}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 pb-20">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={isRTL ? 'ابحث عن كافيتريا...' : 'Search cafeteria...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Cafeterias Grid */}
          <div className="space-y-4">
            {filteredCafeterias.map((cafe) => (
              <Card key={cafe.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cafe.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {isRTL ? 'الرقم المرجعي' : 'Reference'}: {cafe.referenceCode}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        cafe.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cafe.status === 'active'
                        ? isRTL
                          ? 'نشط'
                          : 'Active'
                        : isRTL
                        ? 'غير نشط'
                        : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">
                        {isRTL ? 'النقاط' : 'Points'}
                      </p>
                      <p className="text-lg font-bold text-blue-600">{cafe.points.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">
                        {isRTL ? 'المسوق' : 'Marketer'}
                      </p>
                      <p className="text-lg font-bold text-purple-600">{cafe.marketerId}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-12 flex flex-col items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">{isRTL ? 'عرض' : 'View'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-12 flex flex-col items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-xs">{isRTL ? 'تعديل' : 'Edit'}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-12 flex flex-col items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs">{isRTL ? 'حذف' : 'Delete'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCafeterias.length === 0 && (
            <Card className="text-center py-12">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {isRTL ? 'لا توجد كافيتريات' : 'No cafeterias found'}
              </p>
            </Card>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {}}
        className={`fixed bottom-6 ${
          isRTL ? 'left-6' : 'right-6'
        } w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 active:scale-90 z-20`}
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
