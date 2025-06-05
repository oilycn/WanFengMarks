
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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


const LS_ADMIN_AUTH_KEY = 'wanfeng_admin_auth_v1'; // Admin auth still local for UI control
const ADMIN_PASSWORD = "7";

const APP_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002';

const BOOKMARKLET_SCRIPT = `javascript:(function(){const appUrl='${APP_BASE_URL}';const title=encodeURIComponent(document.title);const pageUrl=encodeURIComponent(window.location.href);let desc='';const metaDesc=document.querySelector('meta[name="description"]');if(metaDesc){desc=encodeURIComponent(metaDesc.content);}else{const ogDesc=document.querySelector('meta[property="og:description"]');if(ogDesc){desc=encodeURIComponent(ogDesc.content);}}const popupWidth=500;const popupHeight=650;const left=(screen.width/2)-(popupWidth/2);const top=(screen.height/2)-(popupHeight/2);const wanfengWindow=window.open(\`\${appUrl}/add-bookmark-popup?name=\${title}&url=\${pageUrl}&desc=\${desc}\`, 'wanfengMarksAddBookmarkPopup', \`toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=\${popupWidth}, height=\${popupHeight}, top=\${top}, left=\${left}\`);if(wanfengWindow){wanfengWindow.focus();}else{alert('无法打开晚风Marks书签添加窗口。请检查浏览器是否阻止了弹出窗口。');}})();`;


export default function HomePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isEditBookmarkDialogOpen, setIsEditBookmarkDialogOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  const [initialDataForAddDialog, setInitialDataForAddDialog] = useState<{ name?: string; url?: string; description?: string } | null>(null);


  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const adminAuth = localStorage.getItem(LS_ADMIN_AUTH_KEY);
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []); 

  const fetchData = useCallback(async () => {
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
        // Ensure a default category exists if none are fetched (e.g., first run with empty server data)
        const defaultCategory: Category = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
        // Optionally, you might want to add this default category to the server if it doesn't exist.
        // For now, just setting it client-side if categories are empty.
        // const savedDefaultCat = await addCategoryAction('通用书签', 'Folder', false);
        setCategories([defaultCategory]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "错误", description: "加载数据失败，请稍后重试。", variant: "destructive" });
      // Fallback to a default category if server fails
       if (categories.length === 0) {
           const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
           setCategories([defaultCategory]);
       }
    } finally {
      setIsLoading(false);
    }
  }, [toast, categories.length]); // Added categories.length to re-run if categories become empty

  useEffect(() => {
    if (isClient) {
      fetchData();
    }
  }, [isClient, fetchData]);


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
      setInitialDataForAddDialog(null); // Clear prefill data
      toast({ title: "书签已添加", description: `"${newBookmark.name}" 已成功添加。` });
    } catch (error) {
      console.error("Failed to add bookmark:", error);
      toast({ title: "错误", description: "添加书签失败。", variant: "destructive" });
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!isAdminAuthenticated) return;
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
    if (!isAdminAuthenticated) return;
    setBookmarkToEdit(bookmark);
    setIsEditBookmarkDialogOpen(true);
  };

  const handleUpdateBookmark = async (updatedBookmark: Bookmark) => {
    if (!isAdminAuthenticated) return;
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
    if (!isAdminAuthenticated) return;
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
    if (!isAdminAuthenticated) return;
    try {
      // First, delete all bookmarks in this category from the server
      const bookmarksInCategory = bookmarks.filter(bm => bm.categoryId === categoryId);
      for (const bm of bookmarksInCategory) {
        await deleteBookmarkAction(bm.id);
      }
      // Then, delete the category itself
      await deleteCategoryAction(categoryId);
      
      // Update client state
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
    if (!isAdminAuthenticated) return;
    setCategoryToEdit(category);
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
     if (!isAdminAuthenticated) return;
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

  const handlePasswordSubmit = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem(LS_ADMIN_AUTH_KEY, 'true');
      setShowPasswordDialog(false);
      toast({ title: "授权成功", description: "已进入管理模式。" });
      // Re-fetch data in case private items are now visible
      fetchData();
    } else {
      toast({ title: "密码错误", description: "请输入正确的管理员密码。", variant: "destructive" });
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
    // Re-fetch data to hide private items
    fetchData();
  };
  
  const handleOpenAddBookmarkDialog = () => {
    setInitialDataForAddDialog(null); // Clear any old prefill data
    setIsAddBookmarkDialogOpen(true);
  };

  const handleCloseAddBookmarkDialog = () => {
    setIsAddBookmarkDialogOpen(false);
    setInitialDataForAddDialog(null); // Clear prefill data on close
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

  if (!isClient || isLoading) { // Show loading state while fetching or if not client yet
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-primary">正在加载 晚风Marks...</div>
      </div>
    );
  }

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
                             flex items-center justify-center
                             h-10 w-10 rounded-full p-0 
                             transition-colors duration-200"
                  aria-label="添加书签"
                  title="添加书签"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleCopyBookmarkletScript}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg
                             flex items-center justify-center
                             h-10 w-10 rounded-full p-0
                             transition-colors duration-200"
                  aria-label="复制书签脚本"
                  title="复制书签脚本"
                >
                  <Copy className="h-5 w-5" />
                </Button>
                 <Button
                  onClick={handleLogoutAdmin}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg
                             flex items-center justify-center
                             h-10 w-10 rounded-full p-0
                             transition-colors duration-200"
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
    
