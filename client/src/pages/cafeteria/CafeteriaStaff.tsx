import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Users, LayoutDashboard, UtensilsCrossed, Table2, BarChart3, CreditCard, Settings,
  Plus, MoreVertical, Edit, Trash2, Lock, Unlock, ChefHat, UserCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  loginUsername: string;
  phone?: string;
  status: string;
  canLogin: boolean;
  cafeteriaId: string;
}

export default function CafeteriaStaff() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: 'waiter',
    loginUsername: '',
    password: '',
    phone: '',
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

  const fetchStaff = async () => {
    if (!cafeteriaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cafeteria_staff')
        .select('*')
        .eq('cafeteria_id', cafeteriaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        loginUsername: s.login_username,
        phone: s.phone,
        status: s.status,
        canLogin: s.can_login,
        cafeteriaId: s.cafeteria_id,
      }));
      setStaffList(mapped);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
      toast.error(isRTL ? 'خطأ في تحميل بيانات الموظفين' : 'Error loading staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [cafeteriaId]);

  const handleAddStaff = async () => {
    if (!cafeteriaId) return;
    if (!formData.name || !formData.loginUsername || !formData.password) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('cafeteria_staff').insert({
        cafeteria_id: cafeteriaId,
        name: formData.name,
        role: formData.role,
        login_username: formData.loginUsername,
        password_hash: formData.password,
        phone: formData.phone || null,
        status: 'active',
        can_login: true,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة الموظف بنجاح' : 'Staff member added successfully');
      setShowAddDialog(false);
      setFormData({ name: '', role: 'waiter', loginUsername: '', password: '', phone: '' });
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في إضافة الموظف' : 'Error adding staff'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const updates: any = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone || null,
      };
      if (formData.password) {
        updates.password_hash = formData.password;
      }
      const { error } = await supabase
        .from('cafeteria_staff')
        .update(updates)
        .eq('id', selectedStaff.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث بيانات الموظف' : 'Staff member updated');
      setShowEditDialog(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تحديث الموظف' : 'Error updating staff'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('cafeteria_staff')
        .delete()
        .eq('id', selectedStaff.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم حذف الموظف' : 'Staff member deleted');
      setShowDeleteDialog(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الموظف' : 'Error deleting staff'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLogin = async (staff: StaffMember) => {
    try {
      const { error } = await supabase
        .from('cafeteria_staff')
        .update({ can_login: !staff.canLogin })
        .eq('id', staff.id);
      if (error) throw error;
      toast.success(
        staff.canLogin
          ? (isRTL ? 'تم تعطيل تسجيل الدخول' : 'Login disabled')
          : (isRTL ? 'تم تفعيل تسجيل الدخول' : 'Login enabled')
      );
      fetchStaff();
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في تغيير الصلاحية' : 'Error toggling login');
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('cafeteria_staff')
        .update({ status: newStatus })
        .eq('id', staff.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تغيير حالة الموظف' : 'Status updated');
      fetchStaff();
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في تغيير الحالة' : 'Error updating status');
    }
  };

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      loginUsername: staff.loginUsername,
      password: '',
      phone: staff.phone || '',
    });
    setShowEditDialog(true);
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; labelAr: string; color: string }> = {
      cafeteria_admin: { label: 'Admin', labelAr: 'مدير كافيتريا', color: 'bg-purple-100 text-purple-700' },
      manager: { label: 'Manager', labelAr: 'مدير', color: 'bg-blue-100 text-blue-700' },
      waiter: { label: 'Waiter', labelAr: 'نادل', color: 'bg-green-100 text-green-700' },
      chef: { label: 'Chef', labelAr: 'شيف', color: 'bg-orange-100 text-orange-700' },
    };
    const r = roleMap[role] || { label: role, labelAr: role, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.color}`}>
        {isRTL ? r.labelAr : r.label}
      </span>
    );
  };

  const activeCount = staffList.filter(s => s.status === 'active').length;
  const waitersCount = staffList.filter(s => s.role === 'waiter').length;
  const chefsCount = staffList.filter(s => s.role === 'chef').length;

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader
        title={isRTL ? 'إدارة الموظفين' : 'Staff Management'}
        icon={<Users className="w-5 h-5" />}
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
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{staffList.length}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'إجمالي الموظفين' : 'Total Staff'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'نشط' : 'Active'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{waitersCount}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'نادلين' : 'Waiters'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{chefsCount}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'شيفات' : 'Chefs'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-bold text-gray-800">
                {isRTL ? 'قائمة الموظفين' : 'Staff List'}
              </CardTitle>
              <Button
                onClick={() => {
                  setFormData({ name: '', role: 'waiter', loginUsername: '', password: '', phone: '' });
                  setShowAddDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'إضافة موظف' : 'Add Staff'}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  {isRTL ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">{isRTL ? 'لا يوجد موظفون بعد' : 'No staff members yet'}</p>
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isRTL ? 'أضف أول موظف' : 'Add First Staff'}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'الدور' : 'Role'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'اسم المستخدم' : 'Username'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'الهاتف' : 'Phone'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'تسجيل الدخول' : 'Login'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.map((staff) => (
                        <TableRow key={staff.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-800">{staff.name}</TableCell>
                          <TableCell>{getRoleBadge(staff.role)}</TableCell>
                          <TableCell className="text-gray-600 font-mono text-sm">{staff.loginUsername}</TableCell>
                          <TableCell className="text-gray-600">{staff.phone || '-'}</TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                staff.status === 'active'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {staff.status === 'active' ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={staff.canLogin}
                                onCheckedChange={() => handleToggleLogin(staff)}
                              />
                              <span className="text-xs text-gray-500">
                                {staff.canLogin ? (isRTL ? 'مفعّل' : 'On') : (isRTL ? 'معطّل' : 'Off')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                                <DropdownMenuItem onClick={() => openEditDialog(staff)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {isRTL ? 'تعديل' : 'Edit'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleLogin(staff)}
                                  className={staff.canLogin ? 'text-orange-600' : 'text-green-600'}
                                >
                                  {staff.canLogin ? (
                                    <><Lock className="w-4 h-4 mr-2" />{isRTL ? 'تعطيل الدخول' : 'Disable Login'}</>
                                  ) : (
                                    <><Unlock className="w-4 h-4 mr-2" />{isRTL ? 'تفعيل الدخول' : 'Enable Login'}</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setSelectedStaff(staff); setShowDeleteDialog(true); }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {isRTL ? 'حذف' : 'Delete'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة موظف جديد' : 'Add New Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'الاسم *' : 'Name *'}</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder={isRTL ? 'اسم الموظف' : 'Staff name'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'الدور *' : 'Role *'}</Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">{isRTL ? 'نادل' : 'Waiter'}</SelectItem>
                  <SelectItem value="chef">{isRTL ? 'شيف' : 'Chef'}</SelectItem>
                  <SelectItem value="manager">{isRTL ? 'مدير' : 'Manager'}</SelectItem>
                  <SelectItem value="cafeteria_admin">{isRTL ? 'مدير كافيتريا' : 'Cafeteria Admin'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'اسم المستخدم *' : 'Username *'}</Label>
              <Input
                value={formData.loginUsername}
                onChange={e => setFormData({ ...formData, loginUsername: e.target.value })}
                placeholder={isRTL ? 'اسم الدخول' : 'Login username'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'كلمة المرور *' : 'Password *'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder={isRTL ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddStaff} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? (isRTL ? 'جاري الإضافة...' : 'Adding...') : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل بيانات الموظف' : 'Edit Staff Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'الاسم *' : 'Name *'}</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'الدور *' : 'Role *'}</Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">{isRTL ? 'نادل' : 'Waiter'}</SelectItem>
                  <SelectItem value="chef">{isRTL ? 'شيف' : 'Chef'}</SelectItem>
                  <SelectItem value="manager">{isRTL ? 'مدير' : 'Manager'}</SelectItem>
                  <SelectItem value="cafeteria_admin">{isRTL ? 'مدير كافيتريا' : 'Cafeteria Admin'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'New Password (leave blank to keep)'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={isRTL ? 'كلمة مرور جديدة' : 'New password'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
              <Input
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleEditStaff} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? `هل أنت متأكد من حذف الموظف "${selectedStaff?.name}"؟ لا يمكن التراجع.`
                : `Are you sure you want to delete "${selectedStaff?.name}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700">
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
