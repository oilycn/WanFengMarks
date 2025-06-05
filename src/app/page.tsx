
"use client";

import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import BookmarkGrid from '@/components/BookmarkGrid';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import PasswordDialog from '@/components/PasswordDialog'; // 新增密码对话框
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Settings, PlusCircle, EyeOff, LogIn } from 'lucide-react';

const LS_BOOKMARKS_KEY = 'aegisMarks_bookmarks_v2_zh'; // 更新版本以避免冲突
const LS_CATEGORIES_KEY = 'aegisMarks_categories_v2_zh'; // 更新版本
const ADMIN_PASSWORD = "7";

export default function HomePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const storedBookmarks = localStorage.getItem(LS_BOOKMARKS_KEY);
    if (storedBookmarks) {
      // 确保旧数据有 description 字段
      const parsedBookmarks = JSON.parse(storedBookmarks).map((bm: Bookmark) => ({ ...bm, description: bm.description || '' }));
      setBookmarks(parsedBookmarks);
    }

    const storedCategories = localStorage.getItem(LS_CATEGORIES_KEY);
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      const defaultCategory = { id: 'default', name: '通用书签', isVisible: true };
      setCategories([defaultCategory]);
      localStorage.setItem(LS_CATEGORIES_KEY, JSON.stringify([defaultCategory]));
    }
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
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);


  const handleAddBookmark = (newBookmarkData: Omit<Bookmark, 'id'>) => {
    const bookmarkWithId = { ...newBookmarkData, id: Date.now().toString() + Math.random().toString(36).substring(2,7) };
    setBookmarks(prev => [...prev, bookmarkWithId]);
    setIsAddBookmarkDialogOpen(false);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (!isAdminAuthenticated) return; // 增加权限检查
    setBookmarks(prev => prev.filter(bm => bm.id !== bookmarkId));
  };

  const handleToggleCategoryVisibility = (categoryId: string) => {
    if (!isAdminAuthenticated) return;
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isVisible: !cat.isVisible } : cat
      )
    );
  };

  const handleAddCategory = (categoryName: string) => {
    if (!isAdminAuthenticated) return;
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      console.warn("分类已存在");
      return;
    }
    const newCategory = { id: Date.now().toString() + Math.random().toString(36).substring(2,7), name: categoryName, isVisible: true };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    if (!isAdminAuthenticated) return;
    setBookmarks(prev => prev.filter(bm => bm.categoryId !== categoryId));
    setCategories(prev => prev.filter(cat => cat.id !== categoryId && cat.id !== 'default'));
     if (activeCategory === categoryId) {
      setActiveCategory(categories.find(c => c.id !== categoryId)?.id || null);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      setShowPasswordDialog(false);
    } else {
      alert("密码错误！");
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };
  
  const displayedBookmarks = activeCategory === 'all' 
    ? bookmarks 
    : bookmarks.filter(bm => bm.categoryId === activeCategory);

  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-primary">正在加载 AegisMarks...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onToggleVisibility={handleToggleCategoryVisibility}
        isAdminAuthenticated={isAdminAuthenticated}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <AppHeader />
        <main className="flex-grow p-4 md:p-6">
          {isAdminAuthenticated && (
            <div className="mb-4 flex justify-start items-center gap-2">
              <Button onClick={() => setIsAddBookmarkDialogOpen(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> 添加书签
              </Button>
              <Button variant="outline" onClick={handleLogoutAdmin}>
                <EyeOff className="mr-2 h-4 w-4" /> 退出管理模式
              </Button>
            </div>
          )}
          {!isAdminAuthenticated && (
            <div className="mb-4 flex justify-start">
               <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="shadow-sm">
                <LogIn className="mr-2 h-4 w-4" /> 进入管理模式
              </Button>
            </div>
          )}
          
          <BookmarkGrid
            bookmarks={displayedBookmarks} // 显示筛选后的书签
            categories={categories.filter(c => activeCategory === 'all' || c.id === activeCategory)} // 只传递当前激活的或所有分类
            onDeleteBookmark={handleDeleteBookmark}
            isAdminAuthenticated={isAdminAuthenticated}
            currentCategoryName={categories.find(c=>c.id === activeCategory)?.name || "全部书签"}
            activeCategoryId={activeCategory}
          />
        </main>
        <footer className="text-center py-3 border-t bg-background/50 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AegisMarks. 版权所有.
        </footer>
      </div>

      <AddBookmarkDialog
        isOpen={isAddBookmarkDialogOpen}
        onClose={() => setIsAddBookmarkDialogOpen(false)}
        onAddBookmark={handleAddBookmark}
        categories={categories}
      />
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
}
