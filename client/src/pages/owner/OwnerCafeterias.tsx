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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Store, LayoutDashboard, Users, Wallet, BarChart3, Settings,
  Plus, Edit, Trash2, Eye, RefreshCw, ArrowLeft, Home, AlertCircle, Globe, Coins, Languages, MapPin
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

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    loginUsername: '',
    password: '',
    country: 'SA',
    currency: 'SAR',
    language: 'ar',
  });

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

      // 2. Generate Reference Code (Simplified for Client-side, ideally should be server-side)
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

      const insertData: any = {
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

      // Try to insert with subscriptionPlan, if it fails, try without it
      const { error } = await supabase.from('cafeterias').insert([insertData]);
      
      if (error && error.message.includes('subscriptionPlan')) {
        delete insertData.subscriptionPlan;
        const { error: retryError } = await supabase.from('cafeterias').insert([insertData]);
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
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
    c.arName.includes(countrySearch) || c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const isSystemOwner = user?.email === 'owner@cafeteria.com' || user?.role === 'owner';

  return (
    <div className={`min-h-screen bg-slate-50 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {isRTL ? 'إدارة الكافيتريات' : 'Cafeterias Management'}
          </h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          {isRTL ? 'إضافة كافيتريا' : 'Add Cafeteria'}
        </Button>
      </header>

      <main className="p-4 max-w-7xl mx-auto space-y-6">
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
                <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{cafeteria.country}</Badge>
                            <span className="text-xs text-slate-500">{cafeteria.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">{cafeteria.pointsBalance || 0} pts</TableCell>
                        <TableCell>
                          <Badge className={cafeteria.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {cafeteria.subscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedCafeteria(cafeteria); setShowEditDialog(true); }}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setSelectedCafeteria(cafeteria); setShowDeleteDialog(true); }}><Trash2 className="w-4 h-4" /></Button>
                          </div>
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

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {isRTL ? 'إضافة كافيتريا جديدة' : 'Add New Cafeteria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم الكافيتريا' : 'Cafeteria Name'}</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={isRTL ? 'مثال: كافيتريا السعادة' : 'e.g. Happiness Cafeteria'} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe className="w-3 h-3" /> {isRTL ? 'البلد' : 'Country'}</Label>
                {isSystemOwner ? (
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRTL ? 'اختر البلد' : 'Select Country'} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <Input 
                          placeholder={isRTL ? 'بحث...' : 'Search...'} 
                          value={countrySearch} 
                          onChange={e => setCountrySearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      {filteredCountries.map(c => (
                        <SelectItem key={c.code} value={c.code}>{isRTL ? c.arName : c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={formData.country} disabled className="bg-slate-50" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Coins className="w-3 h-3" /> {isRTL ? 'العملة' : 'Currency'}</Label>
                <Input value={formData.currency} disabled className="bg-slate-50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {isRTL ? 'الموقع (اختياري)' : 'Location (Optional)'}</Label>
              <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder={isRTL ? 'العنوان أو الإحداثيات' : 'Address or Coordinates'} />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني للدخول' : 'Login Email'}</Label>
              <Input type="email" value={formData.loginUsername} onChange={e => setFormData({...formData, loginUsername: e.target.value})} placeholder="admin@cafeteria.com" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddCafeteria} disabled={submitting} className="bg-blue-600">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
