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
import { CreditCard, LayoutDashboard, UtensilsCrossed, Table2, Users, BarChart3, Settings, Plus, Trash2, Upload, FileText, Image as ImageIcon, Hash, Globe, Wallet } from 'lucide-react';
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

export default function CafeteriaRecharge() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
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
      fetchRequests();
    }
  }, [cafeteriaId, authLoading, fetchRequests]);

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

      // Get current cafeteria info for country/currency/refCode
      const { data: cafData } = await supabase.from('cafeterias').select('*').eq('id', cafeteriaId).single();

      const { error } = await supabase.from('recharge_requests').insert({
        cafeteria_id: cafeteriaId,
        amount: parseFloat(formData.amount),
        points: parseInt(formData.points),
        status: 'pending',
        notes: formData.notes || null,
        receipt_url: receiptUrl,
        country: cafData?.country || null,
        currency: cafData?.currency || null,
        reference_code: cafData?.reference_code || null,
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
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader showBackButton={true} showHomeButton={true} title={isRTL ? 'شحن النقاط' : 'Recharge Points'} onMenuClick={() => setMenuOpen(true)} showBackButton={true} showHomeButton={true} />
      <DashboardNavigation isOpen={menuOpen} onClose={() => setMenuOpen(false)} items={navigationItems} />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
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
              <div className="text-center py-20 text-gray-400"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
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
                      <TableHead>{isRTL ? 'البيانات' : 'Details'}</TableHead>
                      <TableHead>{isRTL ? 'المبلغ والعملة' : 'Amount & Currency'}</TableHead>
                      <TableHead>{isRTL ? 'النقاط' : 'Points'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="text-center">{isRTL ? 'الإيصال' : 'Receipt'}</TableHead>
                      <TableHead className="text-center">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-[10px] font-mono text-blue-600 font-bold"><Hash className="w-3 h-3" /> {request.referenceCode || '---'}</div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500"><Globe className="w-3 h-3" /> {request.country || '---'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-gray-900">{request.amount.toFixed(2)} <span className="text-[10px] text-gray-500 font-normal">{request.currency}</span></TableCell>
                        <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{request.points} {isRTL ? 'نقطة' : 'Pts'}</Badge></TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-xs text-gray-500">{new Date(request.requestedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</TableCell>
                        <TableCell className="text-center">
                          {request.receiptUrl ? (
                            <a href={request.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"><ImageIcon className="w-4 h-4" /></a>
                          ) : <span className="text-gray-300">-</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {request.status === 'pending' && (
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedRequest(request); setShowDeleteDialog(true); }} className="text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
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

        {/* Add Request Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className={`max-w-md ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> {isRTL ? 'طلب شحن نقاط جديد' : 'New Recharge Request'}</DialogTitle></DialogHeader>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase">{isRTL ? 'المبلغ' : 'Amount'}</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="pl-9" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase">{isRTL ? 'عدد النقاط' : 'Points'}</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input type="number" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} className="pl-9" placeholder="1000" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase">{isRTL ? 'إيصال التحويل (صورة)' : 'Transfer Receipt (Image)'}</Label>
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors group cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {receiptPreview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden"><img src={receiptPreview} alt="Preview" className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-400 group-hover:text-blue-500">
                      <Upload className="w-8 h-8 mb-2" />
                      <p className="text-xs font-medium">{isRTL ? 'اضغط لرفع صورة الإيصال' : 'Click to upload receipt image'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase">{isRTL ? 'ملاحظات إضافية' : 'Additional Notes'}</Label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder={isRTL ? 'رقم الحوالة أو اسم المحول' : 'Reference or sender name'} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleAddRequest} disabled={submitting || uploading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                {submitting ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : (isRTL ? 'إرسال الطلب' : 'Submit Request')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle>{isRTL ? 'حذف الطلب' : 'Delete Request'}</AlertDialogTitle>
              <AlertDialogDescription>{isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this request? This action cannot be undone.'}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRequest} className="bg-red-600 hover:bg-red-700 text-white">{isRTL ? 'حذف نهائي' : 'Delete Permanently'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
