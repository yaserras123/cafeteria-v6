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
  Store, Globe, Percent, Shield, Save, Languages, MapPin, Phone, Hash, AlertCircle
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
        };
        
        setCafeteriaInfo(info);
        
        // Extract phone code if exists
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
      }
    } catch (err: any) {
      console.error('Error fetching cafeteria info:', err);
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

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setBillingForm({ ...billingForm, country: countryCode, currency: country.currency });
      setGeneralForm({ ...generalForm, phoneCode: country.phoneCode });
    }
  };

  const handleSaveGeneral = async () => {
    if (!cafeteriaId) return;
    if (!generalForm.name.trim()) {
      toast.error(isRTL ? 'اسم الكافيتريا مطلوب' : 'Cafeteria name is required');
      return;
    }
    if (!generalForm.phone.trim()) {
      toast.error(isRTL ? 'رقم الهاتف مطلوب' : 'Phone number is required');
      return;
    }

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
      fetchCafeteriaInfo();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في الحفظ' : 'Error saving'));
    } finally {
      setSaving(false);
    }
  };

  const openInGoogleMaps = () => {
    if (generalForm.latitude && generalForm.longitude) {
      window.open(`https://www.google.com/maps?q=${generalForm.latitude},${generalForm.longitude}`, '_blank');
    } else {
      toast.error(isRTL ? 'يرجى إدخال الإحداثيات أولاً' : 'Please enter coordinates first');
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader title={isRTL ? 'إعدادات الكافيتريا' : 'Cafeteria Settings'} onMenuClick={() => setMenuOpen(true)} />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Reference Code Banner */}
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
              <p className="text-blue-100 text-xs">{isRTL ? 'خطة الاشتراك الحالية' : 'Current Subscription Plan'}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-bold uppercase">{cafeteriaInfo?.plan}</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-white shadow-sm border">
            <TabsTrigger value="general" className="gap-2"><Store className="w-4 h-4" /> {isRTL ? 'عام' : 'General'}</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><Globe className="w-4 h-4" /> {isRTL ? 'الدولة' : 'Country'}</TabsTrigger>
            <TabsTrigger value="location" className="gap-2"><MapPin className="w-4 h-4" /> {isRTL ? 'الموقع' : 'Location'}</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" /> {isRTL ? 'المعلومات الأساسية' : 'Basic Information'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>{isRTL ? 'اسم الكافيتريا *' : 'Cafeteria Name *'}</Label>
                  <Input value={generalForm.name} onChange={e => setGeneralForm({ ...generalForm, name: e.target.value })} placeholder={isRTL ? 'أدخل الاسم' : 'Enter name'} />
                </div>
                <div className="grid gap-2">
                  <Label>{isRTL ? 'رقم الهاتف *' : 'Phone Number *'}</Label>
                  <div className="flex gap-2" dir="ltr">
                    <div className="w-24 bg-gray-100 flex items-center justify-center rounded-md border font-mono text-sm">{generalForm.phoneCode}</div>
                    <Input value={generalForm.phone} onChange={e => setGeneralForm({ ...generalForm, phone: e.target.value })} className="flex-1" placeholder="123456789" />
                  </div>
                  <p className="text-[10px] text-gray-400">{isRTL ? 'يجب أن يتطابق كود الدولة مع الدولة المختارة في تبويب الدولة' : 'Phone code must match the country selected in Country tab'}</p>
                </div>
                <div className="grid gap-2">
                  <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
                  <Textarea value={generalForm.description} onChange={e => setGeneralForm({ ...generalForm, description: e.target.value })} rows={3} />
                </div>
                <Button onClick={handleSaveGeneral} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"><Save className="w-4 h-4" /> {isRTL ? 'حفظ التغييرات' : 'Save Changes'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Country & Billing */}
          <TabsContent value="billing">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" /> {isRTL ? 'الدولة والعملة' : 'Country & Currency'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>{isRTL ? 'الدولة *' : 'Country *'}</Label>
                  <Select value={billingForm.country} onValueChange={handleCountryChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {countries.map(c => <SelectItem key={c.code} value={c.code}>{isRTL ? c.arName : c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{isRTL ? 'العملة' : 'Currency'}</Label>
                  <Input value={billingForm.currency} readOnly className="bg-gray-50 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{isRTL ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}</Label>
                    <Input type="number" value={billingForm.taxRate} onChange={e => setBillingForm({ ...billingForm, taxRate: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>{isRTL ? 'رسوم الخدمة' : 'Service Charge'}</Label>
                    <Input type="number" value={billingForm.serviceCharge} onChange={e => setBillingForm({ ...billingForm, serviceCharge: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSaveBilling} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"><Save className="w-4 h-4" /> {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Settings */}
          <TabsContent value="location">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> {isRTL ? 'موقع الكافيتريا (GPS)' : 'Cafeteria Location (GPS)'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>{isRTL ? 'العنوان النصي' : 'Physical Address'}</Label>
                  <Input value={generalForm.address} onChange={e => setGeneralForm({ ...generalForm, address: e.target.value })} placeholder={isRTL ? 'مثال: شارع النيل، القاهرة' : 'e.g. Nile St, Cairo'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{isRTL ? 'خط العرض (Latitude)' : 'Latitude'}</Label>
                    <Input type="number" value={generalForm.latitude} onChange={e => setGeneralForm({ ...generalForm, latitude: e.target.value })} placeholder="30.0444" />
                  </div>
                  <div className="grid gap-2">
                    <Label>{isRTL ? 'خط الطول (Longitude)' : 'Longitude'}</Label>
                    <Input type="number" value={generalForm.longitude} onChange={e => setGeneralForm({ ...generalForm, longitude: e.target.value })} placeholder="31.2357" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={openInGoogleMaps} variant="outline" className="flex-1 gap-2"><Globe className="w-4 h-4" /> {isRTL ? 'عرض على الخريطة' : 'View on Map'}</Button>
                  <Button onClick={handleSaveGeneral} disabled={saving} className="flex-1 bg-blue-600 text-white gap-2"><Save className="w-4 h-4" /> {isRTL ? 'حفظ الموقع' : 'Save Location'}</Button>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {isRTL 
                      ? 'تأكد من إدخال الإحداثيات بدقة لضمان وصول العملاء والمناديب لموقع الكافيتريا بسهولة عبر تطبيقات الخرائط.' 
                      : 'Ensure coordinates are accurate to help customers and delivery staff find your location easily via map apps.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
