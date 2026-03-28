import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, LayoutDashboard, Wallet, BarChart3, Plus, Store, Hash, Globe, Mail, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface SubMarketer {
  id: string;
  name: string;
  email: string;
  referenceCode: string;
  country: string;
  currency: string;
  createdAt: string;
}

interface SubCafeteria {
  id: string;
  name: string;
  referenceCode: string;
  country: string;
  currency: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function MarketerDownlines() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [subMarketers, setSubMarketers] = useState<SubMarketer[]>([]);
  const [subCafeterias, setSubCafeterias] = useState<SubCafeteria[]>([]);
  
  const [showMarketerDialog, setShowMarketerDialog] = useState(false);
  const [showCafeteriaDialog, setShowCafeteriaDialog] = useState(false);

  const [marketerForm, setMarketerForm] = useState({ name: '', email: '', password: '' });
  const [cafeteriaForm, setCafeteriaForm] = useState({ name: '', email: '', password: '' });

  const isRTL = language === 'ar';

  const navigationItems = [
    { label: isRTL ? 'لوحة التحكم' : 'Dashboard', path: '/dashboard/marketer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: isRTL ? 'أبنائي' : 'My Downlines', path: '/dashboard/marketer/downlines', icon: <Users className="w-5 h-5" /> },
    { label: isRTL ? 'عمولاتي' : 'My Commissions', path: '/dashboard/marketer/commissions', icon: <Wallet className="w-5 h-5" /> },
    { label: isRTL ? 'التقارير' : 'Reports', path: '/dashboard/marketer/reports', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch Sub-Marketers
      const { data: mData, error: mError } = await supabase
        .from('users')
        .select('*')
        .eq('parent_id', user.id)
        .eq('role', 'marketer');
      
      if (mError) throw mError;
      setSubMarketers((mData || []).map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        referenceCode: m.reference_code,
        country: m.country,
        currency: m.currency,
        createdAt: m.created_at
      })));

      // Fetch Sub-Cafeterias
      const { data: cData, error: cError } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('parent_id', user.id);
      
      if (cError) throw cError;
      setSubCafeterias((cData || []).map(c => ({
        id: c.id,
        name: c.name,
        referenceCode: c.reference_code,
        country: c.country,
        currency: c.currency,
        subscriptionStatus: c.subscriptionStatus,
        createdAt: c.created_at
      })));

    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isRTL]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const handleAddMarketer = async () => {
    if (!marketerForm.name || !marketerForm.email || !marketerForm.password) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      // Logic to create sub-marketer inheriting parent's country/currency/refCode prefix
      const refCode = `${user?.referenceCode}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      
      const { error } = await supabase.from('users').insert({
        name: marketerForm.name,
        email: marketerForm.email,
        password: marketerForm.password, // In real app, this would be handled by auth
        role: 'marketer',
        parent_id: user?.id,
        country: user?.country,
        currency: user?.currency,
        reference_code: refCode,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة المسوق بنجاح' : 'Marketer added successfully');
      setShowMarketerDialog(false);
      setMarketerForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCafeteria = async () => {
    if (!cafeteriaForm.name || !cafeteriaForm.email || !cafeteriaForm.password) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cafeteriaForm.email.trim())) {
      toast.error(isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format');
      return;
    }
    if (cafeteriaForm.password.length < 8) {
      toast.error(isRTL ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const refCode = `${user?.referenceCode}-CAF-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      
      const { error } = await supabase.from('cafeterias').insert({
        name: cafeteriaForm.name,
        loginUsername: cafeteriaForm.email.trim().toLowerCase(),
        passwordHash: cafeteriaForm.password,
        marketerId: user?.id,
        country: user?.country,
        currency: user?.currency,
        referenceCode: refCode,
        subscriptionStatus: 'active',
        createdAt: new Date().toISOString()
      });

      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة الكافيتريا بنجاح' : 'Cafeteria added successfully');
      setShowCafeteriaDialog(false);
      setCafeteriaForm({ name: '', email: '', password: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader title={isRTL ? 'أبنائي' : 'My Downlines'} onMenuClick={() => setMenuOpen(true)} />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="marketers" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-white shadow-sm border">
              <TabsTrigger value="marketers" className="gap-2"><Users className="w-4 h-4" /> {isRTL ? 'المسوقين' : 'Marketers'}</TabsTrigger>
              <TabsTrigger value="cafeterias" className="gap-2"><Store className="w-4 h-4" /> {isRTL ? 'الكافيتريات' : 'Cafeterias'}</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button onClick={() => setShowMarketerDialog(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm">
                <UserPlus className="w-4 h-4" /> {isRTL ? 'إضافة مسوق' : 'Add Marketer'}
              </Button>
              <Button onClick={() => setShowCafeteriaDialog(true)} className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm">
                <Plus className="w-4 h-4" /> {isRTL ? 'إضافة كافيتريا' : 'Add Cafeteria'}
              </Button>
            </div>
          </div>

          <TabsContent value="marketers">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-20 text-gray-400"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : subMarketers.length === 0 ? (
                  <div className="text-center py-20">
                    <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">{isRTL ? 'لا يوجد مسوقين تابعين حالياً' : 'No sub-marketers found'}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{isRTL ? 'الرقم المرجعي' : 'Ref Code'}</TableHead>
                        <TableHead>{isRTL ? 'البلد' : 'Country'}</TableHead>
                        <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subMarketers.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-bold">{m.name}<div className="text-[10px] text-gray-400 font-normal">{m.email}</div></TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-purple-600 border-purple-100">{m.referenceCode}</Badge></TableCell>
                          <TableCell className="text-sm">{m.country}</TableCell>
                          <TableCell className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cafeterias">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-20 text-gray-400"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : subCafeterias.length === 0 ? (
                  <div className="text-center py-20">
                    <Store className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">{isRTL ? 'لا يوجد كافيتريات تابعة حالياً' : 'No sub-cafeterias found'}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>{isRTL ? 'اسم الكافيتريا' : 'Cafeteria Name'}</TableHead>
                        <TableHead>{isRTL ? 'الرقم المرجعي' : 'Ref Code'}</TableHead>
                        <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{isRTL ? 'البلد' : 'Country'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subCafeterias.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-bold">{c.name}</TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-green-600 border-green-100">{c.referenceCode}</Badge></TableCell>
                          <TableCell><Badge className="bg-green-100 text-green-800 border-0">{c.subscriptionStatus}</Badge></TableCell>
                          <TableCell className="text-sm">{c.country}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Marketer Dialog */}
      <Dialog open={showMarketerDialog} onOpenChange={setShowMarketerDialog}>
        <DialogContent className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-600" /> {isRTL ? 'إضافة مسوق تابع جديد' : 'Add New Sub-Marketer'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label><Input value={marketerForm.name} onChange={e => setMarketerForm({...marketerForm, name: e.target.value})} placeholder="John Doe" /></div>
            <div className="space-y-2"><Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label><Input type="email" value={marketerForm.email} onChange={e => setMarketerForm({...marketerForm, email: e.target.value})} placeholder="email@example.com" /></div>
            <div className="space-y-2"><Label>{isRTL ? 'كلمة المرور' : 'Password'}</Label><Input type="password" value={marketerForm.password} onChange={e => setMarketerForm({...marketerForm, password: e.target.value})} /></div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 flex gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <p className="text-[10px] text-purple-700">{isRTL ? `سيرث المسوق الجديد بلدك (${user?.country}) وعملتك (${user?.currency}) تلقائياً.` : `New marketer will inherit your country (${user?.country}) and currency (${user?.currency}) automatically.`}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMarketerDialog(false)} className="flex-1">{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddMarketer} disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">{submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cafeteria Dialog */}
      <Dialog open={showCafeteriaDialog} onOpenChange={setShowCafeteriaDialog}>
        <DialogContent className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Store className="w-5 h-5 text-green-600" /> {isRTL ? 'إضافة كافيتريا تابعة جديدة' : 'Add New Sub-Cafeteria'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>{isRTL ? 'اسم الكافيتريا' : 'Cafeteria Name'}</Label><Input value={cafeteriaForm.name} onChange={e => setCafeteriaForm({...cafeteriaForm, name: e.target.value})} placeholder="My Cafeteria" /></div>
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني (اسم المستخدم)' : 'Email (Login Username)'} <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={cafeteriaForm.email}
                onChange={e => setCafeteriaForm({...cafeteriaForm, email: e.target.value})}
                placeholder="admin@cafeteria.com"
                className={cafeteriaForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cafeteriaForm.email) ? 'border-red-400' : ''}
              />
              {cafeteriaForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cafeteriaForm.email) && (
                <p className="text-xs text-red-500">{isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'كلمة المرور' : 'Password'} <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={cafeteriaForm.password}
                onChange={e => setCafeteriaForm({...cafeteriaForm, password: e.target.value})}
              />
              {cafeteriaForm.password && cafeteriaForm.password.length < 8 && (
                <p className="text-xs text-red-500">{isRTL ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل' : 'Password must be at least 8 characters'}</p>
              )}
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-2">
              <Globe className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-[10px] text-green-700">{isRTL ? `ستتبع الكافيتريا بلدك (${user?.country}) وعملتك (${user?.currency}) تلقائياً.` : `Cafeteria will follow your country (${user?.country}) and currency (${user?.currency}) automatically.`}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCafeteriaDialog(false)} className="flex-1">{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddCafeteria} disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white">{submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
