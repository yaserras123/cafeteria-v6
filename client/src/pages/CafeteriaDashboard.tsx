import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
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
 * CAFETERIA DASHBOARD - CAFETERIA V2
 * Role: Cafeteria Admin / Manager
 * Features: Comprehensive Admin Operations (Menu, Tables, Staff, Orders, Recharge, Reports)
 */

export default function CafeteriaDashboard() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const { language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll logic
  React.useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Auth Guard
  if (!authLoading && !['manager', 'admin', 'owner'].includes(user?.role ?? '')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md border-red-100 shadow-lg">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
              <p className="text-slate-500 mt-2">Only authorized cafeteria administrators can access this dashboard.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRTL = language === 'ar';
  const cafeteriaId = user?.cafeteriaId ?? '';

  // Data Fetching (Placeholders for UI build)
  const { data: cafeteriaInfo } = trpc.cafeterias.getCafeteriaDetails.useQuery({ cafeteriaId }, { enabled: !!cafeteriaId });
  
  const stats = [
    { label: 'Points Balance', value: cafeteriaInfo?.pointsBalance || '0', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Staff', value: '12', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Today Sales', value: '$1,240', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Orders', value: '48', icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Tables (Occ/Total)', value: '14/25', icon: TableIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Points Deducted', value: '320', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className={`min-h-screen bg-slate-50/50 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">{(cafeteriaInfo as any)?.name || 'Cafeteria Admin'}</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Management Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={(v) => setLanguage(v as 'ar' | 'en')}>
            <SelectTrigger className="w-[70px] h-9 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="ar">AR</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-9 h-9 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
            {user?.name?.[0] || 'A'}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Navigation Tabs */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto inline-flex shadow-sm rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <LayoutDashboard className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="menu" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Utensils className="w-4 h-4" /> Menu
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <TableIcon className="w-4 h-4" /> Tables
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Users className="w-4 h-4" /> Staff
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <ClipboardList className="w-4 h-4" /> Orders
              </TabsTrigger>
              <TabsTrigger value="recharge" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Wallet className="w-4 h-4" /> Recharge
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <FileText className="w-4 h-4" /> Reports
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 py-2.5 px-4 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Settings className="w-4 h-4" /> Settings
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
                      <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">TODAY</Badge>
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
                  <CardTitle className="text-lg">Recent Order Activity</CardTitle>
                  <CardDescription>Live feed of latest transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            #{i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Order #ORD-2024-{1000 + i}</p>
                            <p className="text-xs text-slate-500">Table 12 • 2 items • 5 mins ago</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">$24.50</p>
                          <Badge className="bg-green-50 text-green-600 border-none text-[10px] h-5">PAID</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold">
                    View All Orders
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">System Health & Status</CardTitle>
                  <CardDescription>Real-time operational indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-slate-700">Kitchen Connection</span>
                      </div>
                      <span className="text-xs text-green-600 font-bold uppercase">Stable</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-slate-700">QR Engine</span>
                      </div>
                      <span className="text-xs text-green-600 font-bold uppercase">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-sm font-bold text-slate-700">Cloud Sync</span>
                      </div>
                      <span className="text-xs text-amber-600 font-bold uppercase">Syncing...</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Avg. Prep Time</p>
                      <p className="text-xl font-black text-slate-900">12m 45s</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Peak Hour</p>
                      <p className="text-xl font-black text-slate-900">1:00 PM</p>
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
                <h2 className="text-2xl font-black text-slate-900">Menu Management</h2>
                <p className="text-slate-500">Control your categories and food items</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 md:flex-none border-slate-200 shadow-sm">
                  <Filter className="w-4 h-4 mr-2" /> Filter
                </Button>
                <Button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                  <Plus className="w-4 h-4 mr-2" /> Add New Item
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Categories Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Categories</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2">
                    <div className="space-y-1">
                      {['All Items', 'Hot Drinks', 'Cold Drinks', 'Breakfast', 'Main Dishes', 'Desserts'].map((cat, i) => (
                        <button
                          key={i}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                            i === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Grid */}
              <div className="lg:col-span-3 space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search menu items..." className="pl-10 border-slate-200 shadow-sm rounded-xl" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((_, i) => (
                    <Card key={i} className="border-none shadow-sm group hover:shadow-md transition-shadow overflow-hidden">
                      <div className="aspect-video bg-slate-100 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                          <Utensils className="w-12 h-12" />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-lg shadow-md"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow-md"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-white/90 text-slate-900 border-none backdrop-blur-sm text-[10px] font-bold">HOT DRINKS</Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-900">Cappuccino Regular</h4>
                          <span className="font-black text-blue-600">$4.50</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">Classic espresso with steamed milk foam and a dash of chocolate powder.</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                            <Switch checked={true} id={`avail-${i}`} />
                            <Label htmlFor={`avail-${i}`} className="text-[10px] font-bold text-slate-400 uppercase">Available</Label>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400">ID: #402{i}</Badge>
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
                <h2 className="text-2xl font-black text-slate-900">Tables & Sections</h2>
                <p className="text-slate-500">Manage seating zones and QR codes</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                <Plus className="w-4 h-4 mr-2" /> Create New Table
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Zones / Sections</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {['Main Hall', 'Terrace', 'VIP Room', 'Window Side'].map((zone, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <span className="text-sm font-bold text-slate-700">{zone}</span>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none">{5 + i} Tables</Badge>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full text-blue-600 text-xs font-bold border border-dashed border-blue-200 rounded-xl py-4 mt-2">
                      <Plus className="w-3 h-3 mr-1" /> Add New Section
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Card key={num} className={`border-none shadow-sm group hover:shadow-md transition-all cursor-pointer overflow-hidden ${num === 3 || num === 7 ? 'ring-2 ring-amber-400' : ''}`}>
                      <div className={`h-2 ${num === 3 || num === 7 ? 'bg-amber-400' : 'bg-green-400'}`} />
                      <CardContent className="p-6 text-center">
                        <div className="mb-4 mx-auto w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <TableIcon className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900">T-{num.toString().padStart(2, '0')}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Main Hall</p>
                        
                        <div className="mt-6 flex flex-col gap-2">
                          <Button size="sm" variant="outline" className="text-[10px] h-8 font-bold border-slate-200">
                            VIEW QR
                          </Button>
                          <span className={`text-[10px] font-black uppercase ${num === 3 || num === 7 ? 'text-amber-600' : 'text-green-600'}`}>
                            {num === 3 || num === 7 ? 'OCCUPIED' : 'AVAILABLE'}
                          </span>
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
                <h2 className="text-2xl font-black text-slate-900">Staff Management</h2>
                <p className="text-slate-500">Manage waiters, chefs, and permissions</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                <UserPlus className="w-4 h-4 mr-2" /> Add New Staff
              </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100">
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Staff Member</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Role</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Login</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Assignment</TableHead>
                    <TableHead className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'John Doe', email: 'john@cafe.com', role: 'WAITER', assign: 'Terrace', status: 'ACTIVE' },
                    { name: 'Sarah Cook', email: 'sarah@cafe.com', role: 'CHEF', assign: 'Breakfast', status: 'ON SHIFT' },
                    { name: 'Mike Ross', email: 'mike@cafe.com', role: 'WAITER', assign: 'Main Hall', status: 'OFFLINE' },
                  ].map((staff, i) => (
                    <TableRow key={i} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {staff.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{staff.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{staff.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-600">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch checked={true} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-slate-600">{staff.assign}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'OFFLINE' ? 'bg-slate-300' : 'bg-green-500'}`} />
                          <span className="text-[10px] font-black text-slate-500 uppercase">{staff.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ORDERS SECTION */}
          <TabsContent value="orders" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Live Orders</h2>
                <p className="text-slate-500">Track and manage active kitchen orders</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 font-bold">12 ACTIVE</Badge>
                <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 font-bold">4 PREPARING</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((_, i) => (
                <Card key={i} className="border-none shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">#ORD-{2040 + i}</span>
                        <Badge className="bg-white text-blue-600 border-blue-100 text-[10px]">TABLE {10 + i}</Badge>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">12:45 PM</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-medium">2x Cappuccino Regular</span>
                        <span className="font-bold text-slate-900">$9.00</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-medium">1x Breakfast Platter</span>
                        <span className="font-bold text-slate-900">$15.50</span>
                      </div>
                    </div>
                    
                    <Separator className="bg-slate-50" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase">PREPARING (8m)</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">$24.50</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button variant="outline" className="h-9 text-[10px] font-bold uppercase border-slate-200">Update Status</Button>
                      <Button variant="outline" className="h-9 text-[10px] font-bold uppercase border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* RECHARGE SECTION */}
          <TabsContent value="recharge" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Points Recharge</h2>
                <p className="text-slate-500">Request more points and view history</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Submit Request</CardTitle>
                  <CardDescription>Fill in payment details to recharge points</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Recharge Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input type="number" placeholder="0.00" className="pl-10 h-12 text-lg font-bold border-slate-200" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger className="h-10 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</Label>
                      <Input type="date" className="h-10 border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction ID</Label>
                    <Input placeholder="Enter reference number" className="h-10 border-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Proof of Payment</Label>
                    <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">Upload Receipt</p>
                      <p className="text-[10px] text-slate-400 mt-1">Images or PDF (Max 5MB)</p>
                    </div>
                  </div>

                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 mt-4">
                    Submit Recharge Request
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Request History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { amount: '$500', date: 'Oct 12, 2024', status: 'CHARGED', points: '+5,000' },
                      { amount: '$200', date: 'Oct 05, 2024', status: 'APPROVED', points: '+2,000' },
                      { amount: '$100', date: 'Sep 28, 2024', status: 'UNDER REVIEW', points: 'PENDING' },
                      { amount: '$300', date: 'Sep 15, 2024', status: 'REJECTED', points: '0' },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${req.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{req.amount}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{req.date} • ID: #TRX-99{i}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${req.status === 'REJECTED' ? 'text-red-600' : 'text-green-600'}`}>{req.points}</p>
                          <Badge className={`text-[9px] font-black border-none h-5 mt-1 ${
                            req.status === 'CHARGED' ? 'bg-green-100 text-green-700' :
                            req.status === 'UNDER REVIEW' ? 'bg-blue-100 text-blue-700' :
                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {req.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REPORTS SECTION */}
          <TabsContent value="reports" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Analytics & Reports</h2>
                <p className="text-slate-500">Financial insights and performance tracking</p>
              </div>
              <Button variant="outline" className="border-slate-200 shadow-sm font-bold">
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Monthly Sales', value: '$12,450', trend: '+12.5%', color: 'text-blue-600' },
                { label: 'Avg. Order Value', value: '$18.20', trend: '+3.2%', color: 'text-purple-600' },
                { label: 'Points Consumed', value: '8,420', trend: '+8.1%', color: 'text-amber-600' },
                { label: 'Active Waiters', value: '8', trend: 'Stable', color: 'text-indigo-600' },
              ].map((report, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{report.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className={`text-2xl font-black ${report.color}`}>{report.value}</h3>
                      <span className="text-[10px] font-black text-green-500">{report.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Sales Performance</CardTitle>
                <CardDescription>Comparison of daily sales vs points consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">Interactive Chart Component Placeholder</p>
                    <p className="text-[10px] text-slate-300">Requires Chart.js or Recharts integration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS SECTION */}
          <TabsContent value="settings" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Cafeteria Settings</h2>
              <p className="text-slate-500">Manage your profile and system configuration</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">General Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Cafeteria Name</Label>
                        <Input defaultValue="Grand Central Cafe" className="border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input defaultValue="Block 4, Istanbul, Turkey" className="pl-10 border-slate-200" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Timezone</Label>
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
                        <Label className="text-xs font-bold uppercase text-slate-400">Currency</Label>
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
                    <CardTitle className="text-lg">Financial Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Service Fee (%)</Label>
                        <Input type="number" defaultValue="5" className="border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-slate-400">Tax / VAT (%)</Label>
                        <Input type="number" defaultValue="18" className="border-slate-200" />
                      </div>
                    </div>
                    <Separator className="bg-slate-50" />
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900">Payment Information</p>
                        <p className="text-xs text-blue-700 mt-1">Your payment details are managed by the platform owner. Contact support for modifications.</p>
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
                      <p className="text-[10px] font-bold uppercase tracking-widest">Map Preview</p>
                    </div>
                    <Button variant="secondary" size="sm" className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border-none shadow-sm font-bold text-[10px]">
                      UPDATE LOCATION
                    </Button>
                  </div>
                  <CardContent className="p-6">
                    <h4 className="font-bold text-slate-900 mb-4">Quick Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-600 font-bold text-xs h-11">
                        <Languages className="w-4 h-4 mr-3" /> Change System Language
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 text-slate-600 font-bold text-xs h-11">
                        <Globe className="w-4 h-4 mr-3" /> Website Settings
                      </Button>
                      <Button variant="destructive" className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-600 border-none font-bold text-xs h-11">
                        <Trash2 className="w-4 h-4 mr-3" /> Reset System Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer / Copyright */}
      <footer className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] pb-24">
        © 2024 Cafeteria V2 System • Built for Excellence
      </footer>

      {/* Floating Scroll-to-Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-2xl shadow-blue-200 hover:scale-110 active:scale-95 transition-all z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
