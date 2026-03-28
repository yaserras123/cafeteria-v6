import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Settings, LayoutDashboard, Store, Users, Wallet, BarChart3,
  Lock, Bell, Globe, Shield, RefreshCw, Save, ArrowLeft, Home, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function OwnerSettings() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
  const [, setLocation] = useLocation();
  const isRTL = language === 'ar';

  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'Cafeteria System',
    email: user?.email || '',
    phone: '+966 50 000 0000',
    address: 'Riyadh, Saudi Arabia',
    notifications: true,
    emailAlerts: true,
    twoFactor: false,
    maintenanceMode: false,
    defaultFreePeriodMonths: 1,
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save system configuration
      const { error } = await supabase
        .from('system_configs')
        .upsert({
          id: crypto.randomUUID ? crypto.randomUUID() : undefined,
          key: 'default_free_period_months',
          value: settings.defaultFreePeriodMonths.toString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      
      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حفظ الإعدادات' : 'Error saving settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b-4 border-slate-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-500 to-slate-700 p-3 rounded-xl shadow-lg">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRTL ? 'الإعدادات' : 'Settings'}
              </h1>
              <p className="text-xs text-slate-600 font-bold">{isRTL ? 'نظام المالك' : 'Owner System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard/owner')}
              className="h-10 w-10 text-slate-600 hover:text-slate-800"
              title={isRTL ? 'العودة للخلف' : 'Go Back'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard/owner')}
              className="h-10 w-10 text-slate-600 hover:text-slate-800"
              title={isRTL ? 'الصفحة الرئيسية' : 'Home'}
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-md border-0">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'عام' : 'General'}</span>
            </TabsTrigger>
            <TabsTrigger value="freePeriod" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'فترة مجانية' : 'Free Period'}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'أمان' : 'Security'}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'إشعارات' : 'Notifications'}</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'نظام' : 'System'}</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{isRTL ? 'معلومات الشركة' : 'Company Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isRTL ? 'اسم الشركة' : 'Company Name'}</Label>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    placeholder={isRTL ? 'اسم الشركة' : 'Company name'}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'الهاتف' : 'Phone'}</Label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder={isRTL ? 'رقم الهاتف' : 'Phone number'}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'العنوان' : 'Address'}</Label>
                  <Input
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder={isRTL ? 'العنوان' : 'Address'}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'اللغة' : 'Language'}</Label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Free Period Settings */}
          <TabsContent value="freePeriod" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات الفترة المجانية' : 'Free Period Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    {isRTL 
                      ? 'حدد عدد الأشهر المجانية الافتراضية التي سيتم منحها للكافيتريات الجديدة عند الإنشاء'
                      : 'Set the default number of free months to be granted to new cafeterias upon creation'
                    }
                  </p>
                </div>
                <div>
                  <Label>{isRTL ? 'عدد الأشهر المجانية الافتراضية' : 'Default Free Months'}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="12"
                    value={settings.defaultFreePeriodMonths}
                    onChange={(e) => setSettings({ ...settings, defaultFreePeriodMonths: parseInt(e.target.value) || 0 })}
                    placeholder={isRTL ? 'عدد الأشهر' : 'Number of months'}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {isRTL 
                      ? `سيتم منح ${settings.defaultFreePeriodMonths} شهر مجاني لكل كافيتريا جديدة`
                      : `New cafeterias will receive ${settings.defaultFreePeriodMonths} month(s) free`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات الأمان' : 'Security Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isRTL ? 'المصادقة الثنائية' : 'Two-Factor Authentication'}</p>
                    <p className="text-sm text-gray-600">{isRTL ? 'تفعيل المصادقة الثنائية' : 'Enable two-factor authentication'}</p>
                  </div>
                  <Switch
                    checked={settings.twoFactor}
                    onCheckedChange={(checked) => setSettings({ ...settings, twoFactor: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isRTL ? 'الإشعارات' : 'Notifications'}</p>
                    <p className="text-sm text-gray-600">{isRTL ? 'تفعيل الإشعارات' : 'Enable notifications'}</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isRTL ? 'تنبيهات البريد الإلكتروني' : 'Email Alerts'}</p>
                    <p className="text-sm text-gray-600">{isRTL ? 'تفعيل تنبيهات البريد الإلكتروني' : 'Enable email alerts'}</p>
                  </div>
                  <Switch
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات النظام' : 'System Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isRTL ? 'وضع الصيانة' : 'Maintenance Mode'}</p>
                    <p className="text-sm text-gray-600">{isRTL ? 'تفعيل وضع الصيانة' : 'Enable maintenance mode'}</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">{isRTL ? 'حسابك' : 'Your Account'}</p>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full"
                  >
                    {isRTL ? 'تسجيل الخروج' : 'Logout'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard/owner')}
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-slate-600 hover:bg-slate-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '...' : (isRTL ? 'حفظ' : 'Save')}
          </Button>
        </div>
      </main>
    </div>
  );
}
