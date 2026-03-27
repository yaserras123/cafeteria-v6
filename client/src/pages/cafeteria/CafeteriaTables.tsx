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
import {
  Table2, LayoutDashboard, UtensilsCrossed, Users, BarChart3, CreditCard, Settings,
  Plus, Edit, Trash2, QrCode, CheckCircle, Clock, AlertCircle, Layers
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
  tableToken?: string;
  cafeteriaId: string;
}

export default function CafeteriaTables() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  const [sections, setSections] = useState<Section[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('all');

  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [showEditTableDialog, setShowEditTableDialog] = useState(false);
  const [showDeleteTableDialog, setShowDeleteTableDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tableForm, setTableForm] = useState({ tableNumber: '', capacity: '4', sectionId: '' });
  const [sectionForm, setSectionForm] = useState({ name: '' });

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
    if (!cafeteriaId) return;
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

  useEffect(() => { fetchData(); }, [cafeteriaId]);

  const handleAddSection = async () => {
    if (!cafeteriaId || !sectionForm.name) {
      toast.error(isRTL ? 'أدخل اسم القسم' : 'Enter section name');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('sections').insert({
        cafeteria_id: cafeteriaId,
        name: sectionForm.name,
        display_order: sections.length,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة القسم' : 'Section added');
      setShowAddSectionDialog(false);
      setSectionForm({ name: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في إضافة القسم' : 'Error adding section'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTable = async () => {
    if (!cafeteriaId || !tableForm.tableNumber || !tableForm.sectionId) {
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
      toast.success(isRTL ? 'تم إضافة الطاولة' : 'Table added');
      setShowAddTableDialog(false);
      setTableForm({ tableNumber: '', capacity: '4', sectionId: '' });
      fetchData();
    } catch (err: any) {
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

  const handleUpdateStatus = async (table: TableItem, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cafeteria_tables')
        .update({ status: newStatus })
        .eq('id', table.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث حالة الطاولة' : 'Table status updated');
      fetchData();
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
    }
  };

  const openEditDialog = (table: TableItem) => {
    setSelectedTable(table);
    setTableForm({
      tableNumber: String(table.tableNumber),
      capacity: String(table.capacity),
      sectionId: table.sectionId,
    });
    setShowEditTableDialog(true);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; labelAr: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
      available: { label: 'Available', labelAr: 'متاحة', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300', icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
      occupied: { label: 'Occupied', labelAr: 'مشغولة', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', icon: <AlertCircle className="w-4 h-4 text-red-600" /> },
      needs_cleaning: { label: 'Needs Cleaning', labelAr: 'تحتاج تنظيف', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-300', icon: <Clock className="w-4 h-4 text-yellow-600" /> },
      reserved: { label: 'Reserved', labelAr: 'محجوزة', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', icon: <Clock className="w-4 h-4 text-blue-600" /> },
    };
    return configs[status] || configs.available;
  };

  const filteredTables = activeSection === 'all'
    ? tables
    : tables.filter(t => t.sectionId === activeSection);

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const needsCleaningCount = tables.filter(t => t.status === 'needs_cleaning').length;

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader
        title={isRTL ? 'إدارة الطاولات' : 'Tables Management'}
        icon={<Table2 className="w-5 h-5" />}
        onMenuToggle={setMenuOpen}
        menuOpen={menuOpen}
      />
      <div className="flex">
        <DashboardNavigation items={navigationItems} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{tables.length}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'إجمالي الطاولات' : 'Total Tables'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{availableCount}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'متاحة' : 'Available'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{occupiedCount}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'مشغولة' : 'Occupied'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{needsCleaningCount}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'تحتاج تنظيف' : 'Needs Cleaning'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveSection('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {isRTL ? 'الكل' : 'All'}
              </button>
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === s.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddSectionDialog(true)}
                className="gap-2"
              >
                <Layers className="w-4 h-4" />
                {isRTL ? 'قسم جديد' : 'New Section'}
              </Button>
              <Button
                onClick={() => {
                  setTableForm({ tableNumber: '', capacity: '4', sectionId: sections[0]?.id || '' });
                  setShowAddTableDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'إضافة طاولة' : 'Add Table'}
              </Button>
            </div>
          </div>

          {/* Tables Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : filteredTables.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="text-center py-12">
                <Table2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{isRTL ? 'لا توجد طاولات بعد' : 'No tables yet'}</p>
                <Button
                  onClick={() => setShowAddTableDialog(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isRTL ? 'أضف أول طاولة' : 'Add First Table'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredTables.map((table) => {
                const config = getStatusConfig(table.status);
                return (
                  <Card
                    key={table.id}
                    className={`border-2 shadow-sm cursor-pointer transition-all hover:shadow-md ${config.bg} ${config.border}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-lg font-bold ${config.color}`}>
                          {isRTL ? `طاولة ${table.tableNumber}` : `Table ${table.tableNumber}`}
                        </span>
                        {config.icon}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {isRTL ? `سعة: ${table.capacity}` : `Cap: ${table.capacity}`}
                      </p>
                      {table.sectionName && (
                        <p className="text-xs text-gray-400 mb-3">{table.sectionName}</p>
                      )}
                      <p className={`text-xs font-semibold mb-3 ${config.color}`}>
                        {isRTL ? config.labelAr : config.label}
                      </p>
                      {/* Status Change */}
                      <Select value={table.status} onValueChange={(v) => handleUpdateStatus(table, v)}>
                        <SelectTrigger className="h-7 text-xs border-gray-200 mb-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">{isRTL ? 'متاحة' : 'Available'}</SelectItem>
                          <SelectItem value="occupied">{isRTL ? 'مشغولة' : 'Occupied'}</SelectItem>
                          <SelectItem value="needs_cleaning">{isRTL ? 'تحتاج تنظيف' : 'Needs Cleaning'}</SelectItem>
                          <SelectItem value="reserved">{isRTL ? 'محجوزة' : 'Reserved'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={() => openEditDialog(table)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => { setSelectedTable(table); setShowDeleteTableDialog(true); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Add Section Dialog */}
      <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة قسم جديد' : 'Add New Section'}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>{isRTL ? 'اسم القسم *' : 'Section Name *'}</Label>
            <Input
              value={sectionForm.name}
              onChange={e => setSectionForm({ name: e.target.value })}
              placeholder={isRTL ? 'مثال: الطابق الأول' : 'e.g. Ground Floor'}
              className="mt-1"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddSectionDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddSection} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? (isRTL ? 'جاري الإضافة...' : 'Adding...') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة طاولة جديدة' : 'Add New Table'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'رقم الطاولة *' : 'Table Number *'}</Label>
              <Input
                type="number"
                value={tableForm.tableNumber}
                onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                placeholder="1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'السعة *' : 'Capacity *'}</Label>
              <Input
                type="number"
                value={tableForm.capacity}
                onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
                placeholder="4"
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'القسم *' : 'Section *'}</Label>
              <Select value={tableForm.sectionId} onValueChange={v => setTableForm({ ...tableForm, sectionId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isRTL ? 'اختر قسماً' : 'Select section'} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sections.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  {isRTL ? 'أضف قسماً أولاً' : 'Add a section first'}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddTableDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddTable}
              disabled={submitting || sections.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (isRTL ? 'جاري الإضافة...' : 'Adding...') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={showEditTableDialog} onOpenChange={setShowEditTableDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل الطاولة' : 'Edit Table'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'رقم الطاولة *' : 'Table Number *'}</Label>
              <Input
                type="number"
                value={tableForm.tableNumber}
                onChange={e => setTableForm({ ...tableForm, tableNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'السعة *' : 'Capacity *'}</Label>
              <Input
                type="number"
                value={tableForm.capacity}
                onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'القسم *' : 'Section *'}</Label>
              <Select value={tableForm.sectionId} onValueChange={v => setTableForm({ ...tableForm, sectionId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditTableDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEditTable} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteTableDialog} onOpenChange={setShowDeleteTableDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `هل أنت متأكد من حذف الطاولة رقم ${selectedTable?.tableNumber}؟`
                : `Are you sure you want to delete Table ${selectedTable?.tableNumber}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-red-600 hover:bg-red-700">
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
