import React, { useState, useEffect } from 'react';
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
import {
  Store, LayoutDashboard, Users, Wallet, BarChart3, Settings,
  Plus, Edit, Trash2, Eye, RefreshCw, ArrowLeft, Home, AlertCircle
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
}

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
  const [showFreeperiodDialog, setShowFreePeriodDialog] = useState(false);
  const [selectedCafeteria, setSelectedCafeteria] = useState<Cafeteria | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    loginUsername: '',
    password: '',
    country: 'SA',
    currency: 'SAR',
    language: 'ar',
  });

  const [freePeriodData, setFreePeriodData] = useState({
    months: 1,
  });

  const fetchCafeterias = async () => {
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
  };

  useEffect(() => {
    if (!authLoading) {
      fetchCafeterias();
    }
  }, [authLoading]);

  // Email validation helper
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddCafeteria = async () => {
    if (!formData.name.trim()) {
      toast.error(isRTL ? 'اسم الكافيتريا مطلوب' : 'Cafeteria name is required');
      return;
    }

    // loginUsername (email) validation
    if (!formData.loginUsername.trim()) {
      toast.error(isRTL ? 'البريد الإلكتروني (اسم المستخدم) مطلوب' : 'Login email (username) is required');
      return;
    }

    if (!isValidEmail(formData.loginUsername.trim())) {
      toast.error(isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format');
      return;
    }

    // Password validation (min 8 chars)
    if (formData.password.length < 8) {
      toast.error(isRTL ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل' : 'Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);
    try {
      let insertData: any = {
        id: crypto.randomUUID ? crypto.randomUUID() : undefined,
        name: formData.name.trim(),
        location: formData.location.trim() || null,
        loginUsername: formData.loginUsername.trim().toLowerCase(),
        passwordHash: formData.password,
        subscriptionStatus: 'active',
        pointsBalance: '0',
        createdAt: new Date().toISOString(),
      };

      if (user?.role === 'owner') {
        // Owner creates Level 1 Cafeterias
        insertData.marketerId = 'owner';
        insertData.country = formData.country.trim().substring(0, 2).toUpperCase();
        insertData.currency = formData.currency.trim().substring(0, 3).toUpperCase();
        insertData.language = formData.language;
      } else {
        // Marketer creates Cafeterias (Inheritance)
        const { data: currentUserMarketer, error: fetchError } = await supabase
          .from('marketers')
          .select('id, country, currency, language')
          .eq('email', user?.email)
          .single();

        if (fetchError) throw new Error(isRTL ? 'فشل في جلب بيانات المسوق الحالي' : 'Failed to fetch current marketer data');

        insertData.marketerId = currentUserMarketer.id;
        insertData.country = currentUserMarketer.country;
        insertData.currency = currentUserMarketer.currency;
        insertData.language = currentUserMarketer.language;
      }

      const { data, error } = await supabase.from('cafeterias').insert([insertData]).select();

      if (error) throw error;
      
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

  const handleEditCafeteria = async () => {
    if (!selectedCafeteria || !formData.name.trim()) {
      toast.error(isRTL ? 'البيانات غير كاملة' : 'Incomplete data');
      return;
    }

    // Validate loginUsername if provided
    if (formData.loginUsername.trim() && !isValidEmail(formData.loginUsername.trim())) {
      toast.error(isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format');
      return;
    }

    setSubmitting(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        location: formData.location.trim() || null,
      };

      if (formData.loginUsername.trim()) {
        updateData.loginUsername = formData.loginUsername.trim().toLowerCase();
      }

      const { error } = await supabase
        .from('cafeterias')
        .update(updateData)
        .eq('id', selectedCafeteria.id);

      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث الكافيتريا بنجاح' : 'Cafeteria updated successfully');
      setShowEditDialog(false);
      fetchCafeterias();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تحديث الكافيتريا' : 'Error updating cafeteria'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCafeteria = async () => {
    if (!selectedCafeteria) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('cafeterias')
        .delete()
        .eq('id', selectedCafeteria.id);

      if (error) throw error;
      toast.success(isRTL ? 'تم حذف الكافيتريا بنجاح' : 'Cafeteria deleted successfully');
      setShowDeleteDialog(false);
      fetchCafeterias();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الكافيتريا' : 'Error deleting cafeteria'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrantFreePeriod = async () => {
    if (!selectedCafeteria) return;

    setSubmitting(true);
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + freePeriodData.months);

      const { error } = await supabase
        .from('cafeterias')
        .update({
          free_operation_end_date: endDate.toISOString(),
        })
        .eq('id', selectedCafeteria.id);

      if (error) throw error;
      toast.success(isRTL ? 'تم منح الفترة المجانية بنجاح' : 'Free period granted successfully');
      setShowFreePeriodDialog(false);
      setFreePeriodData({ months: 1 });
      fetchCafeterias();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في منح الفترة المجانية' : 'Error granting free period'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (cafeteria: Cafeteria) => {
    setSelectedCafeteria(cafeteria);
    setFormData({
      name: cafeteria.name,
      location: cafeteria.location || '',
      loginUsername: cafeteria.loginUsername || '',
      password: '',
      country: 'SA',
      currency: 'SAR',
      language: 'ar',
    });
    setShowEditDialog(true);
  };

  const filteredCafeterias = cafeterias.filter((c) => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b-4 border-blue-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRTL ? 'إدارة الكافيتريات' : 'Manage Cafeterias'}
              </h1>
              <p className="text-xs text-blue-600 font-bold">{isRTL ? 'نظام المالك' : 'Owner System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchCafeterias} className="h-10 w-10 text-slate-600 hover:text-blue-600">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard/owner')} className="h-10 w-10 text-slate-600 hover:text-blue-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black">{cafeterias.length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'إجمالي الكافيتريات' : 'Total Cafeterias'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black">{cafeterias.filter(c => c.subscriptionStatus === 'active').length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'نشطة' : 'Active'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black">{cafeterias.filter(c => c.freeOperationEndDate && new Date(c.freeOperationEndDate) > new Date()).length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'فترة مجانية' : 'Free Period'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black">{cafeterias.filter(c => c.subscriptionStatus !== 'active').length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'غير نشطة' : 'Inactive'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Input
            placeholder={isRTL ? 'ابحث عن كافيتريا...' : 'Search cafeteria...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => {
              setFormData({ name: '', location: '', loginUsername: '', password: '', country: 'SA', currency: 'SAR', language: 'ar' });
              setShowAddDialog(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة كافيتريا' : 'Add Cafeteria'}
          </Button>
        </div>

        {/* Cafeterias Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : filteredCafeterias.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{isRTL ? 'لا يوجد كافيتريات' : 'No cafeterias found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{isRTL ? 'الموقع' : 'Location'}</TableHead>
                      <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email (Username)'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCafeterias.map((cafeteria) => (
                      <TableRow key={cafeteria.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900">{cafeteria.name}</TableCell>
                        <TableCell className="text-gray-600 text-sm">{cafeteria.location || '---'}</TableCell>
                        <TableCell className="text-gray-600 text-sm font-mono">{cafeteria.loginUsername || '---'}</TableCell>
                        <TableCell>
                          <Badge variant={(cafeteria.subscriptionStatus || 'active') === 'active' ? 'outline' : 'secondary'} className={(cafeteria.subscriptionStatus || 'active') === 'active' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                            {(cafeteria.subscriptionStatus || 'active') === 'active' ? (isRTL ? 'نشطة' : 'Active') : (isRTL ? 'متوقفة' : 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(cafeteria)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedCafeteria(cafeteria); setShowDeleteDialog(true); }} className="h-8 w-8 text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة كافيتريا جديدة' : 'Add New Cafeteria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم الكافيتريا' : 'Cafeteria Name'} <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isRTL ? 'أدخل الاسم' : 'Enter name'}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'الموقع / العنوان' : 'Location / Address'}</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={isRTL ? 'أدخل الموقع' : 'Enter location'}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني (اسم المستخدم)' : 'Email (Login Username)'} <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={formData.loginUsername}
                onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                placeholder="admin@cafeteria.com"
                className={formData.loginUsername && !isValidEmail(formData.loginUsername) ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {formData.loginUsername && !isValidEmail(formData.loginUsername) && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'كلمة المرور' : 'Password'} <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
              {formData.password && formData.password.length < 8 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {isRTL ? 'كلمة المرور يجب أن تكون 8 خانات على الأقل' : 'Password must be at least 8 characters'}
                </p>
              )}
            </div>
            {user?.role === 'owner' && (
              <>
                <div className="space-y-2">
                  <Label>{isRTL ? 'البلد' : 'Country'}</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="SA, EG, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'العملة' : 'Currency'}</Label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="SAR, EGP, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'اللغة' : 'Language'}</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button
              onClick={handleAddCafeteria}
              disabled={submitting}
              className="bg-blue-600 text-white"
            >
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل بيانات الكافيتريا' : 'Edit Cafeteria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اسم الكافيتريا' : 'Cafeteria Name'}</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'الموقع / العنوان' : 'Location / Address'}</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني (اسم المستخدم)' : 'Email (Login Username)'}</Label>
              <Input
                type="email"
                value={formData.loginUsername}
                onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                placeholder="admin@cafeteria.com"
                className={formData.loginUsername && !isValidEmail(formData.loginUsername) ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {formData.loginUsername && !isValidEmail(formData.loginUsername) && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleEditCafeteria} disabled={submitting} className="bg-blue-600 text-white">
              {submitting ? '...' : (isRTL ? 'حفظ التعديلات' : 'Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? `سيتم حذف الكافيتريا "${selectedCafeteria?.name}" نهائياً من النظام.` : `This will permanently delete cafeteria "${selectedCafeteria?.name}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCafeteria} className="bg-red-600 text-white">
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
