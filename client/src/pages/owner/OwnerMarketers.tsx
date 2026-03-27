import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
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
  Plus, Edit, Trash2, Mail, Phone, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Marketer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
  cafeterias_count?: number;
}

export default function OwnerMarketers() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
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
    phone: '',
    password: '',
  });

  const fetchMarketers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketers')
        .select('*')
        .order('created_at', { ascending: false });

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
    fetchMarketers();
  }, []);

  const handleAddMarketer = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error(isRTL ? 'الاسم والبريد الإلكتروني مطلوبان' : 'Name and email are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('marketers').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          status: 'active',
        },
      ]);

      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة المسوق بنجاح' : 'Marketer added successfully');
      setShowAddDialog(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
      fetchMarketers();
    } catch (err: any) {
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
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
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
      phone: marketer.phone || '',
      password: '',
    });
    setShowEditDialog(true);
  };

  const filteredMarketers = marketers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchMarketers}
              className="h-10 w-10 text-slate-600 hover:text-purple-600"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{marketers.length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'إجمالي المسوقين' : 'Total Marketers'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{marketers.filter(m => m.status === 'active').length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'نشطين' : 'Active'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{marketers.reduce((acc, m) => acc + (m.cafeterias_count || 0), 0)}</p>
              <p className="text-xs opacity-80">{isRTL ? 'كافيتريات' : 'Cafeterias'}</p>
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
              setFormData({ name: '', email: '', phone: '', password: '' });
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
                      <TableHead>{isRTL ? 'الهاتف' : 'Phone'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarketers.map((marketer) => (
                      <TableRow key={marketer.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900">{marketer.name}</TableCell>
                        <TableCell className="text-gray-600 text-sm">{marketer.email}</TableCell>
                        <TableCell className="text-gray-600 text-sm">{marketer.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${marketer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-none text-xs font-bold`}>
                            {isRTL ? (marketer.status === 'active' ? 'نشط' : 'غير نشط') : (marketer.status === 'active' ? 'Active' : 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(marketer.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => openEditDialog(marketer)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => {
                                setSelectedMarketer(marketer);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
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
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة مسوق جديد' : 'Add New Marketer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'الاسم' : 'Name'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isRTL ? 'اسم المسوق' : 'Marketer name'}
              />
            </div>
            <div>
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
              />
            </div>
            <div>
              <Label>{isRTL ? 'الهاتف' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={isRTL ? 'رقم الهاتف' : 'Phone number'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddMarketer} disabled={submitting}>
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل المسوق' : 'Edit Marketer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'الاسم' : 'Name'}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>{isRTL ? 'الهاتف' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEditMarketer} disabled={submitting}>
              {submitting ? '...' : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'حذف المسوق' : 'Delete Marketer'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? `هل أنت متأكد من حذف "${selectedMarketer?.name}"؟` : `Are you sure you want to delete "${selectedMarketer?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMarketer} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? '...' : (isRTL ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
