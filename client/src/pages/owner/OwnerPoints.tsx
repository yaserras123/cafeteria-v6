import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Wallet, LayoutDashboard, Store, Users, BarChart3, Settings,
  Plus, Minus, RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface PointsTransaction {
  id: string;
  cafeteria_id: string;
  cafeteria_name?: string;
  amount: number;
  type: 'add' | 'deduct';
  reason: string;
  created_at: string;
}

export default function OwnerPoints() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const isRTL = language === 'ar';

  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'add' | 'deduct'>('all');

  const [formData, setFormData] = useState({
    cafeteria_id: '',
    amount: '',
    type: 'add' as 'add' | 'deduct',
    reason: '',
  });

  const [cafeterias, setCafeterias] = useState<any[]>([]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      toast.error(isRTL ? 'خطأ في تحميل المعاملات' : 'Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCafeterias = async () => {
    try {
      const { data, error } = await supabase
        .from('cafeterias')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;
      setCafeterias(data || []);
    } catch (err: any) {
      console.error('Error fetching cafeterias:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCafeterias();
  }, []);

  const handleAddTransaction = async () => {
    if (!formData.cafeteria_id || !formData.amount || !formData.reason.trim()) {
      toast.error(isRTL ? 'جميع الحقول مطلوبة' : 'All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('points_transactions').insert([
        {
          cafeteria_id: formData.cafeteria_id,
          amount: parseInt(formData.amount),
          type: formData.type,
          reason: formData.reason,
        },
      ]);

      if (error) throw error;
      toast.success(isRTL ? 'تم تسجيل المعاملة بنجاح' : 'Transaction recorded successfully');
      setShowAddDialog(false);
      setFormData({ cafeteria_id: '', amount: '', type: 'add', reason: '' });
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تسجيل المعاملة' : 'Error recording transaction'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalAdded = transactions
    .filter(t => t.type === 'add')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDeducted = transactions
    .filter(t => t.type === 'deduct')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-20 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b-4 border-green-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-3 rounded-xl shadow-lg">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isRTL ? 'إدارة النقاط' : 'Manage Points'}
              </h1>
              <p className="text-xs text-green-600 font-bold">{isRTL ? 'نظام المالك' : 'Owner System'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTransactions}
              className="h-10 w-10 text-slate-600 hover:text-green-600"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-green-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{totalAdded.toLocaleString()}</p>
              <p className="text-xs opacity-80">{isRTL ? 'نقاط مضافة' : 'Points Added'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-red-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{totalDeducted.toLocaleString()}</p>
              <p className="text-xs opacity-80">{isRTL ? 'نقاط مخصومة' : 'Points Deducted'}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CardContent className="p-4">
              <p className="text-3xl font-black">{transactions.length}</p>
              <p className="text-xs opacity-80">{isRTL ? 'إجمالي المعاملات' : 'Total Transactions'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Input
            placeholder={isRTL ? 'ابحث عن معاملة...' : 'Search transaction...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'add' | 'deduct')}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-green-400 transition-colors"
          >
            <option value="all">{isRTL ? 'جميع المعاملات' : 'All Transactions'}</option>
            <option value="add">{isRTL ? 'إضافة' : 'Add'}</option>
            <option value="deduct">{isRTL ? 'خصم' : 'Deduct'}</option>
          </select>
          <Button
            onClick={() => {
              setFormData({ cafeteria_id: '', amount: '', type: 'add', reason: '' });
              setShowAddDialog(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {isRTL ? 'معاملة جديدة' : 'New Transaction'}
          </Button>
        </div>

        {/* Transactions Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{isRTL ? 'لا توجد معاملات' : 'No transactions found'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{isRTL ? 'الكافيتريا' : 'Cafeteria'}</TableHead>
                      <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                      <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead>{isRTL ? 'السبب' : 'Reason'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900">{transaction.cafeteria_name || transaction.cafeteria_id}</TableCell>
                        <TableCell>
                          <Badge className={`${transaction.type === 'add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-none text-xs font-bold flex items-center gap-1 w-fit`}>
                            {transaction.type === 'add' ? (
                              <>
                                <TrendingUp className="w-3 h-3" />
                                {isRTL ? 'إضافة' : 'Add'}
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3" />
                                {isRTL ? 'خصم' : 'Deduct'}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-lg">
                          <span className={transaction.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'add' ? '+' : '-'}{transaction.amount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">{transaction.reason}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {new Date(transaction.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
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

      {/* Add Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة معاملة نقاط' : 'Add Points Transaction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'الكافيتريا' : 'Cafeteria'}</Label>
              <select
                value={formData.cafeteria_id}
                onChange={(e) => setFormData({ ...formData, cafeteria_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{isRTL ? 'اختر كافيتريا' : 'Select cafeteria'}</option>
                {cafeterias.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{isRTL ? 'النوع' : 'Type'}</Label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'add' | 'deduct' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="add">{isRTL ? 'إضافة' : 'Add'}</option>
                <option value="deduct">{isRTL ? 'خصم' : 'Deduct'}</option>
              </select>
            </div>
            <div>
              <Label>{isRTL ? 'المبلغ' : 'Amount'}</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={isRTL ? 'عدد النقاط' : 'Points amount'}
              />
            </div>
            <div>
              <Label>{isRTL ? 'السبب' : 'Reason'}</Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={isRTL ? 'سبب المعاملة' : 'Reason for transaction'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddTransaction} disabled={submitting}>
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
