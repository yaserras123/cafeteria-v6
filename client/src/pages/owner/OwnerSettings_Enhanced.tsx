import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Settings, LayoutDashboard, Store, Users, Wallet, BarChart3,
  Lock, Bell, Globe, Shield, RefreshCw, Save, ArrowLeft, Home, Clock, Download, Trash2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export default function OwnerSettingsEnhanced() {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
  const [, setLocation] = useLocation();
  const isRTL = language === 'ar';

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
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

  const handleExportData = async () => {
    setExporting(true);
    try {
      // Fetch all data
      const [marketersData, cafeteriasData, rechargeData] = await Promise.all([
        supabase.from('marketers').select('*'),
        supabase.from('cafeterias').select('*'),
        supabase.from('recharge_requests').select('*'),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        owner: user?.email,
        marketers: marketersData.data || [],
        cafeterias: cafeteriasData.data || [],
        rechargeRequests: rechargeData.data || [],
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cafeteria_data_${new Date().getTime()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(isRTL ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تصدير البيانات' : 'Error exporting data'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error(isRTL ? 'أدخل "DELETE" للتأكيد' : 'Type "DELETE" to confirm');
      return;
    }

    try {
      // Delete all related data
      const userId = user?.id;
      
      // Delete marketers
      await supabase.from('marketers').delete().eq('id', userId);
      
      // Delete cafeterias
      await supabase.from('cafeterias').delete().eq('marketerId', userId);
      
      // Delete user from auth
      await supabase.auth.admin.deleteUser(userId);

      toast.success(isRTL ? 'تم حذف الحساب بنجاح' : 'Account deleted successfully');
      
      // Logout and redirect
      await logout();
      setLocation('/login');
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الحساب' : 'Error deleting account'));
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/dashboard/owner')}
              className="h-10 w-10 text-slate-600 hover:text-slate-800"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-md border-0">
            <TabsTrigger value="general" className="gap-2 text-xs md:text-sm">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'عام' : 'General'}</span>
            </TabsTrigger>
            <TabsTrigger value="freePeriod" className="gap-2 text-xs md:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'فترة مجانية' : 'Free Period'}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 text-xs md:text-sm">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'أمان' : 'Security'}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-xs md:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'إشعارات' : 'Notifications'}</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2 text-xs md:text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'تصدير' : 'Export'}</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-2 text-xs md:text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">{isRTL ? 'خطر' : 'Danger'}</span>
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
                    disabled
                    className="bg-slate-50"
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
                <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {isRTL ? 'حفظ' : 'Save'}
                </Button>
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
                <div>
                  <Label>{isRTL ? 'عدد الأشهر المجانية الافتراضية' : 'Default Free Months'}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="12"
                    value={settings.defaultFreePeriodMonths}
                    onChange={(e) => setSettings({ ...settings, defaultFreePeriodMonths: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-slate-500 mt-2">{isRTL ? 'عدد الأشهر المجانية الممنوحة للكافيتريات الجديدة' : 'Number of free months granted to new cafeterias'}</p>
                </div>
                <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {isRTL ? 'حفظ' : 'Save'}
                </Button>
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">{isRTL ? 'تحديثات الأمان ستأتي قريباً' : 'Security updates coming soon'}</p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  <Lock className="w-4 h-4 mr-2" />
                  {isRTL ? 'تسجيل الخروج' : 'Logout'}
                </Button>
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
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">{isRTL ? 'إعدادات الإشعارات ستأتي قريباً' : 'Notification settings coming soon'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Data */}
          <TabsContent value="export" className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-600" />
                  {isRTL ? 'تصدير البيانات' : 'Export Data'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 mb-4">
                    {isRTL ? 'قم بتصدير جميع بيانات نظامك (المسوقين، الكافيتريات، طلبات الشحن) بصيغة JSON' : 'Export all your system data (marketers, cafeterias, recharge requests) in JSON format'}
                  </p>
                  <Button onClick={handleExportData} disabled={exporting} className="w-full bg-green-600 hover:bg-green-700">
                    {exporting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                    {isRTL ? 'تصدير البيانات' : 'Export Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-4">
            <Card className="border-2 border-red-200 bg-red-50 shadow-md">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {isRTL ? 'منطقة الخطر' : 'Danger Zone'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-sm text-red-800 font-bold mb-2">
                    {isRTL ? '⚠️ تحذير: هذه الإجراءات لا يمكن التراجع عنها!' : '⚠️ Warning: These actions are irreversible!'}
                  </p>
                  <p className="text-xs text-red-700">
                    {isRTL ? 'حذف الحساب سيؤدي إلى حذف جميع البيانات المرتبطة به' : 'Deleting your account will remove all associated data'}
                  </p>
                </div>

                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isRTL ? 'حذف الحساب نهائياً' : 'Delete Account Permanently'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {isRTL ? 'حذف الحساب' : 'Delete Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع البيانات المرتبطة بحسابك.' : 'This action cannot be undone. All data associated with your account will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              {isRTL ? 'اكتب "DELETE" للتأكيد:' : 'Type "DELETE" to confirm:'}
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              className="border-red-300"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRTL ? 'حذف نهائياً' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
