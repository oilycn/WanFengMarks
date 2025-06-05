
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import BookmarkGrid from '@/components/BookmarkGrid';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import EditBookmarkDialog from '@/components/EditBookmarkDialog';
import EditCategoryDialog from '@/components/EditCategoryDialog';
import PasswordDialog from '@/components/PasswordDialog';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogOut, Copy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import {
  getBookmarksAction,
  addBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
} from '@/actions/bookmarkActions';
import {
  getCategoriesAction,
  addCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/actions/categoryActions';
import { isSetupCompleteAction, verifyAdminPasswordAction } from '@/actions/authActions'; // New auth actions

const LS_ADMIN_AUTH_KEY = 'wanfeng_admin_auth_v1'; // Client-side flag for UI elements, not for actual security

const APP_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002';

const BOOKMARKLET_SCRIPT = `javascript:(function(){const appUrl='${APP_BASE_URL}';const title=encodeURIComponent(document.title);const pageUrl=encodeURIComponent(window.location.href);let desc='';const metaDesc=document.querySelector('meta[name="description"]');if(metaDesc){desc=encodeURIComponent(metaDesc.content);}}else{const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc){desc=encodeURIComponent(ogDesc.content);}}const popupWidth=500;const popupHeight=650;const left=(screen.width/2)-(popupWidth/2);const top=(screen.height/2)-(popupHeight/2);const wanfengWindow=window.open(\`\${appUrl}/add-bookmark-popup?name=\${title}&url=\${pageUrl}&desc=\${desc}\`, 'wanfengMarksAddBookmarkPopup', \`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=\${popupWidth}, height=\${popupHeight}, top=\${top}, left=\${left}\`);if(wanfengWindow){wanfengWindow.focus();}else{alert('无法打开晚风Marks书签添加窗口。请检查浏览器是否阻止了弹出窗口。');}})();`;


export default function HomePage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false); // UI state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const [isEditBookmarkDialogOpen, setIsEditBookmarkDialogOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  const [initialDataForAddDialog, setInitialDataForAddDialog] = useState<{ name?: string; url?: string; description?: string } | null>(null);


  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true); // Moved setIsClient to the beginning of the effect
    let active = true; // Flag to prevent state updates if component unmounts

    async function performSetupCheck() {
      console.log("HomePage: performSetupCheck running, isClient:", isClient);
      try {
        const setupComplete = await isSetupCompleteAction();
        console.log("HomePage: setupComplete result from server:", setupComplete);
        if (!active) {
          console.log("HomePage: performSetupCheck inactive, returning.");
          return;
        }

        if (!setupComplete) {
          console.log("HomePage: Setup not complete, redirecting to /setup");
          router.push('/setup');
          // setIsCheckingSetup will remain true or component will unmount
        } else {
          console.log("HomePage: Setup complete, proceeding with auth check.");
          // Setup is complete, proceed to check auth and then fetch data
          const adminAuth = localStorage.getItem(LS_ADMIN_AUTH_KEY);
          if (adminAuth === 'true') {
            setIsAdminAuthenticated(true);
            console.log("HomePage: Admin auth found in localStorage.");
          }
          setIsCheckingSetup(false); // Allow main content to load
          console.log("HomePage: isCheckingSetup set to false.");
        }
      } catch (error) {
        if (!active) {
          console.log("HomePage: performSetupCheck (catch) inactive, returning.");
          return;
        }
        console.error("HomePage: Error checking setup status:", error);
        toast({ title: "错误", description: "无法检查应用配置状态，请刷新。", variant: "destructive" });
        router.push('/setup'); // Fallback to setup if check fails critically
      }
    }

    if (isClient) { // Only run the check if isClient is true
        performSetupCheck();
    }
    

    return () => {
      active = false;
      console.log("HomePage: useEffect for setup check cleanup.");
    };
  }, [isClient, router, toast]); // Added isClient to dependency array


  const fetchData = useCallback(async () => {
    console.log("HomePage: fetchData called. isLoading set to true.");
    setIsLoading(true);
    try {
      const [fetchedBookmarks, fetchedCategories] = await Promise.all([
        getBookmarksAction(),
        getCategoriesAction(),
      ]);
      setBookmarks(fetchedBookmarks);
      if (fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        const defaultCategory: Category = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
        setCategories([defaultCategory]);
      }
      console.log("HomePage: Data fetched successfully.");
    } catch (error) {
      console.error("HomePage: Failed to fetch data:", error);
      toast({ title: "错误", description: "加载数据失败，请稍后重试。", variant: "destructive" });
       if (categories.length === 0) {
           const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
           setCategories([defaultCategory]);
       }
    } finally {
      setIsLoading(false);
      console.log("HomePage: fetchData finished. isLoading set to false.");
    }
  }, [toast, categories.length]);

  useEffect(() => {
    // Only fetch data if client is ready AND setup check is complete (isCheckingSetup is false)
    if (isClient && !isCheckingSetup) {
      console.log("HomePage: Conditions met for fetching data (isClient && !isCheckingSetup).");
      fetchData();
    } else {
      console.log("HomePage: Conditions NOT met for fetching data. isClient:", isClient, "isCheckingSetup:", isCheckingSetup);
    }
  }, [isClient, isCheckingSetup, fetchData]);


  useEffect(() => {
    if(categories.length > 0 && !activeCategory && !isLoading) {
      const firstVisibleCategory = categories.find(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));
      setActiveCategory(firstVisibleCategory?.id || 'all');
    }
  }, [categories, activeCategory, isAdminAuthenticated, isLoading]);

  const handleAddBookmark = async (newBookmarkData: Omit<Bookmark, 'id'>) => {
    try {
      const newBookmark = await addBookmarkAction(newBookmarkData);
      setBookmarks(prev => [...prev, newBookmark]);
      setIsAddBookmarkDialogOpen(false);
      setInitialDataForAddDialog(null); 
      toast({ title: "书签已添加", description: `"${newBookmark.name}" 已成功添加。` });
    } catch (error) {
      console.error("Failed to add bookmark:", error);
      toast({ title: "错误", description: "添加书签失败。", variant: "destructive" });
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!isAdminAuthenticated) { // This client-side check can remain for UI quick-hide
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    try {
      await deleteBookmarkAction(bookmarkId);
      setBookmarks(prev => prev.filter(bm => bm.id !== bookmarkId));
      toast({ title: "书签已删除", description: "书签已从服务器删除。", variant: "destructive" });
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
      toast({ title: "错误", description: "删除书签失败。", variant: "destructive" });
    }
  };

  const handleOpenEditBookmarkDialog = (bookmark: Bookmark) => {
    if (!isAdminAuthenticated) {
      toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
      return;
    }
    setBookmarkToEdit(bookmark);
    setIsEditBookmarkDialogOpen(true);
  };

  const handleUpdateBookmark = async (updatedBookmark: Bookmark) => {
     if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    try {
      const newUpdatedBookmark = await updateBookmarkAction(updatedBookmark);
      setBookmarks(prev => prev.map(bm => bm.id === newUpdatedBookmark.id ? newUpdatedBookmark : bm));
      setIsEditBookmarkDialogOpen(false);
      setBookmarkToEdit(null);
      toast({ title: "书签已更新", description: `"${newUpdatedBookmark.name}" 已成功更新。` });
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      toast({ title: "错误", description: "更新书签失败。", variant: "destructive" });
    }
  };

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
      setCategories(prev => [...prev, newCategory]);
      toast({ title: "分类已添加", description: `"${newCategory.name}" 已成功添加。` });
    } catch (error) {
      console.error("Failed to add category:", error);
      toast({ title: "错误", description: "添加分类失败。", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!isAdminAuthenticated) {
        toast({ title: "未授权", description: "请先进入管理模式。", variant: "destructive" });
        return;
    }
    try {
      const bookmarksInCategory = bookmarks.filter(bm => bm.categoryId === categoryId);
      for (const bm of bookmarksInCategory) {
        await deleteBookmarkAction(bm.id);
      }
      await deleteCategoryAction(categoryId);
      
      setBookmarks(prev => prev.filter(bm => bm.categoryId !== categoryId));
      const oldCategoryName = categories.find(c => c.id === categoryId)?.name || '该分类';
      setCategories(prev => prev.filter(cat => cat.id !== categoryId && cat.id !== 'default'));
      
      if (activeCategory === categoryId) {
        const nextVisibleCategories = categories.filter(c => c.id !== categoryId && c.isVisible && (!c.isPrivate || isAdminAuthenticated));
        const nextCategory = nextVisibleCategories.length > 0 ? nextVisibleCategories[0] : categories.find(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));
        setActiveCategory(nextCategory?.id || 'all');
      }
      toast({ title: "分类已删除", description: `"${oldCategoryName}" 及其所有书签已被删除。`, variant: "destructive" });
    } catch (error) {
      console.error("Failed to delete category or its bookmarks:", error);
      toast({ title: "错误", description: "删除分类失败。", variant: "destructive" });
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
      setCategories(prev => prev.map(cat => cat.id === newUpdatedCategory.id ? newUpdatedCategory : cat));
      setIsEditCategoryDialogOpen(false);
      setCategoryToEdit(null);
      toast({ title: "分类已更新", description: `"${newUpdatedCategory.name}" 已成功更新。` });
    } catch (error)
    {
      console.error("Failed to update category:", error);
      toast({ title: "错误", description: "更新分类失败。", variant: "destructive" });
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      const PwasValid = await verifyAdminPasswordAction(password);
      if (PwasValid) {
        setIsAdminAuthenticated(true);
        localStorage.setItem(LS_ADMIN_AUTH_KEY, 'true');
        setShowPasswordDialog(false);
        toast({ title: "授权成功", description: "已进入管理模式。" });
        fetchData(); // Re-fetch data in case private items are now visible
      } else {
        toast({ title: "密码错误", description: "请输入正确的管理员密码。", variant: "destructive" });
      }
    } catch (error) {
        console.error("Password verification error:", error);
        toast({ title: "验证错误", description: "无法验证密码，请稍后再试。", variant: "destructive" });
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(LS_ADMIN_AUTH_KEY);
    const currentCat = categories.find(c => c.id === activeCategory);
    if (currentCat && currentCat.isPrivate) {
        const firstPublicCategory = categories.find(c => c.isVisible && !c.isPrivate);
        setActiveCategory(firstPublicCategory?.id || 'all');
    }
    toast({ title: "已退出", description: "已退出管理模式。" });
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
      toast({ title: "脚本已复制", description: "书签脚本已复制到剪贴板。" });
    } catch (err) {
      toast({ title: "复制失败", description: "无法复制脚本，请手动复制或检查浏览器权限。", variant: "destructive" });
      console.error('Failed to copy bookmarklet script: ', err);
    }
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

  const displayedBookmarks = activeCategory === 'all'
    ? filteredBookmarksBySearch
    : filteredBookmarksBySearch.filter(bm => bm.categoryId === activeCategory);

  if (!isClient || isCheckingSetup || isLoading) { 
    console.log("HomePage: Render loading state. isClient:", isClient, "isCheckingSetup:", isCheckingSetup, "isLoading:", isLoading);
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-primary">正在加载 晚风Marks...</div>
      </div>
    );
  }
  console.log("HomePage: Render main content. isClient:", isClient, "isCheckingSetup:", isCheckingSetup, "isLoading:", isLoading);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          categories={visibleCategories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onEditCategory={handleOpenEditCategoryDialog}
          isAdminAuthenticated={isAdminAuthenticated}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onShowPasswordDialog={() => setShowPasswordDialog(true)}
        />
        <div className="flex-1 flex flex-col overflow-y-auto bg-background relative">
          <main className="flex-grow p-4 md:p-6 relative">
            {isAdminAuthenticated && (
              <div className="fixed bottom-16 right-6 flex flex-col space-y-2 z-20">
                 <Button
                  onClick={handleOpenAddBookmarkDialog}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg 
                             h-10 w-10 rounded-full p-0 
                             flex items-center justify-center
                             transition-all ease-in-out duration-500"
                  aria-label="添加书签"
                  title="添加书签"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleCopyBookmarkletScript}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg 
                             h-10 w-10 rounded-full p-0
                             flex items-center justify-center
                             transition-all ease-in-out duration-500"
                  aria-label="复制书签脚本"
                  title="复制书签脚本"
                >
                  <Copy className="h-5 w-5" />
                </Button>
                 <Button
                  onClick={handleLogoutAdmin}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg 
                             h-10 w-10 rounded-full p-0
                             flex items-center justify-center
                             transition-all ease-in-out duration-500"
                  aria-label="退出管理模式"
                  title="退出管理模式"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}

            <BookmarkGrid
              bookmarks={displayedBookmarks}
              categories={categories}
              onDeleteBookmark={handleDeleteBookmark}
              onEditBookmark={handleOpenEditBookmarkDialog}
              isAdminAuthenticated={isAdminAuthenticated}
              currentCategoryName={activeCategory === 'all' ? '全部书签' : categories.find(c=>c.id === activeCategory)?.name || "未知分类"}
              activeCategoryId={activeCategory}
              searchQuery={searchQuery}
            />
          </main>
          <footer className="text-center py-3 border-t bg-background/50 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} 晚风Marks. 版权所有.
          </footer>
        </div>
      </div>

      <AddBookmarkDialog
        isOpen={isAddBookmarkDialogOpen}
        onClose={handleCloseAddBookmarkDialog}
        onAddBookmark={handleAddBookmark}
        categories={visibleCategories.filter(c => c.id !== 'all')}
        activeCategoryId={activeCategory}
        initialData={initialDataForAddDialog}
      />
      {bookmarkToEdit && (
        <EditBookmarkDialog
          isOpen={isEditBookmarkDialogOpen}
          onClose={() => { setIsEditBookmarkDialogOpen(false); setBookmarkToEdit(null); }}
          onUpdateBookmark={handleUpdateBookmark}
          bookmarkToEdit={bookmarkToEdit}
          categories={visibleCategories.filter(c => c.id !== 'all')}
        />
      )}
      {categoryToEdit && (
         <EditCategoryDialog
          isOpen={isEditCategoryDialogOpen}
          onClose={() => { setIsEditCategoryDialogOpen(false); setCategoryToEdit(null); }}
          onUpdateCategory={handleUpdateCategory}
          categoryToEdit={categoryToEdit}
        />
      )}
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
}
    
