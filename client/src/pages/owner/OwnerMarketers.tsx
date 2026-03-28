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
  Users, LayoutDashboard, Store, Wallet, BarChart3, Settings,
  Plus, Edit, Trash2, Mail, Phone, RefreshCw, ArrowLeft, Home, AlertCircle
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
}

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const fetchMarketers = async () => {
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
  };

  useEffect(() => {
    if (!authLoading) {
      fetchMarketers();
    }
  }, [authLoading]);

  const handleAddMarketer = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(isRTL ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the user in Supabase Auth first (if needed) or just the record
      // For this system, we usually create the record in the 'marketers' table
      // and the user will sign up or be created via a trigger/edge function.
      const { data, error } = await supabase.from('marketers').insert([
        {
          id: crypto.randomUUID ? crypto.randomUUID() : undefined, // Generate ID
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          is_root: false,
          created_at: new Date().toISOString(),
        },
      ]).select();

      if (error) throw error;
      
      toast.success(isRTL ? 'تم إضافة المسوق بنجاح' : 'Marketer added successfully');
      setShowAddDialog(false);
      setFormData({ name: '', email: '', password: '' });
      fetchMarketers();
    } catch (err: any) {
      console.error('Add marketer error:', err);
      toast.error(err.message || (isRTL ? 'خطأ في إضافة المسوق' : 'Error adding marketer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMarketer = async () => {
    if (!selectedMarketer || !formData.name.trim()) {
      toast.error(isRTL ? 'البيانات غير كاملة' : 'Incomplete data');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('marketers')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
        })
        .eq('id', selectedMarketer.id);

      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث المسوق بنجاح' : 'Marketer updated successfully');
      setShowEditDialog(false);
      fetchMarketers();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تحديث المسوق' : 'Error updating marketer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMarketer = async () => {
    if (!selectedMarketer) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('marketers')
        .delete()
        .eq('id', selectedMarketer.id);

      if (error) throw error;
      toast.success(isRTL ? 'تم حذف المسوق بنجاح' : 'Marketer deleted successfully');
      setShowDeleteDialog(false);
      fetchMarketers();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف المسوق' : 'Error deleting marketer'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (marketer: Marketer) => {
    setSelectedMarketer(marketer);
    setFormData({
      name: marketer.name,
      email: marketer.email,
      password: '',
    });
    setShowEditDialog(true);
  };

  const filteredMarketers = marketers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b-4 border-purple-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-3 rounded-xl shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRTL ? 'إدارة المسوقين' : 'Manage Marketers'}
              </h1>
              <p className="text-xs text-purple-600 font-bold">{isRTL ? 'نظام المالك' : 'Owner System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchMarketers} className="h-10 w-10 text-slate-600 hover:text-purple-600">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLocation('/dashboard/owner')} className="h-10 w-10 text-slate-600 hover:text-purple-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{marketers.length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'إجمالي المسوقين' : 'Total Marketers'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{marketers.filter(m => m.isRoot).length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'مسوقين رئيسيين' : 'Root Marketers'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{marketers.filter(m => !m.isRoot).length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'مسوقين فرعيين' : 'Child Marketers'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Input
            placeholder={isRTL ? 'ابحث عن مسوق...' : 'Search marketer...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => {
              setFormData({ name: '', email: '', password: '' });
              setShowAddDialog(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة مسوق' : 'Add Marketer'}
          </Button>
        </div>

        {/* Marketers Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : filteredMarketers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{isRTL ? 'لا يوجد مسوقين' : 'No marketers found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                      <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                      <TableHead>{isRTL ? 'الرقم المرجعي' : 'Reference Code'}</TableHead>
                      <TableHead>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarketers.map((marketer) => (
                      <TableRow key={marketer.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900">{marketer.name}</TableCell>
                        <TableCell className="text-gray-600 text-sm">{marketer.email}</TableCell>
                        <TableCell>
                          <Badge className={marketer.isRoot ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {marketer.isRoot ? (isRTL ? 'رئيسي' : 'Root') : (isRTL ? 'فرعي' : 'Child')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-purple-600 font-bold">{marketer.referenceCode || '---'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(marketer)} className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedMarketer(marketer); setShowDeleteDialog(true); }} className="h-8 w-8 text-red-600 hover:bg-red-50">
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
            <DialogTitle>{isRTL ? 'إضافة مسوق جديد' : 'Add New Marketer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={isRTL ? 'أدخل الاسم' : 'Enter name'} />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="example@mail.com" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddMarketer} disabled={submitting} className="bg-purple-600 text-white">
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل بيانات المسوق' : 'Edit Marketer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleEditMarketer} disabled={submitting} className="bg-purple-600 text-white">
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
              {isRTL ? `سيتم حذف المسوق "${selectedMarketer?.name}" نهائياً من النظام.` : `This will permanently delete marketer "${selectedMarketer?.name}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMarketer} className="bg-red-600 text-white">
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
