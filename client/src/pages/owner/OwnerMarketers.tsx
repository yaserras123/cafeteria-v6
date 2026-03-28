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
  Users, LayoutDashboard, Store, Wallet, BarChart3, Settings,
  Plus, Edit, Trash2, Mail, Phone, RefreshCw, ArrowLeft, Home, AlertCircle, Globe, Coins
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Marketer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  referenceCode?: string;
  isRoot?: boolean;
  country?: string;
  currency?: string;
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

export default function OwnerMarketers() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [, setLocation] = useLocation();
  const isRTL = language === 'ar';

  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<Marketer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    country: "SA",
    currency: "SAR",
    language: "ar",
  });

  const fetchMarketers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketers')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setMarketers(data || []);
    } catch (err: any) {
      console.error('Error fetching marketers:', err);
      toast.error(isRTL ? 'خطأ في تحميل المسوقين' : 'Error loading marketers');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    if (!authLoading) {
      fetchMarketers();
    }
  }, [authLoading, fetchMarketers]);

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

  const handleAddMarketer = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(isRTL ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.error(isRTL ? 'كلمة المرور قصيرة جداً' : 'Password too short');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Determine Parent and Reference Code
      let parentRefCode = '10';
      let parentId = null;
      let isRoot = true;
      
      const isSystemOwner = user?.email === 'owner@cafeteria.com' || user?.role === 'owner';
      
      if (!isSystemOwner) {
        const { data: parent } = await supabase
          .from('marketers')
          .select('id, referenceCode, country, currency, language')
          .eq('email', user?.email)
          .single();
        
        if (parent) {
          parentRefCode = parent.referenceCode;
          parentId = parent.id;
          isRoot = false;
          // Inheritance
          formData.country = parent.country;
          formData.currency = parent.currency;
          formData.language = parent.language;
        }
      }

      // 2. Generate Reference Code
      const { data: existing } = await supabase
        .from('marketers')
        .select('referenceCode')
        .like('referenceCode', `${parentRefCode}%`)
        .not('referenceCode', 'eq', parentRefCode)
        .order('referenceCode', { ascending: false })
        .limit(1);
      
      let nextNum = 1;
      if (existing && existing.length > 0 && existing[0].referenceCode) {
        const lastCode = existing[0].referenceCode;
        const lastTwo = lastCode.slice(-2);
        if (!isNaN(parseInt(lastTwo))) nextNum = parseInt(lastTwo) + 1;
      }
      const newRefCode = `${parentRefCode}${String(nextNum).padStart(2, '0')}`;

      const insertData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        loginUsername: formData.email.trim().toLowerCase(),
        passwordHash: formData.password,
        referenceCode: newRefCode,
        parentId,
        isRoot,
        country: formData.country,
        currency: formData.currency,
        language: formData.language,
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('marketers').insert([insertData]);
      if (error) throw error;
      
      toast.success(isRTL ? 'تم إضافة المسوق بنجاح' : 'Marketer added successfully');
      setShowAddDialog(false);
      setFormData({ name: '', email: '', password: '', country: 'SA', currency: 'SAR', language: 'ar' });
      fetchMarketers();
    } catch (err: any) {
      console.error('Add marketer error:', err);
      toast.error(err.message || (isRTL ? 'خطأ في إضافة المسوق' : 'Error adding marketer'));
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
          <div className="bg-purple-600 p-2 rounded-lg text-white">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {isRTL ? 'إدارة المسوقين' : 'Marketers Management'}
          </h1>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          {isRTL ? 'إضافة مسوق' : 'Add Marketer'}
        </Button>
      </header>

      <main className="p-4 max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {isRTL ? 'قائمة المسوقين' : 'Marketers List'}
              </CardTitle>
              <div className="relative w-full md:w-72">
                <Input
                  placeholder={isRTL ? 'بحث عن مسوق...' : 'Search marketers...'}
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
                    <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                    <TableHead>{isRTL ? 'البلد/العملة' : 'Country/Currency'}</TableHead>
                    <TableHead className="text-right">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" /></TableCell></TableRow>
                  ) : marketers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">{isRTL ? 'لا يوجد مسوقين' : 'No marketers found'}</TableCell></TableRow>
                  ) : (
                    marketers.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((marketer) => (
                      <TableRow key={marketer.id}>
                        <TableCell className="font-mono font-bold text-purple-600">{marketer.referenceCode || '---'}</TableCell>
                        <TableCell className="font-bold">{marketer.name}</TableCell>
                        <TableCell>{marketer.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{marketer.country}</Badge>
                            <span className="text-xs text-slate-500">{marketer.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedMarketer(marketer); setShowEditDialog(true); }}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => { setSelectedMarketer(marketer); setShowDeleteDialog(true); }}><Trash2 className="w-4 h-4" /></Button>
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
              <Plus className="w-5 h-5 text-purple-600" />
              {isRTL ? 'إضافة مسوق جديد' : 'Add New Marketer'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم المسوق' : 'Marketer Name'}</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={isRTL ? 'مثال: أحمد محمد' : 'e.g. Ahmed Mohamed'} />
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
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="marketer@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddMarketer} disabled={submitting} className="bg-purple-600">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
