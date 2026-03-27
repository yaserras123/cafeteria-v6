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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CreditCard, LayoutDashboard, UtensilsCrossed, Table2, Users, BarChart3, Settings, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface RechargeRequest {
  id: string;
  cafeteriaId: string;
  amount: number;
  points: number;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  notes?: string;
}

export default function CafeteriaRecharge() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    points: '',
    notes: '',
  });

  const isRTL = language === 'ar';
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

  const fetchRequests = async () => {
    if (!cafeteriaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recharge_requests')
        .select('*')
        .eq('cafeteria_id', cafeteriaId)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        cafeteriaId: r.cafeteria_id,
        amount: r.amount,
        points: r.points,
        status: r.status,
        requestedAt: r.requested_at,
        approvedAt: r.approved_at,
        notes: r.notes,
      }));

      setRequests(mapped);
    } catch (err: any) {
      console.error('Error fetching recharge requests:', err);
      toast.error(isRTL ? 'خطأ في تحميل الطلبات' : 'Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [cafeteriaId]);

  const handleAddRequest = async () => {
    if (!cafeteriaId || !formData.amount || !formData.points) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('recharge_requests').insert({
        cafeteria_id: cafeteriaId,
        amount: parseFloat(formData.amount),
        points: parseInt(formData.points),
        status: 'pending',
        notes: formData.notes || null,
        requested_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(isRTL ? 'تم إرسال طلب الشحن بنجاح' : 'Recharge request submitted successfully');
      setShowDialog(false);
      setFormData({ amount: '', points: '', notes: '' });
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في إرسال الطلب' : 'Error submitting request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('recharge_requests')
        .delete()
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(isRTL ? 'تم حذف الطلب' : 'Request deleted');
      setShowDeleteDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الطلب' : 'Error deleting request'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">{isRTL ? 'معلق' : 'Pending'}</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-0">{isRTL ? 'موافق عليه' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-0">{isRTL ? 'مرفوض' : 'Rejected'}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">{status}</Badge>;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader title={isRTL ? 'شحن النقاط' : 'Recharge Points'} icon={<CreditCard className="w-5 h-5" />} onMenuToggle={setMenuOpen} menuOpen={menuOpen} />
      <div className="flex">
        <DashboardNavigation items={navigationItems} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-8">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{isRTL ? 'طلبات الشحن' : 'Recharge Requests'}</h2>
            <Button onClick={() => setShowDialog(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              {isRTL ? 'طلب شحن جديد' : 'New Request'}
            </Button>
          </div>

          {/* Add Request Dialog */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className={isRTL ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle>{isRTL ? 'طلب شحن نقاط جديد' : 'New Recharge Request'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{isRTL ? 'المبلغ' : 'Amount'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder={isRTL ? 'المبلغ بالعملة' : 'Amount in currency'}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'عدد النقاط' : 'Number of Points'}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder={isRTL ? 'عدد النقاط' : 'Points'}
                  />
                </div>
                <div>
                  <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={isRTL ? 'ملاحظات إضافية' : 'Additional notes'}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleAddRequest} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  {submitting ? '...' : (isRTL ? 'إرسال' : 'Submit')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isRTL ? 'حذف الطلب' : 'Delete Request'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRequest} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                  {submitting ? '...' : (isRTL ? 'حذف' : 'Delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Requests Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{isRTL ? 'لا توجد طلبات' : 'No requests found'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                        <TableHead>{isRTL ? 'النقاط' : 'Points'}</TableHead>
                        <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{isRTL ? 'تاريخ الطلب' : 'Requested Date'}</TableHead>
                        <TableHead>{isRTL ? 'الملاحظات' : 'Notes'}</TableHead>
                        <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-gray-50">
                          <TableCell className="font-semibold">{request.amount.toFixed(2)}</TableCell>
                          <TableCell>{request.points}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(request.requestedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{request.notes || '-'}</TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
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
    </div>
  );
}
