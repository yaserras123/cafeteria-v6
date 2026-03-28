import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import {
  Store, LayoutDashboard, Users, Wallet, BarChart3, Settings,
  Plus, Edit, Trash2, Eye, RefreshCw, ArrowLeft, Home, AlertCircle, Globe, Coins, Languages, MapPin, Search
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Cafeteria {
  id: string;
  name: string;
  location?: string;
  loginUsername?: string;
  subscriptionStatus: string;
  createdAt: string;
  pointsBalance?: number;
  freeOperationEndDate?: string;
  referenceCode?: string;
  country?: string;
  currency?: string;
  language?: string;
}

const countries = [
  { code: 'EG', name: 'Egypt', arName: 'مصر', currency: 'EGP', language: 'ar' },
  { code: 'SA', name: 'Saudi Arabia', arName: 'السعودية', currency: 'SAR', language: 'ar' },
  { code: 'AE', name: 'UAE', arName: 'الإمارات', currency: 'AED', language: 'ar' },
  { code: 'KW', name: 'Kuwait', arName: 'الكويت', currency: 'KWD', language: 'ar' },
  { code: 'JO', name: 'Jordan', arName: 'الأردن', currency: 'JOD', language: 'ar' },
  { code: 'US', name: 'USA', arName: 'الولايات المتحدة', currency: 'USD', language: 'en' },
  { code: 'GB', name: 'UK', arName: 'المملكة المتحدة', currency: 'GBP', language: 'en' },
].sort((a, b) => a.arName.localeCompare(b.arName));

export default function OwnerCafeterias() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [, setLocation] = useLocation();
  const isRTL = language === 'ar';

  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCafeteria, setSelectedCafeteria] = useState<Cafeteria | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    loginUsername: '',
    password: '',
    country: 'SA',
    currency: 'SAR',
    language: 'ar',
  });

  const navigationItems = [
    { label: isRTL ? 'لوحة التحكم' : 'Dashboard', path: '/dashboard/owner', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: isRTL ? 'المسوقين' : 'Marketers', path: '/dashboard/owner/marketers', icon: <Users className="w-5 h-5" /> },
    { label: isRTL ? 'الكافيتريات' : 'Cafeterias', path: '/dashboard/owner/cafeterias', icon: <Store className="w-5 h-5" /> },
    { label: isRTL ? 'حاسبة النقاط' : 'Calculator', path: '/dashboard/owner/calculator', icon: <Coins className="w-5 h-5" /> },
    { label: isRTL ? 'التقارير' : 'Reports', path: '/dashboard/owner/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: isRTL ? 'الإعدادات' : 'Settings', path: '/dashboard/owner/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const fetchCafeterias = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cafeterias')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setCafeterias(data || []);
    } catch (err: any) {
      console.error('Error fetching cafeterias:', err);
      toast.error(isRTL ? 'خطأ في تحميل الكافيتريات' : 'Error loading cafeterias');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    if (!authLoading) {
      fetchCafeterias();
    }
  }, [authLoading, fetchCafeterias]);

  const handleCountryChange = (code: string) => {
    const selected = countries.find(c => c.code === code);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        country: selected.code,
        currency: selected.currency,
        language: selected.language
      }));
    }
  };

  const handleCountryInputChange = (value: string) => {
    const selected = countries.find(c => (isRTL ? c.arName : c.name) === value);
    if (selected) {
      handleCountryChange(selected.code);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddCafeteria = async () => {
    if (!formData.name.trim()) {
      toast.error(isRTL ? 'اسم الكافيتريا مطلوب' : 'Cafeteria name is required');
      return;
    }

    if (!formData.loginUsername.trim() || !isValidEmail(formData.loginUsername.trim())) {
      toast.error(isRTL ? 'بريد إلكتروني غير صحيح' : 'Invalid email');
      return;
    }

    if (formData.password.length < 6) {
      toast.error(isRTL ? 'كلمة المرور قصيرة جداً' : 'Password too short');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Get Parent Reference Code (Owner or Marketer)
      let parentRefCode = '10'; // Default Owner
      let marketerId = 'owner';
      
      const isSystemOwner = user?.email === 'owner@cafeteria.com' || user?.role === 'owner';
      
      if (!isSystemOwner) {
        if (!user?.id) {
          throw new Error(isRTL ? 'معرف المستخدم غير موجود' : 'User ID is missing');
        }
        const { data: marketer } = await supabase
          .from('marketers')
          .select('id, referenceCode, country, currency, language')
          .eq('email', user?.email)
          .single();
        
        if (marketer) {
          parentRefCode = marketer.referenceCode;
          marketerId = marketer.id;
          // Enforce inheritance for non-owners
          formData.country = marketer.country;
          formData.currency = marketer.currency;
          formData.language = marketer.language;
        }
      }

      // 2. Generate Reference Code
      const { data: existing } = await supabase
        .from('cafeterias')
        .select('referenceCode')
        .like('referenceCode', `${parentRefCode}P%`)
        .order('referenceCode', { ascending: false })
        .limit(1);
      
      let nextNum = 1;
      if (existing && existing.length > 0 && existing[0].referenceCode) {
        const lastCode = existing[0].referenceCode;
        const match = lastCode.match(/P(\d+)$/);
        if (match) nextNum = parseInt(match[1]) + 1;
      }
      const newRefCode = `${parentRefCode}P${String(nextNum).padStart(2, '0')}`;

      // 3. Prepare Data with explicit ID to avoid NULL constraint error
      const insertData: any = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        name: formData.name.trim(),
        location: formData.location.trim() || null,
        loginUsername: formData.loginUsername.trim().toLowerCase(),
        passwordHash: formData.password,
        marketerId,
        referenceCode: newRefCode,
        country: formData.country,
        currency: formData.currency,
        language: formData.language,
        pointsBalance: 0,
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString(),
      };

      // Try to insert
      const { error } = await supabase.from('cafeterias').insert([insertData]);
      
      if (error) {
        // If error is about subscriptionPlan, try deleting it and retry
        if (error.message.includes('subscriptionPlan')) {
          delete insertData.subscriptionPlan;
          const { error: retryError } = await supabase.from('cafeterias').insert([insertData]);
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      
      toast.success(isRTL ? 'تم إضافة الكافيتريا بنجاح' : 'Cafeteria added successfully');
      setShowAddDialog(false);
      setFormData({ name: '', location: '', loginUsername: '', password: '', country: 'SA', currency: 'SAR', language: 'ar' });
      fetchCafeterias();
    } catch (err: any) {
      console.error('Add cafeteria error:', err);
      toast.error(err.message || (isRTL ? 'خطأ في إضافة الكافيتريا' : 'Error adding cafeteria'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCountries = countries.filter(c => 
    (isRTL ? c.arName : c.name).toLowerCase().includes(countrySearch.toLowerCase())
  );

  const isSystemOwner = user?.email === 'owner@cafeteria.com' || user?.role === 'owner';
  const currentCountryName = countries.find(c => c.code === formData.country)?.[isRTL ? 'arName' : 'name'] || '';

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader showBackButton={true} showHomeButton={true} 
        title={isRTL ? 'إدارة الكافيتريات' : 'Cafeterias Management'} 
        onMenuClick={() => setMenuOpen(true)} 
        showBackButton={true}
        showHomeButton={true}
      />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="p-4 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">{isRTL ? 'الكافيتريات' : 'Cafeterias'}</h2>
          <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {isRTL ? 'إضافة كافيتريا' : 'Add Cafeteria'}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                {isRTL ? 'قائمة الكافيتريات' : 'Cafeterias List'}
              </CardTitle>
              <div className="relative w-full md:w-72">
                <Input
                  placeholder={isRTL ? 'بحث عن كافيتريا...' : 'Search cafeterias...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? 'الرقم المرجعي' : 'Ref Code'}</TableHead>
                    <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead>{isRTL ? 'البلد/العملة' : 'Country/Currency'}</TableHead>
                    <TableHead>{isRTL ? 'الرصيد' : 'Balance'}</TableHead>
                    <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-right">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
                  ) : cafeterias.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-500">{isRTL ? 'لا توجد كافيتريات' : 'No cafeterias found'}</TableCell></TableRow>
                  ) : (
                    cafeterias.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((cafeteria) => (
                      <TableRow key={cafeteria.id}>
                        <TableCell className="font-mono font-bold text-blue-600">{cafeteria.referenceCode || '---'}</TableCell>
                        <TableCell className="font-bold">{cafeteria.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{cafeteria.country}</Badge>
                            <span className="text-xs text-slate-500">{cafeteria.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">{cafeteria.pointsBalance?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Badge className={cafeteria.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {cafeteria.subscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-blue-600"><Eye className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Cafeteria Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {isRTL ? 'إضافة كافيتريا جديدة' : 'Add New Cafeteria'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم الكافيتريا' : 'Cafeteria Name'}</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Cafeteria Name" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني (للدخول)' : 'Email (Login)'}</Label>
              <Input value={formData.loginUsername} onChange={e => setFormData({...formData, loginUsername: e.target.value})} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'العنوان' : 'Location'}</Label>
              <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="City, Street..." />
            </div>

            {isSystemOwner && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> {isRTL ? 'البلد' : 'Country'}</Label>
                  <div className="relative">
                    <input
                      type="text"
                      list="cafeteria-countries-list"
                      value={currentCountryName}
                      onChange={(e) => handleCountryInputChange(e.target.value)}
                      onInput={(e) => setCountrySearch(e.currentTarget.value)}
                      placeholder={isRTL ? 'ابدأ بكتابة اسم البلد...' : 'Start typing country name...'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      autoComplete="off"
                    />
                    <datalist id="cafeteria-countries-list">
                      {filteredCountries.map(c => (
                        <option key={c.code} value={isRTL ? c.arName : c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Coins className="w-4 h-4" /> {isRTL ? 'العملة' : 'Currency'}</Label>
                  <Input value={formData.currency} disabled className="bg-slate-50 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Languages className="w-4 h-4" /> {isRTL ? 'اللغة' : 'Language'}</Label>
                  <Input value={formData.language === 'ar' ? (isRTL ? 'العربية' : 'Arabic') : (isRTL ? 'الإنجليزية' : 'English')} disabled className="bg-slate-50" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddCafeteria} disabled={submitting} className="bg-blue-600">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
