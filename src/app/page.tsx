
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
import { PlusCircle, LogOut, Copy } from 'lucide-react'; // Changed EyeOff to LogOut
import { useToast } from "@/hooks/use-toast";

const LS_BOOKMARKS_KEY = 'wanfeng_bookmarks_v1_zh';
const LS_CATEGORIES_KEY = 'wanfeng_categories_v1_zh';
const LS_ADMIN_AUTH_KEY = 'wanfeng_admin_auth_v1';
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

  const [isEditBookmarkDialogOpen, setIsEditBookmarkDialogOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const adminAuth = localStorage.getItem(LS_ADMIN_AUTH_KEY);
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []); 

  useEffect(() => {
    if (!isClient) return;

    const storedBookmarks = localStorage.getItem(LS_BOOKMARKS_KEY);
    if (storedBookmarks) {
      const parsedBookmarks = JSON.parse(storedBookmarks).map((bm: Bookmark) => ({
        ...bm,
        description: bm.description || '',
        icon: bm.icon,
        isPrivate: bm.isPrivate || false
      }));
      setBookmarks(parsedBookmarks);
    }

    const storedCategories = localStorage.getItem(LS_CATEGORIES_KEY);
    if (storedCategories) {
      const parsedCategories = JSON.parse(storedCategories).map((cat: Category) => ({
        ...cat,
        isPrivate: cat.isPrivate || false
      }));
      setCategories(parsedCategories);
    } else {
      const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
      setCategories([defaultCategory]);
      localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify([defaultCategory]));
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LS_BOOKMARKS_KEY && event.newValue) {
        const parsedBookmarks = JSON.parse(event.newValue).map((bm: Bookmark) => ({
          ...bm,
          description: bm.description || '',
          icon: bm.icon,
          isPrivate: bm.isPrivate || false
        }));
        setBookmarks(parsedBookmarks);
      }
      if (event.key === LS_CATEGORIES_KEY && event.newValue) {
        const parsedCategories = JSON.parse(event.newValue).map((cat: Category) => ({
         ...cat,
         isPrivate: cat.isPrivate || false
        }));
        setCategories(parsedCategories);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };

  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem(LS_BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks, isClient]);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories, isClient]);

  useEffect(() => {
    if(categories.length > 0 && !activeCategory) {
      const firstVisibleCategory = categories.find(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));
      setActiveCategory(firstVisibleCategory?.id || 'all');
    }
  }, [categories, activeCategory, isAdminAuthenticated]);

  const handleAddBookmark = (newBookmarkData: Omit<Bookmark, 'id'>) => {
    const bookmarkWithId = { ...newBookmarkData, id: Date.now().toString() + Math.random().toString(36).substring(2,7) };
    setBookmarks(prev => [...prev, bookmarkWithId]);
    setIsAddBookmarkDialogOpen(false);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (!isAdminAuthenticated) return;
    setBookmarks(prev => prev.filter(bm => bm.id !== bookmarkId));
  };

  const handleOpenEditBookmarkDialog = (bookmark: Bookmark) => {
    if (!isAdminAuthenticated) return;
    setBookmarkToEdit(bookmark);
    setIsEditBookmarkDialogOpen(true);
  };

  const handleUpdateBookmark = (updatedBookmark: Bookmark) => {
    if (!isAdminAuthenticated) return;
    setBookmarks(prev => prev.map(bm => bm.id === updatedBookmark.id ? updatedBookmark : bm));
    setIsEditBookmarkDialogOpen(false);
    setBookmarkToEdit(null);
    toast({ title: "书签已更新", description: `"${updatedBookmark.name}" 已成功更新。` });
  };

  const handleAddCategory = (categoryName: string, icon?: string, isPrivate?: boolean) => {
    if (!isAdminAuthenticated) return;
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      toast({ title: "错误", description: "分类名称已存在。", variant: "destructive" });
      return;
    }
    const newCategory = {
      id: Date.now().toString() + Math.random().toString(36).substring(2,7),
      name: categoryName,
      isVisible: true,
      icon: icon || 'Folder',
      isPrivate: isPrivate || false
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!isAdminAuthenticated) return;
    setBookmarks(prev => prev.filter(bm => bm.categoryId !== categoryId));
    setCategories(prev => prev.filter(cat => cat.id !== categoryId && cat.id !== 'default'));
     if (activeCategory === categoryId) {
      const nextVisibleCategories = categories.filter(c => c.id !== categoryId && c.isVisible && (!c.isPrivate || isAdminAuthenticated));
      const nextCategory = nextVisibleCategories.length > 0 ? nextVisibleCategories[0] : categories.find(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));
      setActiveCategory(nextCategory?.id || 'all');
    }
  };

  const handleOpenEditCategoryDialog = (category: Category) => {
    if (!isAdminAuthenticated) return;
    setCategoryToEdit(category);
    setIsEditCategoryDialogOpen(true);
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
     if (!isAdminAuthenticated) return;
     if (categories.some(cat => cat.id !== updatedCategory.id && cat.name.toLowerCase() === updatedCategory.name.toLowerCase())) {
      toast({ title: "错误", description: "已存在同名分类。", variant: "destructive" });
      return;
    }
    setCategories(prev => prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
    setIsEditCategoryDialogOpen(false);
    setCategoryToEdit(null);
    toast({ title: "分类已更新", description: `"${updatedCategory.name}" 已成功更新。` });
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem(LS_ADMIN_AUTH_KEY, 'true');
      setShowPasswordDialog(false);
      toast({ title: "授权成功", description: "已进入管理模式。" });
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
  };
  
  const handleOpenAddBookmarkDialog = () => {
    setIsAddBookmarkDialogOpen(true);
  };

  const handleCloseAddBookmarkDialog = () => {
    setIsAddBookmarkDialogOpen(false);
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

  if (!isClient) {
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
        <div className="flex-1 flex flex-col overflow-y-auto bg-background relative"> {/* Added relative here */}
          <main className="flex-grow p-4 md:p-6 relative"> {/* Added relative here */}
            {isAdminAuthenticated && (
              <div className="fixed top-20 right-4 md:right-6 flex flex-col space-y-2 z-20">
                <Button
                  onClick={handleOpenAddBookmarkDialog}
                  className="group bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-all duration-200 ease-in-out 
                             w-10 h-10 rounded-full p-0 flex items-center justify-center 
                             hover:w-auto hover:rounded-md hover:px-3 hover:py-2 hover:justify-start"
                  aria-label="添加书签"
                  title="添加书签"
                >
                  <PlusCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-2 hidden group-hover:inline whitespace-nowrap text-sm">添加书签</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogoutAdmin}
                  className="group bg-card hover:bg-muted text-foreground shadow-lg transition-all duration-200 ease-in-out 
                             w-10 h-10 rounded-full p-0 flex items-center justify-center 
                             hover:w-auto hover:rounded-md hover:px-3 hover:py-2 hover:justify-start"
                  aria-label="退出管理模式"
                  title="退出管理模式"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-2 hidden group-hover:inline whitespace-nowrap text-sm">退出管理模式</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyBookmarkletScript}
                  className="group bg-card hover:bg-muted text-foreground shadow-lg transition-all duration-200 ease-in-out 
                             w-10 h-10 rounded-full p-0 flex items-center justify-center 
                             hover:w-auto hover:rounded-md hover:px-3 hover:py-2 hover:justify-start"
                  aria-label="复制书签脚本"
                  title="复制书签脚本"
                >
                  <Copy className="h-5 w-5 flex-shrink-0" />
                  <span className="ml-2 hidden group-hover:inline whitespace-nowrap text-sm">复制书签脚本</span>
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
    

    