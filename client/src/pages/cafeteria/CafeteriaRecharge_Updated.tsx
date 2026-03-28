import React, { useState, useEffect, useCallback } from 'react';
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
import { CreditCard, LayoutDashboard, UtensilsCrossed, Table2, Users, BarChart3, Settings, Plus, Trash2, Upload, FileText, Image as ImageIcon, Hash, Globe, Wallet, RefreshCw, AlertCircle } from 'lucide-react';
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
  receiptUrl?: string;
  country?: string;
  currency?: string;
  referenceCode?: string;
}

interface CafeteriaInfo {
  id: string;
  name: string;
  referenceCode: string;
  country: string;
  currency: string;
  language: string;
}

export default function CafeteriaRechargeUpdated() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [cafeteriaInfo, setCafeteriaInfo] = useState<CafeteriaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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

  const fetchCafeteriaInfo = useCallback(async () => {
    if (!cafeteriaId) return;
    try {
      const { data } = await supabase
        .from('cafeterias')
        .select('id, name, referenceCode, country, currency, language')
        .eq('id', cafeteriaId)
        .single();
      
      if (data) {
        setCafeteriaInfo(data);
      }
    } catch (err: any) {
      console.error('Error fetching cafeteria info:', err);
    }
  }, [cafeteriaId]);

  const fetchRequests = useCallback(async () => {
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
        receiptUrl: r.receipt_url,
        country: r.country,
        currency: r.currency,
        referenceCode: r.reference_code,
      }));

      setRequests(mapped);
    } catch (err: any) {
      console.error('Error fetching recharge requests:', err);
      toast.error(isRTL ? 'خطأ في تحميل الطلبات' : 'Error loading requests');
    } finally {
      setLoading(false);
    }
  }, [cafeteriaId, isRTL]);

  useEffect(() => {
    if (!authLoading && cafeteriaId) {
      fetchCafeteriaInfo();
      fetchRequests();
    }
  }, [cafeteriaId, authLoading, fetchCafeteriaInfo, fetchRequests]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(isRTL ? 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' : 'File too large (Max 5MB)');
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddRequest = async () => {
    if (!cafeteriaId || !formData.amount || !formData.points) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let receiptUrl = null;
      if (receiptFile) {
        setUploading(true);
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${cafeteriaId}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        receiptUrl = publicUrlData.publicUrl;
        setUploading(false);
      }

      const { error } = await supabase.from('recharge_requests').insert({
        cafeteria_id: cafeteriaId,
        amount: parseFloat(formData.amount),
        points: parseInt(formData.points),
        status: 'pending',
        notes: formData.notes || null,
        receipt_url: receiptUrl,
        country: cafeteriaInfo?.country || null,
        currency: cafeteriaInfo?.currency || null,
        reference_code: cafeteriaInfo?.referenceCode || null,
        requested_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(isRTL ? 'تم إرسال طلب الشحن بنجاح' : 'Recharge request submitted successfully');
      setShowDialog(false);
      setFormData({ amount: '', points: '', notes: '' });
      setReceiptFile(null);
      setReceiptPreview(null);
      fetchRequests();
    } catch (err: any) {
      console.error('Submit request error:', err);
      toast.error(err.message || (isRTL ? 'خطأ في إرسال الطلب' : 'Error submitting request'));
    } finally {
      setSubmitting(false);
      setUploading(false);
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

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className={`min-h-screen bg-gray-50 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader title={isRTL ? 'شحن النقاط' : 'Recharge Points'} onMenuClick={() => setMenuOpen(true)} />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Cafeteria Info Banner */}
        {cafeteriaInfo && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">{isRTL ? 'الرقم المرجعي' : 'Reference Code'}</p>
                    <p className="font-mono font-bold text-blue-600">{cafeteriaInfo.referenceCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">{isRTL ? 'البلد' : 'Country'}</p>
                    <p className="font-bold text-slate-800">{cafeteriaInfo.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">{isRTL ? 'العملة' : 'Currency'}</p>
                    <p className="font-bold text-slate-800">{cafeteriaInfo.currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">{isRTL ? 'الحالة' : 'Status'}</p>
                    <p className="font-bold text-slate-800">{isRTL ? 'نشط' : 'Active'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isRTL ? 'طلبات شحن الرصيد' : 'Recharge Requests'}</h1>
            <p className="text-gray-500 text-sm">{isRTL ? 'إدارة طلبات شحن النقاط ومتابعة حالتها' : 'Manage and track your points recharge requests'}</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md">
            <Plus className="w-4 h-4" /> {isRTL ? 'طلب شحن جديد' : 'New Request'}
          </Button>
        </div>

        {/* Requests Table */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-20 text-gray-400"><RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-20">
                <CreditCard className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{isRTL ? 'لا توجد طلبات شحن' : 'No recharge requests'}</h3>
                <p className="text-gray-500 mb-6">{isRTL ? 'ابدأ بإرسال أول طلب شحن لتفعيل خدماتك' : 'Start by submitting your first recharge request'}</p>
                <Button onClick={() => setShowDialog(true)} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">{isRTL ? 'إرسال طلب الآن' : 'Submit Request Now'}</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>{isRTL ? 'الرقم المرجعي' : 'Ref Code'}</TableHead>
                      <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead>{isRTL ? 'النقاط' : 'Points'}</TableHead>
                      <TableHead>{isRTL ? 'البلد/العملة' : 'Country/Currency'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="text-right">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono font-bold text-blue-600">{req.referenceCode || '---'}</TableCell>
                        <TableCell className="font-bold">{req.amount.toLocaleString()} {req.currency}</TableCell>
                        <TableCell className="font-bold text-green-600">{req.points.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline">{req.country}</Badge>
                            <span className="text-xs text-slate-500">{req.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-xs text-slate-500">{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => { setSelectedRequest(req); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Add Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {isRTL ? 'طلب شحن جديد' : 'New Recharge Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'المبلغ' : 'Amount'}</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'عدد النقاط' : 'Number of Points'}</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.points}
                onChange={e => setFormData({...formData, points: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
              <Input
                placeholder={isRTL ? 'أي ملاحظات إضافية' : 'Any additional notes'}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'إيصال الدفع (اختياري)' : 'Receipt (Optional)'}</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
              {receiptPreview && (
                <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                  <img src={receiptPreview} alt="Receipt preview" className="max-h-32 mx-auto" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddRequest} disabled={submitting || uploading} className="bg-blue-600">
              {submitting || uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isRTL ? 'إرسال' : 'Submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'حذف الطلب' : 'Delete Request'}</AlertDialogTitle>
            <AlertDialogDescription>{isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest} disabled={submitting} className="bg-red-600">{submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isRTL ? 'حذف' : 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
