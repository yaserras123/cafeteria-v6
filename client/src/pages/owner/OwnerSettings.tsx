import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Settings, LayoutDashboard, Store, Users, Wallet, BarChart3,
  Lock, Bell, Globe, Shield, RefreshCw, Save
} from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerSettings() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
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
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
    } catch (err) {
      toast.error(isRTL ? 'خطأ في حفظ الإعدادات' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
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
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-md border-0">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'عام' : 'General'}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'الأمان' : 'Security'}</span>
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
                    <p className="text-sm text-gray-600">{isRTL ? 'تفعيل المصادقة الثنائية لحسابك' : 'Enable 2FA for your account'}</p>
                  </div>
                  <Switch
                    checked={settings.twoFactor}
                    onCheckedChange={(checked) => setSettings({ ...settings, twoFactor: checked })}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</Label>
                  <Button variant="outline" className="w-full gap-2">
                    <Lock className="w-4 h-4" />
                    {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isRTL ? 'الإشعارات العامة' : 'General Notifications'}</p>
                    <p className="text-sm text-gray-600">{isRTL ? 'استقبل إشعارات عن الأنشطة المهمة' : 'Receive notifications about important activities'}</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{isRTL ? 'تنبيهات البريد الإلكتروني' : 'Email Alerts'}</p>
                    <p className="text-sm text-gray-600">{isRTL ? 'استقبل تنبيهات عبر البريد الإلكتروني' : 'Receive email alerts'}</p>
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
                    <p className="text-sm text-gray-600">{isRTL ? 'تفعيل وضع الصيانة لإيقاف النظام مؤقتاً' : 'Enable maintenance mode to pause the system'}</p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                  />
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900">{isRTL ? 'معلومات النظام' : 'System Information'}</p>
                  <div className="mt-2 space-y-1 text-sm text-blue-800">
                    <p>{isRTL ? 'الإصدار' : 'Version'}: v2.0.0</p>
                    <p>{isRTL ? 'آخر تحديث' : 'Last Update'}: {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
                    <p>{isRTL ? 'حالة النظام' : 'System Status'}: <span className="text-green-600 font-bold">{isRTL ? 'نشط' : 'Active'}</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? '...' : (isRTL ? 'حفظ الإعدادات' : 'Save Settings')}
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Lock className="w-4 h-4" />
            {isRTL ? 'تسجيل الخروج' : 'Logout'}
          </Button>
        </div>
      </main>
    </div>
  );
}
