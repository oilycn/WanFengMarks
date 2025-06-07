
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import BookmarkGrid from '@/components/BookmarkGrid';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlusCircle, LogOut, Copy, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import {
  getBookmarksAction,
  addBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
  deleteBookmarksByCategoryIdAction,
  updateBookmarksOrderAction,
} from '@/actions/bookmarkActions';
import {
  getCategoriesAction,
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/actions/categoryActions';
import {
  isSetupCompleteAction,
  verifyAdminPasswordAction,
  changeAdminPasswordAction,
  getAppSettingsAction,
  updateLogoSettingsAction,
} from '@/actions/authActions';
import { useIsMobile } from '@/hooks/use-mobile';

// Import dnd-kit components and types
/*
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
*/

// Dynamically import dialogs
const AddBookmarkDialog = dynamic(() => import('@/components/AddBookmarkDialog'));
const EditBookmarkDialog = dynamic(() => import('@/components/EditBookmarkDialog'));
const EditCategoryDialog = dynamic(() => import('@/components/EditCategoryDialog'));
const PasswordDialog = dynamic(() => import('@/components/PasswordDialog'));
const SettingsDialog = dynamic(() => import('@/components/SettingsDialog'));


const LS_ADMIN_AUTH_KEY = 'wanfeng_admin_auth_v1';

const APP_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9003';

const BOOKMARKLET_SCRIPT = `javascript:(function(){const appUrl='${APP_BASE_URL}';const title=encodeURIComponent(document.title);const pageUrl=encodeURIComponent(window.location.href);let desc='';const metaDesc=document.querySelector('meta[name="description"]');if(metaDesc&&metaDesc.content){desc=encodeURIComponent(metaDesc.content);}else{const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc&&ogDesc.content){desc=encodeURIComponent(ogDesc.content);}}const popupWidth=500;const popupHeight=650;const left=(screen.width/2)-(popupWidth/2);const top=(screen.height/2)-(popupHeight/2);const wanfengWindow=window.open(\`\${appUrl}/add-bookmark-popup?name=\${title}&url=\${pageUrl}&desc=\${desc}\`, 'wanfengMarksAddBookmarkPopup', \`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=\${popupWidth}, height=\${popupHeight}, top=\${top}, left=\${left}\`);if(wanfengWindow){wanfengWindow.focus();}else{alert('无法打开晚风Marks书签添加窗口。请检查浏览器是否阻止了弹出窗口。');}})();`;

// Local arrayMove function as a fallback if @dnd-kit/sortable is not found
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
}

export default function HomePage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const [isEditBookmarkDialogOpen, setIsEditBookmarkDialogOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [initialDataForAddDialog, setInitialDataForAddDialog] = useState<{ name?: string; url?: string; description?: string } | null>(null);
  const [hasPendingBookmarkOrderChanges, setHasPendingBookmarkOrderChanges] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [logoText, setLogoText] = useState<string>("晚风Marks");
  const [logoIconName, setLogoIconName] = useState<string>("ShieldCheck");
  const [adminPasswordExists, setAdminPasswordExists] = useState(false);


  const { toast } = useToast();
  
  /*
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, 
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  */

  useEffect(() => {
    setIsClient(true);
  }, []);


  const fetchAppSettings = useCallback(async () => {
    console.log("HomePage: fetchAppSettings called.");
    try {
      const settings = await getAppSettingsAction();
      if (settings) {
        if (settings.logoText) setLogoText(settings.logoText);
        if (settings.logoIcon) setLogoIconName(settings.logoIcon);
        setAdminPasswordExists(settings.adminPasswordSet);
      }
    } catch (error: any) {
      console.error("HomePage: Error fetching app settings:", error);
      const errorMsg = error instanceof Error ? error.message : "操作失败";
      if (errorMsg.includes("Invalid Server Actions request")) {
        toast({ title: "服务器操作错误", description: "加载应用设置时请求无效。请检查代理和服务器配置。", variant: "destructive", duration: 10000 });
      } else {
        toast({ title: "错误", description: `无法加载应用设置: ${errorMsg}`, variant: "destructive" });
      }
    }
  }, [toast]);


  useEffect(() => {
    if (!isClient) return;

    let active = true;

    async function performSetupCheck() {
      console.log("HomePage: performSetupCheck running, isClient:", isClient);
      setIsCheckingSetup(true);
      try {
        console.log("[HomePage] Attempting to call isSetupCompleteAction Server Action.");
        const setupComplete = await isSetupCompleteAction();
        console.log("[HomePage] isSetupCompleteAction Server Action returned:", setupComplete);

        if (!active) {
          console.log("HomePage: performSetupCheck inactive, returning.");
          setIsCheckingSetup(false);
          return;
        }

        if (!setupComplete) {
          console.log("HomePage: Setup not complete, redirecting to /setup");
          router.push('/setup');
        } else {
          console.log("HomePage: Setup complete, proceeding with auth check and app settings fetch.");
          await fetchAppSettings();
          const adminAuth = localStorage.getItem(LS_ADMIN_AUTH_KEY);
          if (adminAuth === 'true') {
            setIsAdminAuthenticated(true);
            console.log("HomePage: Admin auth found in localStorage.");
          }
          setIsCheckingSetup(false);
          console.log("HomePage: isCheckingSetup set to false.");
        }
      } catch (error: any) {
        if (!active) {
          console.log("HomePage: performSetupCheck (catch) inactive, returning.");
          setIsCheckingSetup(false);
          return;
        }
        console.error("HomePage: Error during initial setup check or app settings fetch:", error);
        const errorMsg = error instanceof Error ? error.message : "未知错误";
        if (errorMsg.includes("Invalid Server Actions request")) {
             toast({ title: "配置错误", description: "服务器操作请求无效。请检查您的代理服务器配置是否正确转发了所有必要的头部信息 (Host, X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host, X-Forwarded-Port)，并且与 Next.js 服务器期望的一致。当前无法检查应用配置。", variant: "destructive", duration: 15000 });
        } else {
            toast({ title: "错误", description: `无法检查应用配置状态: ${errorMsg}`, variant: "destructive" });
        }
        setIsCheckingSetup(false);
      }
    }
    performSetupCheck();

    return () => {
      active = false;
      console.log("HomePage: useEffect for setup check cleanup.");
    };
  }, [isClient, router, toast, fetchAppSettings]);


  const fetchData = useCallback(async (preservePendingOrderChanges = false) => {
    console.log("HomePage: fetchData called. isLoading set to true.");
    setIsLoading(true);
    try {
      const [fetchedBookmarks, fetchedCategories] = await Promise.all([
        getBookmarksAction(),
        getCategoriesAction(),
      ]);
      setBookmarks(fetchedBookmarks);

      if (fetchedCategories && fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        const defaultCategory: Category = { id: 'default-fallback-ui', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false, priority: 0 };
        setCategories([defaultCategory]);
        console.warn("HomePage: Fetched categories was empty or undefined, using UI fallback.");
      }
      if (!preservePendingOrderChanges) {
        setHasPendingBookmarkOrderChanges(false);
      }
      console.log("HomePage: Data fetched successfully.");
    } catch (error: any) {
      console.error("HomePage: Failed to fetch data:", error);
      const errorMsg = error instanceof Error ? error.message : "操作失败";
       if (errorMsg.includes("Invalid Server Actions request")) {
        toast({ title: "服务器操作错误", description: "加载数据时请求无效。请检查代理配置。", variant: "destructive", duration: 10000 });
      } else {
        toast({ title: "错误", description: `加载数据失败: ${errorMsg}`, variant: "destructive" });
      }
       if (categories.length === 0) {
           const defaultCategory = { id: 'default-fallback-ui-error', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false, priority: 0 };
           setCategories([defaultCategory]);
       }
    } finally {
      setIsLoading(false);
      console.log("HomePage: fetchData finished. isLoading set to false.");
    }
  }, [toast, categories.length]);

  useEffect(() => {
    if (isClient && !isCheckingSetup) {
      console.log("HomePage: Conditions met for fetching data (isClient && !isCheckingSetup).");
      fetchData();
    } else {
      console.log("HomePage: Conditions NOT met for fetching data. isClient:", isClient, "isCheckingSetup:", isCheckingSetup);
    }
  }, [isClient, isCheckingSetup, fetchData]);

  const handleSetActiveCategory = (catId: string | null) => {
    if (hasPendingBookmarkOrderChanges) {
        if (!confirm("您有未保存的书签顺序更改。切换分类将丢失这些更改。确定要切换吗？")) {
            return;
        }
    }
    setHasPendingBookmarkOrderChanges(false);
    setActiveCategory(catId);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleAddBookmark = useCallback(async (newBookmarkData: Omit<Bookmark, 'id' | 'priority'>) => {
    try {
      const newBookmark = await addBookmarkAction(newBookmarkData);
      setIsAddBookmarkDialogOpen(false);
      setInitialDataForAddDialog(null);
      toast({ title: "书签已添加", description: `"${newBookmark.name}" 已成功添加。`, duration: 2000 });
      fetchData(hasPendingBookmarkOrderChanges);
    } catch (error) {
      console.error("Failed to add bookmark:", error);
      const errorMessage = error instanceof Error ? error.message : "添加书签失败。";
      toast({ title: "错误", description: errorMessage, variant: "destructive" });
    }
  }, [fetchData, toast, hasPendingBookmarkOrderChanges]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: string) => {
    if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    try {
      await deleteBookmarkAction(bookmarkId);
      toast({ title: "书签已删除", description: "书签已从服务器删除。", variant: "destructive", duration: 2000 });
      fetchData(hasPendingBookmarkOrderChanges);
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
      const errorMessage = error instanceof Error ? error.message : "删除书签失败。";
      toast({ title: "错误", description: errorMessage, variant: "destructive" });
    }
  }, [isAdminAuthenticated, toast, fetchData, hasPendingBookmarkOrderChanges]);

  const handleOpenEditBookmarkDialog = useCallback((bookmark: Bookmark) => {
    if (!isAdminAuthenticated) {
      toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
      return;
    }
    setBookmarkToEdit(bookmark);
    setIsEditBookmarkDialogOpen(true);
  }, [isAdminAuthenticated, toast]);

  const handleUpdateBookmark = useCallback(async (updatedBookmark: Bookmark) => {
     if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    try {
      const newUpdatedBookmark = await updateBookmarkAction(updatedBookmark);
      setIsEditBookmarkDialogOpen(false);
      setBookmarkToEdit(null);
      toast({ title: "书签已更新", description: `"${newUpdatedBookmark.name}" 已成功更新。`, duration: 2000 });
      fetchData(hasPendingBookmarkOrderChanges);
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      const errorMessage = error instanceof Error ? error.message : "更新书签失败。";
      toast({ title: "错误", description: errorMessage, variant: "destructive" });
    }
  }, [isAdminAuthenticated, toast, fetchData, hasPendingBookmarkOrderChanges]);

  const handleAddCategory = async (categoryName: string, icon?: string, isPrivate?: boolean) => {
    if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      toast({ title: "错误", description: "分类名称已存在。", variant: "destructive" });
      return;
    }
    try {
      const newCategory = await addCategoryAction(categoryName, icon, isPrivate);
      toast({ title: "分类已添加", description: `"${newCategory.name}" 已成功添加。`, duration: 2000 });
      fetchData();
    } catch (error) {
      console.error("Failed to add category:", error);
      const errorMessage = error instanceof Error ? error.message : "添加分类失败。";
      toast({ title: "错误", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    try {
      await deleteBookmarksByCategoryIdAction(categoryId);
      await deleteCategoryAction(categoryId);

      const oldCategoryName = categories.find(c => c.id === categoryId)?.name || '该分类';

      if (activeCategory === categoryId) {
        const nextVisibleCategories = categories.filter(c => c.id !== categoryId && c.isVisible && (!c.isPrivate || isAdminAuthenticated));
        const defaultCat = categories.find(c => c.name === '通用书签' && c.isVisible && (!c.isPrivate || isAdminAuthenticated) && c.id !== categoryId);
        const nextCategory = defaultCat || (nextVisibleCategories.length > 0 ? nextVisibleCategories[0] : categories.find(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated) && c.id !== categoryId));
        handleSetActiveCategory(nextCategory?.id || 'all');
      }
      toast({ title: "分类已删除", description: `"${oldCategoryName}" 及其所有书签已被删除。`, variant: "destructive", duration: 2000 });
      setHasPendingBookmarkOrderChanges(false);
      fetchData();
    } catch (error) {
      console.error("Failed to delete category or its bookmarks:", error);
      const errorMessage = error instanceof Error ? error.message : "删除分类失败。";
      toast({ title: "错误", description: errorMessage, variant: "destructive" });
    }
  };

  const handleOpenEditCategoryDialog = (category: Category) => {
     if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    setCategoryToEdit(category);
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
     if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
     if (categories.some(cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === updatedCategory.name.toLowerCase())) {
      toast({ title: "错误", description: "已存在同名分类。", variant: "destructive" });
      return;
    }
    try {
      const newUpdatedCategory = await updateCategoryAction(updatedCategory);
      setIsEditCategoryDialogOpen(false);
      setCategoryToEdit(null);
      toast({ title: "分类已更新", description: `"${newUpdatedCategory.name}" 已成功更新。`, duration: 2000 });
      fetchData();
    } catch (error)
    {
      console.error("Failed to update category:", error);
      const errorMessage = error instanceof Error ? error.message : "更新分类失败。";
      toast({ title: "错误", description: errorMessage, variant: "destructive" });
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      const PwasValid = await verifyAdminPasswordAction(password);
      if (PwasValid) {
        setIsAdminAuthenticated(true);
        localStorage.setItem(LS_ADMIN_AUTH_KEY, 'true');
        setShowPasswordDialog(false);
        toast({ title: "授权成功", description: "已进入管理模式。", duration: 2000 });
        fetchData();
        await fetchAppSettings();
      } else {
        toast({ title: "密码错误", description: "请输入正确的管理员密码。", variant: "destructive" });
      }
    } catch (error: any) {
        console.error("Password verification error:", error);
        const errorMsg = error instanceof Error ? error.message : "操作失败";
        if (errorMsg.includes("Invalid Server Actions request")) {
          toast({ title: "服务器操作错误", description: "密码验证时请求无效。请检查代理配置。", variant: "destructive", duration: 10000 });
        } else {
          toast({ title: "验证错误", description: `无法验证密码: ${errorMsg}`, variant: "destructive" });
        }
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(LS_ADMIN_AUTH_KEY);
    const currentCat = categories.find(c => c.id === activeCategory);
    if (currentCat && currentCat.isPrivate) {
        const firstPublicCategory = categories.find(c => c.isVisible && !c.isPrivate);
        handleSetActiveCategory(firstPublicCategory?.id || 'all');
    }
    toast({ title: "已退出", description: "已退出管理模式。", duration: 2000 });
    setHasPendingBookmarkOrderChanges(false);
    fetchData();
  };

  const handleOpenAddBookmarkDialog = () => {
    setInitialDataForAddDialog(null);
    setIsAddBookmarkDialogOpen(true);
  };

  const handleCloseAddBookmarkDialog = () => {
    setIsAddBookmarkDialogOpen(false);
    setInitialDataForAddDialog(null);
  };

  const handleCopyBookmarkletScript = async () => {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_SCRIPT);
      toast({ title: "脚本已复制", description: "书签脚本已复制到剪贴板。", duration: 2000 });
    } catch (err) {
      toast({ title: "复制失败", description: "无法复制脚本，请手动复制或检查浏览器权限。", variant: "destructive" });
      console.error('Failed to copy bookmarklet script: ', err);
    }
  };

  /*
  const handleDragEndBookmarks = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = String(active.id);
      const overId = String(over.id);

      setBookmarks((prevBookmarks) => {
        const oldIndex = prevBookmarks.findIndex(bm => bm.id === activeId);
        const newIndex = prevBookmarks.findIndex(bm => bm.id === overId);
        
        if (oldIndex === -1 || newIndex === -1) return prevBookmarks;
        
        const activeBookmark = prevBookmarks[oldIndex];
        const overBookmark = prevBookmarks[newIndex];

        if (activeCategory && activeCategory !== 'all') {
          // Only reorder if bookmarks are in the same active category
          if (activeBookmark.categoryId === activeCategory && overBookmark.categoryId === activeCategory) {
            const itemsInActiveCategory = prevBookmarks.filter(bm => bm.categoryId === activeCategory);
            const oldIndexInContext = itemsInActiveCategory.findIndex(bm => bm.id === activeId);
            const newIndexInContext = itemsInActiveCategory.findIndex(bm => bm.id === overId);
            
            const reorderedItemsInContext = arrayMove(itemsInActiveCategory, oldIndexInContext, newIndexInContext);
            
            const nonActiveCategoryBookmarks = prevBookmarks.filter(bm => bm.categoryId !== activeCategory);
            const finalBookmarks = [...reorderedItemsInContext, ...nonActiveCategoryBookmarks];
            
            setHasPendingBookmarkOrderChanges(true);
            return finalBookmarks;
          }
        }
        return prevBookmarks; // No change if not in the same draggable context or 'all' view
      });
    }
  };
  */

  const handleSaveBookmarksOrder = async () => {
    if (!isAdminAuthenticated || !hasPendingBookmarkOrderChanges || !activeCategory || activeCategory === 'all') {
      toast({ title: "无需保存", description: "书签顺序未更改、未授权或未选择特定分类。" });
      return;
    }

    const orderedIdsInActiveCategory = bookmarks
        .filter(bm => bm.categoryId === activeCategory)
        .map(bm => bm.id);

    try {
      const res = await updateBookmarksOrderAction(orderedIdsInActiveCategory);
      if (res.success) {
        toast({ title: "书签顺序已保存", duration: 2000 });
        setHasPendingBookmarkOrderChanges(false);
        fetchData(true); 
      } else {
        toast({ title: "保存书签顺序失败", description: "服务器未能保存顺序。", variant: "destructive" });
        fetchData(); 
      }
    } catch (error) {
      console.error("Error saving bookmark order:", error);
      toast({ title: "保存书签顺序失败", description: "发生网络错误。", variant: "destructive" });
      fetchData(); 
    }
  };

  const handleOpenSettingsDialog = () => setIsSettingsDialogOpen(true);
  const handleCloseSettingsDialog = () => setIsSettingsDialogOpen(false);

  const handleSaveSettings = async (settingsData: {
    currentPassword?: string;
    newPassword?: string;
    logoText?: string;
    logoIcon?: string;
  }) => {
    let passwordChanged = false;
    let logoChanged = false;

    if (settingsData.newPassword) {
      try {
        const result = await changeAdminPasswordAction(
          settingsData.currentPassword || '',
          settingsData.newPassword
        );
        if (result.success) {
          toast({ title: "密码已更新", description: result.message, duration: 2000 });
          passwordChanged = true;
        } else {
          toast({ title: "密码更新失败", description: result.error, variant: "destructive" });
          return;
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : "操作失败";
        if (errorMsg.includes("Invalid Server Actions request")) {
          toast({ title: "服务器操作错误", description: "密码更新时请求无效。请检查代理配置。", variant: "destructive", duration: 10000 });
        } else {
          toast({ title: "密码更新错误", description: errorMsg, variant: "destructive" });
        }
        return;
      }
    }

    if (settingsData.logoText && settingsData.logoIcon && (settingsData.logoText !== logoText || settingsData.logoIcon !== logoIconName)) {
      try {
        const result = await updateLogoSettingsAction(
          settingsData.logoText,
          settingsData.logoIcon
        );
        if (result.success) {
          setLogoText(settingsData.logoText);
          setLogoIconName(settingsData.logoIcon);
          toast({ title: "Logo 已更新", description: result.message, duration: 2000 });
          logoChanged = true;
        } else {
          toast({ title: "Logo 更新失败", description: result.error, variant: "destructive" });
        }
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : "操作失败";
         if (errorMsg.includes("Invalid Server Actions request")) {
          toast({ title: "服务器操作错误", description: "Logo 更新时请求无效。请检查代理配置。", variant: "destructive", duration: 10000 });
        } else {
          toast({ title: "Logo 更新错误", description: errorMsg, variant: "destructive" });
        }
      }
    }
    
    if (passwordChanged || logoChanged) {
        await fetchAppSettings();
    }
    setIsSettingsDialogOpen(false);
  };


  const visibleCategories = categories.filter(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));

  const filteredBookmarksBySearch = bookmarks.filter(bm => {
    if (!isAdminAuthenticated && bm.isPrivate) return false;
    const categoryOfBookmark = categories.find(c => c.id === bm.categoryId);
    if (!isAdminAuthenticated && categoryOfBookmark && categoryOfBookmark.isPrivate) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      bm.name.toLowerCase().includes(query) ||
      (bm.description && bm.description.toLowerCase().includes(query)) ||
      bm.url.toLowerCase().includes(query)
    );
  });

  const displayedBookmarks = activeCategory === 'all' || !activeCategory
    ? filteredBookmarksBySearch
    : filteredBookmarksBySearch.filter(bm => bm.categoryId === activeCategory);


  if (!isClient || isCheckingSetup || isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <svg className="animate-spin h-20 w-20 text-primary" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="25" cy="25" r="20"
            fill="none"
            stroke="hsl(var(--primary) / 0.25)"
            strokeWidth="4"
          ></circle>
          <circle
            cx="25" cy="25" r="20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="94.2477796076938 31.41592653589793"
          ></circle>
        </svg>
        <p className="mt-6 text-lg font-medium text-foreground">正在加载 晚风Marks...</p>
      </div>
    );
  }

  const categoriesForSidebar = visibleCategories.length > 0 ? visibleCategories : categories.filter(c => c.isVisible);

  const mainContent = (
    // <DndContext
    //   sensors={sensors}
    //   collisionDetection={closestCorners}
    //   onDragEnd={handleDragEndBookmarks}
    // >
      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          logoText={logoText}
          logoIconName={logoIconName}
        />
        <div className="flex flex-1 overflow-hidden">
          {isMobile ? (
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetContent side="left" className="p-0 w-64 sm:w-72 flex flex-col h-full">
                <SheetHeader className="p-4 border-b flex-shrink-0">
                  <SheetTitle className="text-lg font-semibold">导航菜单</SheetTitle>
                </SheetHeader>
                <AppSidebar
                  categories={categoriesForSidebar}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onEditCategory={handleOpenEditCategoryDialog}
                  isAdminAuthenticated={isAdminAuthenticated}
                  activeCategory={activeCategory}
                  setActiveCategory={handleSetActiveCategory}
                  onShowPasswordDialog={() => {
                    setShowPasswordDialog(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex-grow border-r-0 shadow-none"
                />
              </SheetContent>
            </Sheet>
          ) : (
            <AppSidebar
              categories={categoriesForSidebar}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onEditCategory={handleOpenEditCategoryDialog}
              isAdminAuthenticated={isAdminAuthenticated}
              activeCategory={activeCategory}
              setActiveCategory={handleSetActiveCategory}
              onShowPasswordDialog={() => setShowPasswordDialog(true)}
              className="hidden md:flex"
            />
          )}
          <div className="flex-1 flex flex-col overflow-y-auto bg-background relative">
            <main className="flex-grow p-4 md:p-6 relative">
              <BookmarkGrid
                bookmarks={displayedBookmarks}
                categories={categories}
                onDeleteBookmark={handleDeleteBookmark}
                onEditBookmark={handleOpenEditBookmarkDialog}
                isAdminAuthenticated={isAdminAuthenticated}
                currentCategoryName={activeCategory === 'all' ? '全部书签' : categories.find(c=>c.id === activeCategory)?.name || "未知分类"}
                activeCategoryId={activeCategory}
                searchQuery={searchQuery}
                hasPendingOrderChanges={hasPendingBookmarkOrderChanges}
                onSaveOrder={handleSaveBookmarksOrder}
                // onDragEnd={handleDragEndBookmarks} // Temporarily commented out
              />
            </main>
            <footer className="text-center py-3 border-t bg-background/50 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {logoText}. 版权所有.
            </footer>
          </div>
        </div>
      </div>
    // </DndContext>
  );

  return (
    <>
      {mainContent}

      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col space-y-2 z-40">
        {isAdminAuthenticated && (
          <>
            <Button
              onClick={handleOpenAddBookmarkDialog}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg h-10 w-10 rounded-full p-0 flex items-center justify-center"
              aria-label="添加书签"
              title="添加书签"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleCopyBookmarkletScript}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg h-10 w-10 rounded-full p-0 flex items-center justify-center"
              aria-label="复制书签脚本"
              title="复制书签脚本"
            >
              <Copy className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleOpenSettingsDialog}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg h-10 w-10 rounded-full p-0 flex items-center justify-center"
              aria-label="应用设置"
              title="应用设置"
            >
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleLogoutAdmin}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg h-10 w-10 rounded-full p-0 flex items-center justify-center"
              aria-label="退出管理模式"
              title="退出管理模式"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>


      {isAddBookmarkDialogOpen && (
        <AddBookmarkDialog
          isOpen={isAddBookmarkDialogOpen}
          onClose={handleCloseAddBookmarkDialog}
          onAddBookmark={handleAddBookmark}
          categories={categoriesForSidebar.filter(c => c.id !== 'all')}
          activeCategoryId={activeCategory}
          initialData={initialDataForAddDialog}
        />
      )}
      {bookmarkToEdit && isEditBookmarkDialogOpen && (
        <EditBookmarkDialog
          isOpen={isEditBookmarkDialogOpen}
          onClose={() => { setIsEditBookmarkDialogOpen(false); setBookmarkToEdit(null); }}
          onUpdateBookmark={handleUpdateBookmark}
          bookmarkToEdit={bookmarkToEdit}
          categories={categoriesForSidebar.filter(c => c.id !== 'all')}
        />
      )}
      {categoryToEdit && isEditCategoryDialogOpen && (
        <EditCategoryDialog
          isOpen={isEditCategoryDialogOpen}
          onClose={() => { setIsEditCategoryDialogOpen(false); setCategoryToEdit(null); }}
          onUpdateCategory={handleUpdateCategory}
          categoryToEdit={categoryToEdit}
        />
      )}
      {showPasswordDialog && (
        <PasswordDialog
          isOpen={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          onSubmit={handlePasswordSubmit}
        />
      )}
      {isAdminAuthenticated && isSettingsDialogOpen && (
          <SettingsDialog
            isOpen={isSettingsDialogOpen}
            onClose={handleCloseSettingsDialog}
            onSave={handleSaveSettings}
            currentLogoText={logoText}
            currentLogoIconName={logoIconName}
            adminPasswordPresent={adminPasswordExists}
          />
        )}
    </>
  );
}
