import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table2, LayoutDashboard, UtensilsCrossed, Users, BarChart3, CreditCard, Settings,
  Plus, Edit, Trash2, QrCode, Layers, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Section {
  id: string;
  name: string;
  cafeteriaId: string;
}

interface TableItem {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
  sectionId: string;
  sectionName?: string;
  tableToken: string;
  cafeteriaId: string;
}

export default function CafeteriaTables() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  const [sections, setSections] = useState<Section[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [showEditTableDialog, setShowEditTableDialog] = useState(false);
  const [showDeleteTableDialog, setShowDeleteTableDialog] = useState(false);

  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [sectionForm, setSectionForm] = useState({ name: '' });
  const [tableForm, setTableForm] = useState({ tableNumber: '', capacity: '4', sectionId: '' });

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

  const fetchData = async () => {
    if (!cafeteriaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sectionsRes, tablesRes] = await Promise.all([
        supabase.from('sections').select('*').eq('cafeteria_id', cafeteriaId).order('display_order'),
        supabase.from('cafeteria_tables').select('*, sections(name)').eq('cafeteria_id', cafeteriaId).order('table_number'),
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (tablesRes.error) throw tablesRes.error;

      setSections((sectionsRes.data || []).map((s: any) => ({
        id: s.id, name: s.name, cafeteriaId: s.cafeteria_id,
      })));
      
      setTables((tablesRes.data || []).map((t: any) => ({
        id: t.id,
        tableNumber: t.table_number,
        capacity: t.capacity,
        status: t.status,
        sectionId: t.section_id,
        sectionName: t.sections?.name,
        tableToken: t.table_token,
        cafeteriaId: t.cafeteria_id,
      })));
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && cafeteriaId) {
      fetchData();
    }
  }, [cafeteriaId, authLoading]);

  const handleAddSection = async () => {
    if (!cafeteriaId) {
      toast.error(isRTL ? 'معرف الكافيتيريا مفقود' : 'Cafeteria ID is missing');
      return;
    }
    if (!sectionForm.name.trim()) {
      toast.error(isRTL ? 'أدخل اسم القسم' : 'Enter section name');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sections').insert({
        cafeteria_id: cafeteriaId,
        name: sectionForm.name.trim(),
        display_order: sections.length,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      toast.success(isRTL ? 'تم إضافة القسم بنجاح' : 'Section added successfully');
      setShowAddSectionDialog(false);
      setSectionForm({ name: '' });
      fetchData();
    } catch (err: any) {
      console.error('Add section error:', err);
      toast.error(err.message || (isRTL ? 'خطأ في إضافة القسم' : 'Error adding section'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTable = async () => {
    if (!cafeteriaId) {
      toast.error(isRTL ? 'معرف الكافيتيريا مفقود' : 'Cafeteria ID is missing');
      return;
    }
    if (!tableForm.tableNumber || !tableForm.sectionId) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      const tableToken = Math.random().toString(36).substring(2, 34);
      const { error } = await supabase.from('cafeteria_tables').insert({
        cafeteria_id: cafeteriaId,
        section_id: tableForm.sectionId,
        table_number: parseInt(tableForm.tableNumber),
        capacity: parseInt(tableForm.capacity),
        status: 'available',
        table_token: tableToken,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      
      toast.success(isRTL ? 'تم إضافة الطاولة بنجاح' : 'Table added successfully');
      setShowAddTableDialog(false);
      setTableForm({ tableNumber: '', capacity: '4', sectionId: '' });
      fetchData();
    } catch (err: any) {
      console.error('Add table error:', err);
      toast.error(err.message || (isRTL ? 'خطأ في إضافة الطاولة' : 'Error adding table'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTable = async () => {
    if (!selectedTable) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('cafeteria_tables')
        .update({
          table_number: parseInt(tableForm.tableNumber),
          capacity: parseInt(tableForm.capacity),
          section_id: tableForm.sectionId,
        })
        .eq('id', selectedTable.id);
      
      if (error) throw error;
      
      toast.success(isRTL ? 'تم تحديث الطاولة' : 'Table updated');
      setShowEditTableDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تحديث الطاولة' : 'Error updating table'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('cafeteria_tables')
        .delete()
        .eq('id', selectedTable.id);
      
      if (error) throw error;
      
      toast.success(isRTL ? 'تم حذف الطاولة' : 'Table deleted');
      setShowDeleteTableDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الطاولة' : 'Error deleting table'));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditTableDialog = (table: TableItem) => {
    setSelectedTable(table);
    setTableForm({
      tableNumber: String(table.tableNumber),
      capacity: String(table.capacity),
      sectionId: table.sectionId,
    });
    setShowEditTableDialog(true);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!cafeteriaId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{isRTL ? 'خطأ في الصلاحيات' : 'Permission Error'}</h1>
        <p className="text-slate-600 max-w-md">
          {isRTL 
            ? 'لم يتم العثور على معرف الكافيتيريا الخاص بحسابك. يرجى التواصل مع الإدارة لتحديث بيانات حسابك.' 
            : 'No cafeteria ID found for your account. Please contact administration to update your account details.'}
        </p>
        <Button onClick={() => window.location.href = '/'} className="mt-6 bg-blue-600 text-white">
          {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader title={isRTL ? 'إدارة الطاولات' : 'Tables Management'} onMenuClick={() => setMenuOpen(true)} />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isRTL ? 'الطاولات والأقسام' : 'Tables & Sections'}</h1>
            <p className="text-slate-500">{isRTL ? 'تنظيم طاولات الكافيتيريا وتوزيعها على الأقسام' : 'Organize tables and assign them to sections'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddSectionDialog(true)} variant="outline" className="flex items-center gap-2">
              <Layers className="w-4 h-4" /> {isRTL ? 'إضافة قسم' : 'Add Section'}
            </Button>
            <Button onClick={() => setShowAddTableDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> {isRTL ? 'إضافة طاولة' : 'Add Table'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : tables.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => (
              <Card key={table.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl">
                      {table.tableNumber}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditTableDialog(table)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelectedTable(table); setShowDeleteTableDialog(true); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{isRTL ? 'القسم:' : 'Section:'}</span>
                      <span className="font-medium text-slate-900">{table.sectionName || (isRTL ? 'غير محدد' : 'Unassigned')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{isRTL ? 'السعة:' : 'Capacity:'}</span>
                      <span className="font-medium text-slate-900">{table.capacity} {isRTL ? 'أشخاص' : 'Persons'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{isRTL ? 'الحالة:' : 'Status:'}</span>
                      <Badge variant={table.status === 'available' ? 'outline' : 'secondary'} className={table.status === 'available' ? 'text-green-600 border-green-200 bg-green-50' : ''}>
                        {table.status === 'available' ? (isRTL ? 'متاحة' : 'Available') : (isRTL ? 'مشغولة' : 'Occupied')}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4 flex items-center justify-center gap-2 text-xs py-1 h-8">
                    <QrCode className="w-3.5 h-3.5" /> {isRTL ? 'عرض رمز QR' : 'View QR Code'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Table2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">{isRTL ? 'لا توجد طاولات' : 'No tables found'}</h3>
            <p className="text-slate-500 mb-6">{isRTL ? 'ابدأ بإضافة طاولات الكافيتيريا وتنظيمها' : 'Start by adding and organizing your cafeteria tables'}</p>
            <Button onClick={() => setShowAddTableDialog(true)} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> {isRTL ? 'إضافة أول طاولة' : 'Add First Table'}
            </Button>
          </Card>
        )}
      </main>

      {/* Add Section Dialog */}
      <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'إضافة قسم جديد' : 'Add New Section'}</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>{isRTL ? 'اسم القسم *' : 'Section Name *'}</Label>
            <Input 
              value={sectionForm.name} 
              onChange={e => setSectionForm({ name: e.target.value })} 
              className="mt-1" 
              placeholder={isRTL ? 'مثال: الصالة الرئيسية' : 'e.g. Main Hall'}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddSectionDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddSection} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'إضافة طاولة جديدة' : 'Add New Table'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'رقم الطاولة *' : 'Table Number *'}</Label>
              <Input type="number" value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>{isRTL ? 'القسم *' : 'Section *'}</Label>
              <Select value={tableForm.sectionId} onValueChange={v => setTableForm({ ...tableForm, sectionId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر قسماً' : 'Select section'} /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {sections.length === 0 && (
                <p className="text-[10px] text-red-500 mt-1">{isRTL ? 'يجب إضافة قسم أولاً' : 'Add a section first'}</p>
              )}
            </div>
            <div>
              <Label>{isRTL ? 'السعة (أشخاص)' : 'Capacity (Persons)'}</Label>
              <Input type="number" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddTableDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddTable} disabled={submitting || sections.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={showEditTableDialog} onOpenChange={setShowEditTableDialog}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'تعديل الطاولة' : 'Edit Table'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'رقم الطاولة *' : 'Table Number *'}</Label>
              <Input type="number" value={tableForm.tableNumber} onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>{isRTL ? 'القسم *' : 'Section *'}</Label>
              <Select value={tableForm.sectionId} onValueChange={v => setTableForm({ ...tableForm, sectionId: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'السعة (أشخاص)' : 'Capacity (Persons)'}</Label>
              <Input type="number" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditTableDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleEditTable} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Table */}
      <AlertDialog open={showDeleteTableDialog} onOpenChange={setShowDeleteTableDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'حذف الطاولة' : 'Delete Table'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? `هل تريد حذف الطاولة رقم ${selectedTable?.tableNumber}؟` : `Delete table number ${selectedTable?.tableNumber}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-red-600 hover:bg-red-700">{isRTL ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
