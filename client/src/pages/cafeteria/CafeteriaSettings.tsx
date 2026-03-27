import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings, LayoutDashboard, UtensilsCrossed, Table2, Users, BarChart3, CreditCard,
  Store, Globe, Percent, Bell, Shield, Save, Languages
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface CafeteriaInfo {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  currency: string;
  country: string;
  taxRate: number;
  serviceCharge: number;
  plan: string;
}

export default function CafeteriaSettings() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  const [cafeteriaInfo, setCafeteriaInfo] = useState<CafeteriaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [generalForm, setGeneralForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
  });

  const [billingForm, setBillingForm] = useState({
    currency: 'USD',
    country: 'US',
    taxRate: '0',
    serviceCharge: '0',
  });

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

  const fetchCafeteriaInfo = async () => {
    if (!cafeteriaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('id', cafeteriaId)
        .single();
      if (error) throw error;
      if (data) {
        const info: CafeteriaInfo = {
          id: data.id,
          name: data.name,
          description: data.description,
          address: data.address,
          phone: data.phone,
          currency: data.currency || 'USD',
          country: data.country || 'US',
          taxRate: Number(data.tax_rate || 0),
          serviceCharge: Number(data.service_charge || 0),
          plan: data.plan || 'free',
        };
        setCafeteriaInfo(info);
        setGeneralForm({
          name: info.name || '',
          description: info.description || '',
          address: info.address || '',
          phone: info.phone || '',
        });
        setBillingForm({
          currency: info.currency,
          country: info.country,
          taxRate: String(info.taxRate),
          serviceCharge: String(info.serviceCharge),
        });
      }
    } catch (err: any) {
      console.error('Error fetching cafeteria info:', err);
      toast.error(isRTL ? 'خطأ في تحميل بيانات الكافيتريا' : 'Error loading cafeteria data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCafeteriaInfo(); }, [cafeteriaId]);

  const handleSaveGeneral = async () => {
    if (!cafeteriaId || !generalForm.name) {
      toast.error(isRTL ? 'اسم الكافيتريا مطلوب' : 'Cafeteria name is required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({
          name: generalForm.name,
          description: generalForm.description || null,
          address: generalForm.address || null,
          phone: generalForm.phone || null,
        })
        .eq('id', cafeteriaId);
      if (error) throw error;
      toast.success(isRTL ? 'تم حفظ الإعدادات العامة' : 'General settings saved');
      fetchCafeteriaInfo();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في الحفظ' : 'Error saving'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBilling = async () => {
    if (!cafeteriaId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({
          currency: billingForm.currency,
          country: billingForm.country,
          tax_rate: parseFloat(billingForm.taxRate) || 0,
          service_charge: parseFloat(billingForm.serviceCharge) || 0,
        })
        .eq('id', cafeteriaId);
      if (error) throw error;
      toast.success(isRTL ? 'تم حفظ إعدادات الفوترة' : 'Billing settings saved');
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في الحفظ' : 'Error saving'));
    } finally {
      setSaving(false);
    }
  };

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, { label: string; color: string }> = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-700' },
      basic: { label: 'Basic', color: 'bg-blue-100 text-blue-700' },
      pro: { label: 'PRO', color: 'bg-purple-100 text-purple-700' },
      enterprise: { label: 'Enterprise', color: 'bg-gold-100 text-yellow-700' },
    };
    const p = plans[plan] || plans.free;
    return <span className={`px-3 py-1 rounded-full text-sm font-bold ${p.color}`}>{p.label}</span>;
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader
        title={isRTL ? 'إعدادات الكافيتريا' : 'Cafeteria Settings'}
        icon={<Settings className="w-5 h-5" />}
        onMenuToggle={setMenuOpen}
        menuOpen={menuOpen}
      />
      <div className="flex">
        <DashboardNavigation items={navigationItems} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : (
            <Tabs defaultValue="general">
              <TabsList className="mb-6">
                <TabsTrigger value="general" className="gap-2">
                  <Store className="w-4 h-4" />
                  {isRTL ? 'عام' : 'General'}
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <Percent className="w-4 h-4" />
                  {isRTL ? 'الفوترة والضرائب' : 'Billing & Taxes'}
                </TabsTrigger>
                <TabsTrigger value="language" className="gap-2">
                  <Languages className="w-4 h-4" />
                  {isRTL ? 'اللغة' : 'Language'}
                </TabsTrigger>
                <TabsTrigger value="subscription" className="gap-2">
                  <Shield className="w-4 h-4" />
                  {isRTL ? 'الاشتراك' : 'Subscription'}
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Store className="w-5 h-5 text-blue-600" />
                      {isRTL ? 'معلومات الكافيتريا' : 'Cafeteria Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label className="font-medium">{isRTL ? 'اسم الكافيتريا *' : 'Cafeteria Name *'}</Label>
                      <Input
                        value={generalForm.name}
                        onChange={e => setGeneralForm({ ...generalForm, name: e.target.value })}
                        className="mt-1"
                        placeholder={isRTL ? 'اسم الكافيتريا' : 'Cafeteria name'}
                      />
                    </div>
                    <div>
                      <Label className="font-medium">{isRTL ? 'الوصف' : 'Description'}</Label>
                      <Textarea
                        value={generalForm.description}
                        onChange={e => setGeneralForm({ ...generalForm, description: e.target.value })}
                        className="mt-1"
                        rows={3}
                        placeholder={isRTL ? 'وصف مختصر للكافيتريا' : 'Brief description'}
                      />
                    </div>
                    <div>
                      <Label className="font-medium">{isRTL ? 'العنوان' : 'Address'}</Label>
                      <Input
                        value={generalForm.address}
                        onChange={e => setGeneralForm({ ...generalForm, address: e.target.value })}
                        className="mt-1"
                        placeholder={isRTL ? 'عنوان الكافيتريا' : 'Cafeteria address'}
                      />
                    </div>
                    <div>
                      <Label className="font-medium">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
                      <Input
                        value={generalForm.phone}
                        onChange={e => setGeneralForm({ ...generalForm, phone: e.target.value })}
                        className="mt-1"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <Button
                      onClick={handleSaveGeneral}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full md:w-auto"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Settings */}
              <TabsContent value="billing">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Percent className="w-5 h-5 text-green-600" />
                      {isRTL ? 'إعدادات الفوترة والضرائب' : 'Billing & Tax Settings'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium">{isRTL ? 'العملة' : 'Currency'}</Label>
                        <Select value={billingForm.currency} onValueChange={v => setBillingForm({ ...billingForm, currency: v })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                            <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                            <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                            <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-medium">{isRTL ? 'الدولة' : 'Country'}</Label>
                        <Select value={billingForm.country} onValueChange={v => setBillingForm({ ...billingForm, country: v })}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="SA">Saudi Arabia</SelectItem>
                            <SelectItem value="AE">UAE</SelectItem>
                            <SelectItem value="EG">Egypt</SelectItem>
                            <SelectItem value="KW">Kuwait</SelectItem>
                            <SelectItem value="QA">Qatar</SelectItem>
                            <SelectItem value="BH">Bahrain</SelectItem>
                            <SelectItem value="OM">Oman</SelectItem>
                            <SelectItem value="JO">Jordan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium">{isRTL ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={billingForm.taxRate}
                          onChange={e => setBillingForm({ ...billingForm, taxRate: e.target.value })}
                          className="mt-1"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isRTL ? 'مثال: 15 تعني 15%' : 'Example: 15 means 15%'}
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">{isRTL ? 'رسوم الخدمة (%)' : 'Service Charge (%)'}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={billingForm.serviceCharge}
                          onChange={e => setBillingForm({ ...billingForm, serviceCharge: e.target.value })}
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">{isRTL ? 'معاينة الفاتورة' : 'Bill Preview'}</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                          <span>100.00 {billingForm.currency}</span>
                        </div>
                        {parseFloat(billingForm.taxRate) > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>{isRTL ? `ضريبة (${billingForm.taxRate}%)` : `Tax (${billingForm.taxRate}%)`}</span>
                            <span>{(100 * parseFloat(billingForm.taxRate) / 100).toFixed(2)} {billingForm.currency}</span>
                          </div>
                        )}
                        {parseFloat(billingForm.serviceCharge) > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span>{isRTL ? `خدمة (${billingForm.serviceCharge}%)` : `Service (${billingForm.serviceCharge}%)`}</span>
                            <span>{(100 * parseFloat(billingForm.serviceCharge) / 100).toFixed(2)} {billingForm.currency}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-800 border-t pt-1 mt-1">
                          <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                          <span>
                            {(100 + (100 * parseFloat(billingForm.taxRate || '0') / 100) + (100 * parseFloat(billingForm.serviceCharge || '0') / 100)).toFixed(2)} {billingForm.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveBilling}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full md:w-auto"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Language Settings */}
              <TabsContent value="language">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-purple-600" />
                      {isRTL ? 'إعدادات اللغة' : 'Language Settings'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="font-medium text-gray-700">{isRTL ? 'لغة الواجهة' : 'Interface Language'}</Label>
                      <p className="text-sm text-gray-500 mb-3">
                        {isRTL ? 'اختر اللغة التي تريد عرض الواجهة بها' : 'Choose the language for the interface'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setLanguage('ar')}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            language === 'ar'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-2xl mb-1">🇸🇦</p>
                          <p className="font-bold">العربية</p>
                          <p className="text-xs text-gray-500">Arabic</p>
                          {language === 'ar' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {isRTL ? 'نشط' : 'Active'}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setLanguage('en')}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            language === 'en'
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-2xl mb-1">🇺🇸</p>
                          <p className="font-bold">English</p>
                          <p className="text-xs text-gray-500">الإنجليزية</p>
                          {language === 'en' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-700">
                        {isRTL
                          ? '✓ تم تفعيل دعم اللغة العربية بالكامل مع اتجاه RTL'
                          : '✓ Arabic language support with RTL direction is fully enabled'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Subscription */}
              <TabsContent value="subscription">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-yellow-600" />
                      {isRTL ? 'معلومات الاشتراك' : 'Subscription Info'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                      <div>
                        <p className="text-sm text-gray-500">{isRTL ? 'الخطة الحالية' : 'Current Plan'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPlanBadge(cafeteriaInfo?.plan || 'free')}
                        </div>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        {isRTL ? 'ترقية الخطة' : 'Upgrade Plan'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: isRTL ? 'الطاولات' : 'Tables', limit: cafeteriaInfo?.plan === 'pro' ? 'Unlimited' : '10', icon: '🪑' },
                        { label: isRTL ? 'الموظفين' : 'Staff', limit: cafeteriaInfo?.plan === 'pro' ? 'Unlimited' : '5', icon: '👥' },
                        { label: isRTL ? 'أصناف المنيو' : 'Menu Items', limit: cafeteriaInfo?.plan === 'pro' ? 'Unlimited' : '50', icon: '🍽️' },
                      ].map((item) => (
                        <div key={item.label} className="p-4 bg-white rounded-xl border border-gray-200 text-center">
                          <p className="text-2xl mb-1">{item.icon}</p>
                          <p className="text-sm text-gray-500">{item.label}</p>
                          <p className="font-bold text-gray-800">{item.limit}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800">
                        {isRTL
                          ? '💡 قم بالترقية إلى خطة PRO للحصول على طاولات وموظفين وأصناف غير محدودة مع تقارير متقدمة.'
                          : '💡 Upgrade to PRO plan for unlimited tables, staff, menu items and advanced reports.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
