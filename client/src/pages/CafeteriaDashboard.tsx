import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, 
  Store, 
  Coins, 
  PlusCircle, 
  ShoppingCart, 
  Users, 
  Settings, 
  Clock, 
  CheckCircle2, 
  BarChart3,
  Upload,
  Gift,
  LayoutDashboard,
  Utensils,
  Table as TableIcon,
  ClipboardList,
  Wallet,
  FileText,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Languages,
  Globe,
  Camera,
  FileIcon,
  X,
  UserPlus,
  Check,
  AlertCircle,
  Key,
  Phone,
  Hash,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Tag,
  Layers,
  EyeOff,
  Eye as EyeIcon,
  Lock
} from 'lucide-react';
import { usePlanCheck } from '@/hooks/usePlanCheck';
import { UpgradeModal, FeatureGate } from '@/components/SubscriptionGating';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/**
 * ── DATA STRUCTURES ────────────────────────────────────────────────────────
 */

interface MenuCategory {
  id: string;
  name: string;
  type: 'customer' | 'admin';
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  categoryId: string;
  image?: string;
}

interface TableData {
  id: string;
  tableToken: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  sectionId: string;
  tableNumber: number;
  capacity: number;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'waiter' | 'chef' | 'manager' | 'cafeteria_admin';
  assignment: string;
  loginEnabled: boolean;
  referenceCode: string;
  status: 'ACTIVE' | 'ON SHIFT' | 'OFFLINE';
}

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  tableToken: string;
  status: 'created' | 'sent_to_kitchen' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  items: OrderItem[];
  total: number;
  createdAt: string;
}

/**
 * CAFETERIA DASHBOARD - CAFETERIA V2
 * Role: Cafeteria Admin / Manager
 * Features: Comprehensive Admin Operations (Menu, Tables, Staff, Orders, Recharge, Reports)
 */

export default function CafeteriaDashboard() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage, t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isRTL = language === 'ar';
  const cafeteriaId = user?.cafeteriaId ?? '';

  // ── SUBSCRIPTION / PLAN ENFORCEMENT ─────────────────────────────────────
  const { canCreateStaff, canCreateTable, hasFeature, limits, plan } = usePlanCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  // ── MODAL STATES ─────────────────────────────────────────────────────────
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    loginUsername: '',
    password: '',
    phone: '',
    role: 'waiter' as const,
  });
  const [showPasswordStaff, setShowPasswordStaff] = useState(false);
  const [staffCreationError, setStaffCreationError] = useState('');
  const [staffCreationSuccess, setStaffCreationSuccess] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentStaffId, setAssignmentStaffId] = useState('');
  const [assignmentStaffRole, setAssignmentStaffRole] = useState<'waiter' | 'chef'>('waiter');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');

  // ── BACKEND INTEGRATION ──────────────────────────────────────────────────
  
  // Queries
  const { data: cafeteriaInfo } = trpc.cafeterias.getCafeteriaDetails.useQuery({ cafeteriaId }, { enabled: !!cafeteriaId });
  
  // Menu Queries
  const { data: backendCategories, refetch: refetchCategories } = trpc.menu.getCategories.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId }
  );
  const { data: backendItems, refetch: refetchItems } = trpc.menu.getMenuItems.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId }
  );

  // Tables Queries
  const { data: backendSections, refetch: refetchSections } = trpc.tables.getSections.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId }
  );
  const { data: backendTables, refetch: refetchTables } = trpc.tables.getTables.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId }
  );

  // Staff Queries
  const { data: backendStaff, refetch: refetchStaff } = trpc.staff.getStaff.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId }
  );

  // Orders Queries
  const { data: backendOrders, refetch: refetchOrders } = trpc.orders.getOrders.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId, refetchInterval: 5000 }
  );

  // Recharge Queries
  const { data: backendRecharges, refetch: refetchRecharges } = trpc.recharges.getRequests.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId, refetchInterval: 10000 }
  );

  // Reports Queries
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data: cafeteriaStats } = trpc.reporting.getCafeteriaStats.useQuery(
    { cafeteriaId, period: reportPeriod },
    { enabled: !!cafeteriaId && activeTab === 'reports' }
  );
  const { data: staffPerformance } = trpc.reporting.getStaffPerformance.useQuery(
    { cafeteriaId },
    { enabled: !!cafeteriaId && activeTab === 'reports' }
  );

  // Mutations
  // Menu Mutations
  const createItemMutation = trpc.menu.createMenuItem.useMutation({ onSuccess: () => refetchItems() });
  const updateItemMutation = trpc.menu.updateMenuItem.useMutation({ onSuccess: () => refetchItems() });
  const toggleAvailabilityMutation = trpc.menu.updateItemAvailability.useMutation({ onSuccess: () => refetchItems() });
  const deleteItemMutation = trpc.menu.deleteMenuItem.useMutation({ onSuccess: () => refetchItems() });

  // Tables Mutations
  const createSectionMutation = trpc.tables.createSection.useMutation({ onSuccess: () => refetchSections() });
  const createTableMutation = trpc.tables.createTable.useMutation({ onSuccess: () => refetchTables() });
  const updateTableStatusMutation = trpc.tables.updateTableStatus.useMutation({ onSuccess: () => refetchTables() });
  const deleteTableMutation = trpc.tables.deleteTable.useMutation({ onSuccess: () => refetchTables() });

  // Staff Mutations
  const createStaffMutation = trpc.staff.createStaff.useMutation({
    onSuccess: () => {
      setStaffCreationSuccess(true);
      setStaffFormData({ name: '', loginUsername: '', password: '', phone: '', role: 'waiter' });
      
      // Revenue Nudge: Suggest upgrade after growing staff
      if (backendStaff && backendStaff.length >= 2 && plan === 'starter') {
        setTimeout(() => {
          setUpgradeReason("You're growing fast! Upgrade to Growth to manage up to 10 staff members and unlock detailed performance analytics.");
          setShowUpgradeModal(true);
        }, 2500);
      }

      setTimeout(() => {
        setShowStaffModal(false);
        setStaffCreationSuccess(false);
      }, 2000);
      refetchStaff();
    },
    onError: (err) => {
      setStaffCreationError(err.message || 'Failed to create staff');
    }
  });
  const toggleStaffLoginMutation = trpc.staff.toggleStaffLogin.useMutation({ onSuccess: () => refetchStaff() });
  const assignStaffToSectionMutation = trpc.staff.assignToSection.useMutation({
    onSuccess: () => {
      setShowAssignmentModal(false);
      refetchStaff();
    }
  });
  const assignStaffToCategoryMutation = trpc.staff.assignToCategory.useMutation({
    onSuccess: () => {
      setShowAssignmentModal(false);
      refetchStaff();
    }
  });
  const deleteStaffMutation = trpc.staff.deleteStaff.useMutation({ onSuccess: () => refetchStaff() });

  // Orders Mutations
  const updateOrderStatusMutation = trpc.orders.updateOrderStatus.useMutation({ onSuccess: () => refetchOrders() });
  const cancelOrderMutation = trpc.orders.cancelOrder.useMutation({ onSuccess: () => refetchOrders() });

  // Recharge Mutations
  const createRechargeMutation = trpc.recharges.createRequest.useMutation({ 
    onSuccess: () => {
      refetchRecharges();
      setRechargeAmount('');

      // Revenue Nudge: Suggest upgrade after recharge
      if (plan === 'starter') {
        setTimeout(() => {
          setUpgradeReason("Scale faster with the Growth plan! Unlock premium reports and unlimited analytics for your operations.");
          setShowUpgradeModal(true);
        }, 1500);
      }
    } 
  });

  // ── STATE ARCHITECTURE ───────────────────────────────────────────────────
  
  // Menu State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Tables State
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState('');

  // Orders State - derived from backend data
  const orders = (backendOrders || []).map((order: any) => ({
    id: order.id,
    tableToken: order.table?.tableNumber ? `T-${order.table.tableNumber}` : 'N/A',
    status: order.status === 'open' ? 'created' : (order.status === 'closed' ? 'paid' : 'cancelled') as Order['status'],
    total: Number(order.totalAmount) || 0,
    createdAt: new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    items: (order.items || []).map((item: any) => ({
      menuItemId: item.menuItemId,
      name: item.menuItem?.name || 'Unknown Item',
      quantity: item.quantity,
      price: Number(item.unitPrice) || 0
    }))
  }));

  // ── HANDLERS ────────────────────────────────────────────────────────────

  // Staff Handlers
  const handleOpenStaffModal = () => {
    const currentStaffCount = backendStaff?.length ?? 0;
    if (!canCreateStaff(currentStaffCount)) {
      setUpgradeReason(
        limits?.maxStaff
          ? `Your current ${plan} plan allows up to ${limits.maxStaff} staff members. Upgrade to add more.`
          : 'Upgrade your plan to add more staff members.'
      );
      setShowUpgradeModal(true);
      return;
    }
    setStaffCreationError('');
    setStaffCreationSuccess(false);
    setShowStaffModal(true);
  };

  const handleStaffFormChange = (field: string, value: any) => {
    setStaffFormData(prev => ({ ...prev, [field]: value }));
    setStaffCreationError('');
  };

  const handleCreateStaff = async () => {
    if (!staffFormData.name.trim()) {
      setStaffCreationError('Name is required');
      return;
    }
    if (!staffFormData.loginUsername.trim()) {
      setStaffCreationError('Email/Username is required');
      return;
    }
    if (!staffFormData.password.trim()) {
      setStaffCreationError('Password is required');
      return;
    }
    if (staffFormData.password.length < 6) {
      setStaffCreationError('Password must be at least 6 characters');
      return;
    }

    await createStaffMutation.mutateAsync({
      cafeteriaId,
      name: staffFormData.name,
      loginUsername: staffFormData.loginUsername,
      password: staffFormData.password,
      phone: staffFormData.phone,
      role: staffFormData.role,
    });
  };

  const handleToggleStaffLogin = async (id: string, current: boolean) => {
    await toggleStaffLoginMutation.mutateAsync({
      staffId: id,
      enable: !current
    });
  };

  const handleOpenAssignmentModal = (staff: any) => {
    setAssignmentStaffId(staff.id);
    setAssignmentStaffRole(staff.role);
    setSelectedAssignmentId('');
    setShowAssignmentModal(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedAssignmentId) {
      alert('Please select an assignment');
      return;
    }

    if (assignmentStaffRole === 'waiter') {
      await assignStaffToSectionMutation.mutateAsync({
        staffId: assignmentStaffId,
        sectionId: selectedAssignmentId
      });
    } else if (assignmentStaffRole === 'chef') {
      await assignStaffToCategoryMutation.mutateAsync({
        staffId: assignmentStaffId,
        categoryId: selectedAssignmentId
      });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      await deleteStaffMutation.mutateAsync({ staffId: id });
    }
  };

  // Menu Handlers
  const handleAddItem = async () => {
    if (!selectedCategoryId || selectedCategoryId === 'all') {
      alert("Please select a category first");
      return;
    }
    const name = prompt("Item Name:");
    const priceStr = prompt("Price:");
    if (name && priceStr) {
      const price = parseFloat(priceStr);
      await createItemMutation.mutateAsync({
        cafeteriaId,
        categoryId: selectedCategoryId,
        name,
        price,
        description: ""
      });
    }
  };

  const handleEditItem = async (item: MenuItem) => {
    const name = prompt("Update Name:", item.name);
    const priceStr = prompt("Update Price:", item.price.toString());
    if (name && priceStr) {
      const price = parseFloat(priceStr);
      await updateItemMutation.mutateAsync({
        itemId: item.id,
        name,
        price
      });
    }
  };

  const handleToggleAvailability = async (id: string, current: boolean) => {
    await toggleAvailabilityMutation.mutateAsync({
      itemId: id,
      available: !current
    });
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Delete this item?")) {
      await deleteItemMutation.mutateAsync({ itemId: id });
    }
  };

  // Table Handlers
  const handleCreateSection = async () => {
    if (!hasFeature('sections')) {
      setUpgradeReason(
        `Multiple sections require a higher subscription plan. Your current ${plan} plan does not support this feature.`
      );
      setShowUpgradeModal(true);
      return;
    }
    const name = prompt("Section Name (e.g., Terrace, Main Hall):");
    if (name) {
      await createSectionMutation.mutateAsync({ cafeteriaId, name });
    }
  };

  const handleCreateTable = async () => {
    const currentTableCount = backendTables?.length ?? 0;
    if (!canCreateTable(currentTableCount)) {
      setUpgradeReason(
        limits?.maxTables
          ? `Your current ${plan} plan allows up to ${limits.maxTables} tables. Upgrade to add more.`
          : 'Upgrade your plan to add more tables.'
      );
      setShowUpgradeModal(true);
      return;
    }
    if (!selectedSectionId || selectedSectionId === 'all') {
      alert("Please select a section first");
      return;
    }
    const numberStr = prompt("Table Number:");
    const capacityStr = prompt("Capacity (People):", "4");
    if (numberStr && capacityStr) {
      await createTableMutation.mutateAsync({
        cafeteriaId,
        sectionId: selectedSectionId,
        tableNumber: parseInt(numberStr),
        capacity: parseInt(capacityStr)
      });
    }
  };

  const handleChangeTableStatus = async (id: string, status: TableData['status']) => {
    await updateTableStatusMutation.mutateAsync({
      tableId: id,
      status
    });
  };

  const handleDeleteTable = async (id: string) => {
    if (confirm("Delete this table?")) {
      await deleteTableMutation.mutateAsync({ tableId: id });
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    // Map UI status to backend status
    const backendStatus = status === 'paid' ? 'closed' : (status === 'cancelled' ? 'cancelled' : 'open');
    await updateOrderStatusMutation.mutateAsync({
      orderId: id,
      status: backendStatus as 'open' | 'closed' | 'cancelled'
    });
  };
  const handleCancelOrder = async (id: string) => {
    await cancelOrderMutation.mutateAsync({ orderId: id });
  };

  // Recharge Handlers
  const handleCreateRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    await createRechargeMutation.mutateAsync({
      cafeteriaId,
      amount,
    });
  };

  // ── SYSTEM LOGIC ─────────────────────────────────────────────────────────

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Auth Guard
  if (!authLoading && !['admin', 'manager', 'cafeteria_admin'].includes(user?.role ?? '')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md border-red-100 shadow-lg">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('access_denied')}</h2>
              <p className="text-slate-500 mt-2">
                {t('cafeteria_admin_only')}
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              {t('return_home')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── DERIVED LIMIT FLAGS ──────────────────────────────────────────────────
  const currentStaffCount = backendStaff?.length ?? 0;
  const currentTableCount = backendTables?.length ?? 0;
  const isStaffLimitReached = !canCreateStaff(currentStaffCount);
  const isTableLimitReached = !canCreateTable(currentTableCount);
  const isSectionsAllowed = hasFeature('sections');
  const isPremiumReportsAllowed = hasFeature('premiumReports');

  const stats = [
    { label: t('points_balance'), value: cafeteriaInfo?.pointsBalance || '0', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: t('active_staff'), value: backendStaff?.filter((s: any) => s.status === 'active').length.toString() || '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('today_sales'), value: '$1,240', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: t('total_orders'), value: orders.length.toString(), icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: t('tables_status'), value: `${backendTables?.filter((t: any) => t.status === 'occupied').length || 0}/${backendTables?.length || 0}`, icon: TableIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: t('points_deducted'), value: '320', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  // ── REVENUE OPTIMIZATION NUDGES ─────────────────────────────────────────
  const staffUsagePercent = limits?.maxStaff ? (currentStaffCount / limits.maxStaff) * 100 : 0;
  const tableUsagePercent = limits?.maxTables ? (currentTableCount / limits.maxTables) * 100 : 0;
  const showStaffWarning = plan === 'starter' && staffUsagePercent >= 80;
  const showTableWarning = plan === 'starter' && tableUsagePercent >= 80;

  return (
    <div className={`min-h-screen bg-slate-50/50 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Revenue Conversion Banners */}
      {plan === 'starter' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 px-4 text-center text-xs font-bold flex items-center justify-center gap-4 shadow-md sticky top-0 z-[40]">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 animate-pulse" />
            <span className="uppercase tracking-widest">Growth Plan Offer:</span>
            <span className="font-medium opacity-90">Unlock full reporting and manage up to 10 staff members.</span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter bg-white text-blue-700 hover:bg-blue-50 border-none"
            onClick={() => setLocation('/upgrade')}
          >
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              {(cafeteriaInfo as any)?.name || t('cafeteria_admin')}
            </h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              {t('management_portal')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={(v) => setLanguage(v as 'ar' | 'en')}>
            <SelectTrigger className="w-[85px] h-9 border-slate-200">
              <Languages className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-9 h-9 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-8">
        {/* Smart Limit Warnings */}
        {(showStaffWarning || showTableWarning) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top duration-500">
            {showStaffWarning && (
              <Card className="border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Staff Limit Warning</p>
                      <p className="text-xs text-slate-600 font-medium">You've used {currentStaffCount}/{limits?.maxStaff} staff slots. Upgrade to continue growing.</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] uppercase tracking-wider h-8"
                    onClick={() => setLocation('/upgrade')}
                  >
                    Expand Limit
                  </Button>
                </CardContent>
              </Card>
            )}
            {showTableWarning && (
              <Card className="border-blue-200 bg-blue-50/50 shadow-sm overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <TableIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Table Limit Warning</p>
                      <p className="text-xs text-slate-600 font-medium">You've used {currentTableCount}/{limits?.maxTables} table slots. Don't stop now!</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider h-8"
                    onClick={() => setLocation('/upgrade')}
                  >
                    Unlock Tables
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Navigation */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto inline-flex shadow-sm rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <LayoutDashboard className="w-4 h-4" /> {t('nav_overview')}
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Utensils className="w-4 h-4" /> {t('nav_menu')}
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <TableIcon className="w-4 h-4" /> {t('nav_tables')}
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Users className="w-4 h-4" /> {t('nav_staff')}
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <ClipboardList className="w-4 h-4" /> {t('nav_orders')}
              </TabsTrigger>
              <TabsTrigger value="recharge" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Wallet className="w-4 h-4" /> {t('nav_recharge')}
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <FileText className="w-4 h-4" /> {t('nav_reports')}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Settings className="w-4 h-4" /> {t('nav_settings')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW SECTION */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px] uppercase tracking-wider">
                        {t('period_today')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t('recent_orders')}</CardTitle>
                  <CardDescription>{t('live_feed_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order, i) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            #{i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{t('order_num')} #{order.id}</p>
                            <p className="text-xs text-slate-500">{order.tableToken} • {order.items.length} items • {order.createdAt}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">${order.total.toFixed(2)}</p>
                          <Badge className={`border-none text-[10px] h-5 uppercase ${order.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            {t(`status_${order.status}`)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" onClick={() => setActiveTab('orders')} className="w-full mt-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold">
                    {t('view_all_orders')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t('system_health')}</CardTitle>
                  <CardDescription>{t('system_indicators_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-slate-700">{t('kitchen_connection')}</span>
                      </div>
                      <span className="text-xs text-green-600 font-bold uppercase">{t('status_stable')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-slate-700">{t('qr_engine')}</span>
                      </div>
                      <span className="text-xs text-green-600 font-bold uppercase">{t('status_active')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-sm font-bold text-slate-700">{t('cloud_sync')}</span>
                      </div>
                      <span className="text-xs text-amber-600 font-bold uppercase">{t('status_syncing')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MENU SECTION */}
          <TabsContent value="menu" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t('menu_mgmt')}</h2>
                <p className="text-slate-500">{t('menu_desc')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 md:flex-none border-slate-200 shadow-sm">
                  <Filter className="w-4 h-4 mr-2" /> {t('filter')}
                </Button>
                <Button onClick={handleAddItem} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                  <Plus className="w-4 h-4 mr-2" /> {t('add_item')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">{t('categories')}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2">
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategoryId('all')}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                          selectedCategoryId === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        All Items
                      </button>
                      {backendCategories?.map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-between items-center ${
                            selectedCategoryId === cat.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {cat.type === 'admin' && <Badge variant="outline" className="text-[8px] scale-75 border-blue-200 text-blue-500 uppercase">Admin</Badge>}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder={t('search_items')} className="pl-10 border-slate-200 shadow-sm rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {backendItems
                    ?.filter((item: any) => selectedCategoryId === 'all' || item.categoryId === selectedCategoryId)
                    .map((item: any) => (
                    <Card key={item.id} className="border-none shadow-sm group hover:shadow-md transition-shadow overflow-hidden">
                      <div className="aspect-video bg-slate-100 relative group-hover:brightness-95 transition-all">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={() => handleEditItem(item)} size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-md"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button onClick={() => handleDeleteItem(item.id)} size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow-md"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          <Badge className="bg-white/90 text-slate-900 border-none backdrop-blur-sm text-[8px] font-bold uppercase">
                            {backendCategories?.find((c: any) => c.id === item.categoryId)?.name}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <span className="font-black text-blue-600">${Number(item.price).toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={item.available} 
                              onCheckedChange={() => handleToggleAvailability(item.id, item.available)} 
                              id={`avail-${item.id}`} 
                            />
                            <Label htmlFor={`avail-${item.id}`} className="text-[10px] font-bold text-slate-400 uppercase">{t('available')}</Label>
                          </div>
                          <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-400 font-mono">ID: {item.id.substring(0, 6)}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TABLES SECTION */}
          <TabsContent value="tables" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t('tables_zones')}</h2>
                <p className="text-slate-500">{t('tables_desc')}</p>
              </div>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={handleCreateSection}
                        disabled={!isSectionsAllowed}
                        className="border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {!isSectionsAllowed && <Lock className="w-3.5 h-3.5 mr-2 text-amber-500" />}
                        {isSectionsAllowed && <PlusCircle className="w-4 h-4 mr-2" />}
                        {t('add_section')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isSectionsAllowed && (
                    <TooltipContent>Upgrade required — Multiple sections not available on your plan</TooltipContent>
                  )}
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleCreateTable}
                        disabled={isTableLimitReached}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isTableLimitReached && <Lock className="w-3.5 h-3.5 mr-2 text-amber-300" />}
                        {!isTableLimitReached && <Plus className="w-4 h-4 mr-2" />}
                        {t('add_table')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isTableLimitReached && (
                    <TooltipContent>Upgrade required — Table limit reached for your plan</TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <FeatureGate feature="sections" showPreview={true}>
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">{t('zones')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <button
                      onClick={() => setSelectedSectionId('all')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors group ${
                        selectedSectionId === 'all' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-sm font-bold">All Sections</span>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">
                        {backendTables?.length || 0}
                      </Badge>
                    </button>
                    {backendSections?.map((section: any) => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSectionId(section.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors group ${
                          selectedSectionId === section.id ? 'bg-blue-50 border-blue-100 text-blue-700' : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-sm font-bold">{section.name}</span>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">
                          {backendTables?.filter((t: any) => t.sectionId === section.id).length || 0}
                        </Badge>
                      </button>
                    ))}
                  </CardContent>
                </Card>
                </FeatureGate>
              </div>

              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  {backendTables
                    ?.filter((table: any) => selectedSectionId === 'all' || table.sectionId === selectedSectionId)
                    .map((table: any) => (
                    <Card key={table.id} className={`border-none shadow-sm group hover:shadow-md transition-all cursor-pointer overflow-hidden relative ${table.status === 'occupied' ? 'ring-2 ring-amber-400' : ''}`}>
                      <div className={`h-2 ${
                        table.status === 'available' ? 'bg-green-400' : 
                        table.status === 'occupied' ? 'bg-amber-400' : 
                        table.status === 'reserved' ? 'bg-red-400' : 'bg-blue-400'
                      }`} />
                      <CardContent className="p-6 text-center">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button onClick={() => handleDeleteTable(table.id)} size="icon" variant="ghost" className="h-6 w-6 text-slate-300 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="mb-4 mx-auto w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <TableIcon className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900">Table {table.tableNumber}</h4>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {backendSections?.find((s: any) => s.id === table.sectionId)?.name || 'Unknown'}
                          </p>
                          <p className="text-[8px] font-mono text-slate-300">TOKEN: {table.tableToken.substring(0, 8)}...</p>
                        </div>
                        
                        <div className="mt-6 flex flex-col gap-2">
                          <Select value={table.status} onValueChange={(val) => handleChangeTableStatus(table.id, val as any)}>
                            <SelectTrigger className="text-[9px] h-8 font-bold border-slate-200 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* STAFF SECTION */}
          <TabsContent value="staff" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t('staff_mgmt')}</h2>
                <p className="text-slate-500">{t('staff_desc')}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleOpenStaffModal}
                      disabled={isStaffLimitReached}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isStaffLimitReached && <Lock className="w-3.5 h-3.5 mr-2 text-amber-300" />}
                      {!isStaffLimitReached && <UserPlus className="w-4 h-4 mr-2" />}
                      {t('add_staff')}
                    </Button>
                  </span>
                </TooltipTrigger>
                {isStaffLimitReached && (
                  <TooltipContent>Upgrade required — Staff limit reached for your plan</TooltipContent>
                )}
              </Tooltip>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{t('staff_member')}</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{t('role')}</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{t('login_access')}</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{t('assignment')}</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">{t('shift_status')}</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backendStaff?.map((staff: any) => (
                    <TableRow key={staff.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {staff.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{staff.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              {staff.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {staff.phone}</span>}
                              <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" /> {staff.referenceCode}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[9px] font-black border-none px-2 py-0.5 uppercase ${staff.role === 'chef' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={staff.canLogin} onCheckedChange={() => handleToggleStaffLogin(staff.id, staff.canLogin)} />
                          <Key className={`w-3 h-3 ${staff.loginUsername ? 'text-blue-500' : 'text-slate-300'}`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          onClick={() => handleOpenAssignmentModal(staff)}
                          variant="ghost"
                          className="flex flex-col cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors h-auto"
                        >
                          <span className="text-xs font-bold text-slate-700">{staff.assignment || 'Unassigned'}</span>
                          <span className="text-[9px] text-slate-400 font-medium">{staff.role === 'waiter' ? t('section') : staff.role === 'chef' ? t('category') : 'N/A'}</span>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'inactive' ? 'bg-slate-300' : 'bg-green-500 animate-pulse'}`} />
                          <span className={`text-[10px] font-black uppercase ${staff.status === 'inactive' ? 'text-slate-400' : 'text-green-600'}`}>
                            {staff.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDeleteStaff(staff.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ORDERS SECTION (Placeholder UI) */}
          <TabsContent value="orders" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t('live_orders')}</h2>
                <p className="text-slate-500">{t('orders_desc')}</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 font-bold">{orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length} {t('active')}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.map((order) => (
                <Card key={order.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">#{order.id}</span>
                        <Badge className="bg-white text-blue-600 border-blue-100 text-[9px] font-black uppercase">{order.tableToken}</Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{order.createdAt}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      {order.items.map((item: OrderItem, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">{item.quantity}x {item.name}</span>
                          <span className="font-bold text-slate-900">${(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="bg-slate-50" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">{order.status.replace('_', ' ')}</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">${order.total.toFixed(2)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Select value={order.status} onValueChange={(val) => handleUpdateOrderStatus(order.id, val as Order['status'])}>
                        <SelectTrigger className="h-9 text-[10px] font-black uppercase border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created">Created</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleCancelOrder(order.id)} variant="outline" className="h-9 text-[10px] font-black uppercase border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors">{t('cancel')}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* RECHARGE SECTION (Placeholder UI) */}
          <TabsContent value="recharge" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t('points_recharge')}</h2>
                <p className="text-slate-500">{t('recharge_desc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">{t('submit_request')}</CardTitle>
                  <CardDescription>{t('recharge_form_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('recharge_amount')}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-10 h-12 text-lg font-bold border-slate-200 focus:ring-blue-500" 
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('currency')}</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('transfer_date')}</Label>
                      <Input type="date" className="h-10 border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('transaction_id')}</Label>
                    <Input placeholder={t('enter_ref')} className="h-10 border-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('proof_payment')}</Label>
                    <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">{t('upload_receipt')}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{t('upload_formats')}</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 mt-4"
                    onClick={handleCreateRecharge}
                    disabled={createRechargeMutation.isPending}
                  >
                    {createRechargeMutation.isPending ? 'Processing...' : t('submit_recharge')}
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t('request_history')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(backendRecharges?.requests || []).map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${req.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">${req.amount.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {new Date(req.createdAt).toLocaleDateString()} • ID: #{req.id.substring(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${req.status === 'rejected' ? 'text-red-600' : 'text-green-600'}`}>
                            {req.status === 'approved' ? `+${req.amount.toLocaleString()}` : (req.status === 'pending' ? 'PENDING' : '0')}
                          </p>
                          <Badge className={`text-[9px] font-black border-none h-5 mt-1 uppercase ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {req.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(!backendRecharges?.requests || backendRecharges.requests.length === 0) && (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-sm font-medium">{t('no_recharge_history') || 'No recharge history'}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REPORTS SECTION */}
          <TabsContent value="reports" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <FeatureGate feature="premiumReports">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{t('analytics_reports')}</h2>
                <p className="text-slate-500">{t('reports_desc')}</p>
              </div>
              <Button variant="outline" className="border-slate-200 shadow-sm font-bold">
                <FileText className="w-4 h-4 mr-2" /> {t('export_pdf')}
              </Button>
            </div>

            <div className="flex justify-end gap-2 mb-4">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <Button 
                  key={p} 
                  variant={reportPeriod === p ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-[10px] font-black uppercase h-8"
                  onClick={() => setReportPeriod(p)}
                >
                  {t(p)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t(`${reportPeriod}_sales`), value: `$${(cafeteriaStats?.totalSales || 0).toLocaleString()}`, color: 'text-blue-600' },
                { label: t('avg_order_val'), value: `$${(cafeteriaStats?.averageOrderValue || 0).toFixed(2)}`, color: 'text-purple-600' },
                { label: t('points_consumed'), value: (cafeteriaStats?.totalPointsDeducted || 0).toLocaleString(), color: 'text-amber-600' },
                { label: t('active_staff'), value: (cafeteriaStats?.activeStaffCount || 0).toString(), color: 'text-indigo-600' },
              ].map((report, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{report.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className={`text-2xl font-black ${report.color}`}>{report.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t('staff_performance')}</CardTitle>
                <CardDescription>{t('staff_performance_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-50 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase text-slate-400">{t('staff_name')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400">{t('role')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">{t('total_sales')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">{t('orders')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">{t('hours')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(staffPerformance || []).slice(0, 5).map((staff: any) => (
                      <TableRow key={staff.staffId} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-900">{staff.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">{staff.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-blue-600">${staff.totalSales.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-slate-600">{staff.totalOrders}</TableCell>
                        <TableCell className="text-right font-bold text-slate-600">{staff.totalHoursWorked}h</TableCell>
                      </TableRow>
                    ))}
                    {(!staffPerformance || staffPerformance.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-xs font-medium">
                          {t('no_performance_data') || 'No performance data available'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            </FeatureGate>
          </TabsContent>

          {/* SETTINGS SECTION (Placeholder UI) */}
          <TabsContent value="settings" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('cafeteria_settings')}</h2>
              <p className="text-slate-500">{t('settings_desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('general_info')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">{t('cafeteria_name')}</Label>
                        <Input defaultValue="Grand Central Cafe" className="border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">{t('location')}</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input defaultValue="Block 4, Istanbul, Turkey" className="pl-10 border-slate-200" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">{t('timezone')}</Label>
                        <Select defaultValue="GMT+3">
                          <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GMT+3">Istanbul (GMT+3)</SelectItem>
                            <SelectItem value="GMT+0">London (GMT+0)</SelectItem>
                            <SelectItem value="GMT+1">Paris (GMT+1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">{t('default_currency')}</Label>
                        <Select defaultValue="USD">
                          <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="TRY">TRY (₺)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('financial_config')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">{t('service_fee')}</Label>
                        <Input type="number" defaultValue="5" className="border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">{t('tax_vat')}</Label>
                        <Input type="number" defaultValue="18" className="border-slate-200" />
                      </div>
                    </div>
                    <Separator className="bg-slate-50" />
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">{t('payment_info')}</p>
                        <p className="text-xs text-blue-700 mt-1">{t('payment_info_desc')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-sm overflow-hidden">
                  <div className="aspect-video bg-slate-100 relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                      <MapPin className="w-12 h-12 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">{t('map_preview')}</p>
                    </div>
                    <Button variant="secondary" size="sm" className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border-none shadow-sm font-bold text-[10px]">
                      {t('update_loc')}
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <h4 className="font-bold text-slate-900 mb-4">{t('quick_actions')}</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-600 font-bold text-xs h-11">
                        <Languages className="w-4 h-4 mr-3" /> {t('change_lang')}
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-600 font-bold text-xs h-11">
                        <Globe className="w-4 h-4 mr-3" /> {t('website_settings')}
                      </Button>
                      <Button variant="destructive" className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-600 border-none font-bold text-xs h-11">
                        <Trash2 className="w-4 h-4 mr-3" /> {t('reset_cache')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Staff Creation Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-none shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>{t('create_staff')}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowStaffModal(false)} className="h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffCreationSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-900">{t('staff_created')}</p>
                    <p className="text-xs text-green-700 mt-1">{t('staff_ready_login')}</p>
                  </div>
                </div>
              )}

              {staffCreationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-900">{t('error')}</p>
                    <p className="text-xs text-red-700 mt-1">{staffCreationError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">{t('name')}</Label>
                <Input 
                  placeholder={t('full_name')}
                  value={staffFormData.name}
                  onChange={(e) => handleStaffFormChange('name', e.target.value)}
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">{t('email_username')}</Label>
                <Input 
                  placeholder="john@example.com"
                  value={staffFormData.loginUsername}
                  onChange={(e) => handleStaffFormChange('loginUsername', e.target.value)}
                  className="border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">{t('password')}</Label>
                <div className="relative">
                  <Input 
                    type={showPasswordStaff ? "text" : "password"}
                    placeholder={t('min_6_chars')}
                    value={staffFormData.password}
                    onChange={(e) => handleStaffFormChange('password', e.target.value)}
                    className="border-slate-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordStaff(!showPasswordStaff)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordStaff ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>



              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">{t('role')}</Label>
                <Select value={staffFormData.role} onValueChange={(val) => handleStaffFormChange('role', val)}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="chef">Chef</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowStaffModal(false)} className="flex-1 border-slate-200">
                  {t('cancel')}
                </Button>
                <Button onClick={handleCreateStaff} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={createStaffMutation.isPending}>
                  {createStaffMutation.isPending ? t('creating') : t('create')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-none shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>
                {assignmentStaffRole === 'waiter' ? t('assign_section') : t('assign_category')}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAssignmentModal(false)} className="h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">
                  {assignmentStaffRole === 'waiter' ? t('select_section') : t('select_category')}
                </Label>
                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder={assignmentStaffRole === 'waiter' ? t('choose_section') : t('choose_category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentStaffRole === 'waiter' ? (
                      backendSections?.map((section: any) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))
                    ) : (
                      backendCategories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAssignmentModal(false)} className="flex-1 border-slate-200">
                  {t('cancel')}
                </Button>
                <Button onClick={handleConfirmAssignment} className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={!selectedAssignmentId}>
                  {t('assign')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
      />

      {/* Footer / Copyright */}
      <footer className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] pb-24">
        © 2024 {t('system_name')} • {t('built_for_excellence')}
      </footer>

      {/* Floating Scroll-to-Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-2xl shadow-blue-200 hover:scale-110 active:scale-95 transition-all z-50"
          aria-label={t('scroll_top')}
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
