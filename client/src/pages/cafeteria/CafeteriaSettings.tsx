import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings, LayoutDashboard, UtensilsCrossed, Table2, Users, BarChart3, CreditCard,
  Store, Globe, Percent, Shield, Save, Languages, MapPin, Phone, Hash, AlertCircle, Clock, LogOut
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
  latitude?: number;
  longitude?: number;
  referenceCode?: string;
  autoLogoutMinutes: number;
}

const countries = [
  { code: 'EG', name: 'Egypt', arName: 'مصر', currency: 'EGP', phoneCode: '+20' },
  { code: 'SA', name: 'Saudi Arabia', arName: 'السعودية', currency: 'SAR', phoneCode: '+966' },
  { code: 'AE', name: 'UAE', arName: 'الإمارات', currency: 'AED', phoneCode: '+971' },
  { code: 'KW', name: 'Kuwait', arName: 'الكويت', currency: 'KWD', phoneCode: '+965' },
  { code: 'JO', name: 'Jordan', arName: 'الأردن', currency: 'JOD', phoneCode: '+962' },
];

export default function CafeteriaSettings() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
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
    phoneCode: '+20',
    latitude: '',
    longitude: '',
  });

  const [billingForm, setBillingForm] = useState({
    currency: 'EGP',
    country: 'EG',
    taxRate: '0',
    serviceCharge: '0',
  });

  const [securityForm, setSecurityForm] = useState({
    autoLogoutMinutes: '120',
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

  const fetchCafeteriaInfo = useCallback(async () => {
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
          currency: data.currency || 'EGP',
          country: data.country || 'EG',
          taxRate: Number(data.tax_rate || 0),
          serviceCharge: Number(data.service_charge || 0),
          plan: data.plan || 'free',
          latitude: data.latitude,
          longitude: data.longitude,
          referenceCode: data.reference_code,
          autoLogoutMinutes: data.auto_logout_minutes || 120,
        };
        
        setCafeteriaInfo(info);
        
        let pCode = '+20';
        let pNum = info.phone || '';
        const matchedCountry = countries.find(c => pNum.startsWith(c.phoneCode));
        if (matchedCountry) {
          pCode = matchedCountry.phoneCode;
          pNum = pNum.replace(pCode, '');
        }

        setGeneralForm({
          name: info.name || '',
          description: info.description || '',
          address: info.address || '',
          phone: pNum,
          phoneCode: pCode,
          latitude: info.latitude ? String(info.latitude) : '',
          longitude: info.longitude ? String(info.longitude) : '',
        });
        
        setBillingForm({
          currency: info.currency,
          country: info.country,
          taxRate: String(info.taxRate),
          serviceCharge: String(info.serviceCharge),
        });

        setSecurityForm({
          autoLogoutMinutes: String(info.autoLogoutMinutes),
        });
      }
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في تحميل بيانات الكافيتريا' : 'Error loading cafeteria data');
    } finally {
      setLoading(false);
    }
  }, [cafeteriaId, isRTL]);

  useEffect(() => {
    if (!authLoading && cafeteriaId) {
      fetchCafeteriaInfo();
    }
  }, [cafeteriaId, authLoading, fetchCafeteriaInfo]);

  const handleSaveGeneral = async () => {
    if (!cafeteriaId) return;
    setSaving(true);
    try {
      const fullPhone = generalForm.phoneCode + generalForm.phone.replace(/^0+/, '');
      const { error } = await supabase
        .from('cafeterias')
        .update({
          name: generalForm.name.trim(),
          description: generalForm.description.trim() || null,
          address: generalForm.address.trim() || null,
          phone: fullPhone,
          latitude: generalForm.latitude ? parseFloat(generalForm.latitude) : null,
          longitude: generalForm.longitude ? parseFloat(generalForm.longitude) : null,
        })
        .eq('id', cafeteriaId);
      if (error) throw error;
      toast.success(isRTL ? 'تم حفظ الإعدادات العامة' : 'General settings saved');
      fetchCafeteriaInfo();
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!cafeteriaId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('cafeterias')
        .update({
          auto_logout_minutes: parseInt(securityForm.autoLogoutMinutes) || 120,
        })
        .eq('id', cafeteriaId);
      if (error) throw error;
      toast.success(isRTL ? 'تم حفظ إعدادات الأمان' : 'Security settings saved');
      fetchCafeteriaInfo();
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader title={isRTL ? 'إعدادات الكافيتريا' : 'Cafeteria Settings'} onMenuClick={() => setMenuOpen(true)} />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl"><Hash className="w-6 h-6" /></div>
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">{isRTL ? 'الرقم المرجعي للكافيتريا' : 'Cafeteria Reference Code'}</p>
                <h2 className="text-2xl font-black tracking-widest">{cafeteriaInfo?.referenceCode || '---'}</h2>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-blue-100 text-xs">{isRTL ? 'حالة الكافيتريا' : 'Cafeteria Status'}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-white text-green-700 rounded-full text-xs font-bold uppercase">{isRTL ? 'نشطة' : 'Active'}</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-white shadow-sm border">
            <TabsTrigger value="general" className="gap-2"><Store className="w-4 h-4" /> {isRTL ? 'عام' : 'General'}</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><Globe className="w-4 h-4" /> {isRTL ? 'الدولة' : 'Country'}</TabsTrigger>
            <TabsTrigger value="location" className="gap-2"><MapPin className="w-4 h-4" /> {isRTL ? 'الموقع' : 'Location'}</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> {isRTL ? 'الأمان' : 'Security'}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" /> {isRTL ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2"><Label>{isRTL ? 'اسم الكافيتريا *' : 'Cafeteria Name *'}</Label><Input value={generalForm.name} onChange={e => setGeneralForm({ ...generalForm, name: e.target.value })} /></div>
                <div className="grid gap-2"><Label>{isRTL ? 'رقم الهاتف *' : 'Phone Number *'}</Label><div className="flex gap-2"><Input className="w-24 bg-slate-50" value={generalForm.phoneCode} readOnly /><Input value={generalForm.phone} onChange={e => setGeneralForm({ ...generalForm, phone: e.target.value })} /></div></div>
                <div className="grid gap-2"><Label>{isRTL ? 'العنوان' : 'Address'}</Label><Input value={generalForm.address} onChange={e => setGeneralForm({ ...generalForm, address: e.target.value })} /></div>
                <Button onClick={handleSaveGeneral} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"><Save className="w-4 h-4" /> {isRTL ? 'حفظ التغييرات' : 'Save Changes'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" /> {isRTL ? 'إعدادات الأمان والجلسات' : 'Security & Session Settings'}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Clock className="w-8 h-8 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-blue-900">{isRTL ? 'الخروج التلقائي عند عدم النشاط' : 'Auto-Logout on Inactivity'}</h4>
                      <p className="text-xs text-blue-700">{isRTL ? 'سيتم تسجيل خروج طاقم العمل تلقائياً بعد هذه المدة من عدم النشاط.' : 'Staff will be automatically logged out after this period of inactivity.'}</p>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{isRTL ? 'المدة (بالدقائق)' : 'Duration (Minutes)'}</Label>
                    <Select value={securityForm.autoLogoutMinutes} onValueChange={v => setSecurityForm({ autoLogoutMinutes: v })}>
                      <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 {isRTL ? 'دقيقة' : 'Minutes'}</SelectItem>
                        <SelectItem value="60">60 {isRTL ? 'دقيقة (ساعة)' : 'Minutes (1 Hour)'}</SelectItem>
                        <SelectItem value="120">120 {isRTL ? 'دقيقة (ساعتين)' : 'Minutes (2 Hours)'}</SelectItem>
                        <SelectItem value="240">240 {isRTL ? 'دقيقة (4 ساعات)' : 'Minutes (4 Hours)'}</SelectItem>
                        <SelectItem value="480">480 {isRTL ? 'دقيقة (8 ساعات)' : 'Minutes (8 Hours)'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-3">
                  <LogOut className="w-5 h-5 text-orange-600 shrink-0" />
                  <p className="text-xs text-orange-800 font-medium">{isRTL ? 'ملاحظة: عند حظر موظف من لوحة التحكم، سيتم إنهاء جلسته فوراً في الحال.' : 'Note: When a staff member is blocked from the dashboard, their session will be terminated immediately.'}</p>
                </div>
                <Button onClick={handleSaveSecurity} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"><Save className="w-4 h-4" /> {isRTL ? 'حفظ إعدادات الأمان' : 'Save Security Settings'}</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
