import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/locales/useTranslation';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardNavigation } from '@/components/DashboardNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UtensilsCrossed, LayoutDashboard, Table2, Users, BarChart3, CreditCard, Settings,
  Plus, Edit, Trash2, Tag, DollarSign, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  displayOrder: number;
  cafeteriaId: string;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  cafeteriaId: string;
}

export default function CafeteriaMenu() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const { language } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isRTL = language === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', categoryId: '', isAvailable: true });

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
      const [catRes, itemsRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('cafeteria_id', cafeteriaId).order('display_order'),
        supabase.from('menu_items').select('*, menu_categories(name)').eq('cafeteria_id', cafeteriaId).order('name'),
      ]);
      if (catRes.error) throw catRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories((catRes.data || []).map((c: any) => ({
        id: c.id, name: c.name, displayOrder: c.display_order || 0, cafeteriaId: c.cafeteria_id,
      })));
      setMenuItems((itemsRes.data || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        categoryId: i.category_id,
        categoryName: i.menu_categories?.name,
        isAvailable: i.is_available !== false,
        cafeteriaId: i.cafeteria_id,
      })));
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      toast.error(isRTL ? 'خطأ في تحميل المنيو' : 'Error loading menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [cafeteriaId]);

  const handleAddCategory = async () => {
    if (!cafeteriaId || !categoryForm.name) {
      toast.error(isRTL ? 'أدخل اسم الفئة' : 'Enter category name');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('menu_categories').insert({
        cafeteria_id: cafeteriaId,
        name: categoryForm.name,
        display_order: categories.length,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة الفئة' : 'Category added');
      setShowAddCategoryDialog(false);
      setCategoryForm({ name: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في إضافة الفئة' : 'Error adding category'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name: categoryForm.name })
        .eq('id', selectedCategory.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث الفئة' : 'Category updated');
      setShowEditCategoryDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تحديث الفئة' : 'Error updating category'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('menu_categories').delete().eq('id', selectedCategory.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم حذف الفئة' : 'Category deleted');
      setShowDeleteCategoryDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الفئة' : 'Error deleting category'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (!cafeteriaId || !itemForm.name || !itemForm.price || !itemForm.categoryId) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('menu_items').insert({
        cafeteria_id: cafeteriaId,
        category_id: itemForm.categoryId,
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price),
        is_available: itemForm.isAvailable,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(isRTL ? 'تم إضافة الصنف' : 'Item added');
      setShowAddItemDialog(false);
      setItemForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في إضافة الصنف' : 'Error adding item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: itemForm.name,
          description: itemForm.description || null,
          price: parseFloat(itemForm.price),
          category_id: itemForm.categoryId,
          is_available: itemForm.isAvailable,
        })
        .eq('id', selectedItem.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث الصنف' : 'Item updated');
      setShowEditItemDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في تحديث الصنف' : 'Error updating item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', selectedItem.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم حذف الصنف' : 'Item deleted');
      setShowDeleteItemDialog(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isRTL ? 'خطأ في حذف الصنف' : 'Error deleting item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.isAvailable })
        .eq('id', item.id);
      if (error) throw error;
      toast.success(isRTL ? 'تم تحديث توفر الصنف' : 'Item availability updated');
      fetchData();
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في تحديث الصنف' : 'Error updating item');
    }
  };

  const openEditItemDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
    });
    setShowEditItemDialog(true);
  };

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(i => i.categoryId === activeCategory);

  const availableItems = menuItems.filter(i => i.isAvailable).length;

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader
        title={isRTL ? 'إدارة المنيو' : 'Menu Management'}
        icon={<UtensilsCrossed className="w-5 h-5" />}
        onMenuToggle={setMenuOpen}
        menuOpen={menuOpen}
      />
      <div className="flex">
        <DashboardNavigation items={navigationItems} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 p-4 md:p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'الفئات' : 'Categories'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{menuItems.length}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'إجمالي الأصناف' : 'Total Items'}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{availableItems}</p>
                  <p className="text-xs text-gray-500">{isRTL ? 'متاح' : 'Available'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="items">
            <TabsList className="mb-4">
              <TabsTrigger value="items">{isRTL ? 'الأصناف' : 'Items'}</TabsTrigger>
              <TabsTrigger value="categories">{isRTL ? 'الفئات' : 'Categories'}</TabsTrigger>
            </TabsList>

            {/* Items Tab */}
            <TabsContent value="items">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isRTL ? 'الكل' : 'All'}
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setActiveCategory(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activeCategory === c.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    setItemForm({ name: '', description: '', price: '', categoryId: categories[0]?.id || '', isAvailable: true });
                    setShowAddItemDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isRTL ? 'إضافة صنف' : 'Add Item'}
                </Button>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {loading ? (
                    <div className="text-center py-12 text-gray-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{isRTL ? 'لا توجد أصناف بعد' : 'No items yet'}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>{isRTL ? 'الاسم' : 'Name'}</TableHead>
                            <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                            <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                            <TableHead>{isRTL ? 'الوصف' : 'Description'}</TableHead>
                            <TableHead>{isRTL ? 'متاح' : 'Available'}</TableHead>
                            <TableHead>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => (
                            <TableRow key={item.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-gray-800">{item.name}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                  {item.categoryName || '-'}
                                </span>
                              </TableCell>
                              <TableCell className="font-semibold text-green-700">
                                {item.price.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                                {item.description || '-'}
                              </TableCell>
                              <TableCell>
                                <Switch
                                  checked={item.isAvailable}
                                  onCheckedChange={() => handleToggleAvailability(item)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => openEditItemDialog(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => { setSelectedItem(item); setShowDeleteItemDialog(true); }}
                                  >
                                    <Trash2 className="w-4 h-4" />
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
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => { setCategoryForm({ name: '' }); setShowAddCategoryDialog(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isRTL ? 'إضافة فئة' : 'Add Category'}
                </Button>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {categories.length === 0 ? (
                    <div className="text-center py-12">
                      <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{isRTL ? 'لا توجد فئات بعد' : 'No categories yet'}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>{isRTL ? 'اسم الفئة' : 'Category Name'}</TableHead>
                          <TableHead>{isRTL ? 'عدد الأصناف' : 'Items Count'}</TableHead>
                          <TableHead>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((cat) => (
                          <TableRow key={cat.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-800">{cat.name}</TableCell>
                            <TableCell className="text-gray-600">
                              {menuItems.filter(i => i.categoryId === cat.id).length}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => { setSelectedCategory(cat); setCategoryForm({ name: cat.name }); setShowEditCategoryDialog(true); }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => { setSelectedCategory(cat); setShowDeleteCategoryDialog(true); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'إضافة فئة جديدة' : 'Add New Category'}</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>{isRTL ? 'اسم الفئة *' : 'Category Name *'}</Label>
            <Input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })} className="mt-1" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddCategory} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent className="max-w-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'تعديل الفئة' : 'Edit Category'}</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>{isRTL ? 'اسم الفئة *' : 'Category Name *'}</Label>
            <Input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })} className="mt-1" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditCategoryDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleEditCategory} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'إضافة صنف جديد' : 'Add New Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'اسم الصنف *' : 'Item Name *'}</Label>
              <Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>{isRTL ? 'الفئة *' : 'Category *'}</Label>
              <Select value={itemForm.categoryId} onValueChange={v => setItemForm({ ...itemForm, categoryId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر فئة' : 'Select category'} /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'السعر *' : 'Price *'}</Label>
              <Input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
              <Textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={itemForm.isAvailable} onCheckedChange={v => setItemForm({ ...itemForm, isAvailable: v })} />
              <Label>{isRTL ? 'متاح للطلب' : 'Available for order'}</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddItem} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader><DialogTitle>{isRTL ? 'تعديل الصنف' : 'Edit Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isRTL ? 'اسم الصنف *' : 'Item Name *'}</Label>
              <Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>{isRTL ? 'الفئة *' : 'Category *'}</Label>
              <Select value={itemForm.categoryId} onValueChange={v => setItemForm({ ...itemForm, categoryId: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? 'السعر *' : 'Price *'}</Label>
              <Input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
              <Textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={itemForm.isAvailable} onCheckedChange={v => setItemForm({ ...itemForm, isAvailable: v })} />
              <Label>{isRTL ? 'متاح للطلب' : 'Available for order'}</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditItemDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleEditItem} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? '...' : (isRTL ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category */}
      <AlertDialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'حذف الفئة' : 'Delete Category'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? `سيتم حذف الفئة "${selectedCategory?.name}" وجميع أصنافها.` : `Delete category "${selectedCategory?.name}" and all its items?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">{isRTL ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item */}
      <AlertDialog open={showDeleteItemDialog} onOpenChange={setShowDeleteItemDialog}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'حذف الصنف' : 'Delete Item'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? `هل تريد حذف "${selectedItem?.name}"؟` : `Delete "${selectedItem?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">{isRTL ? 'حذف' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
