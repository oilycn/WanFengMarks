
"use client";

import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import BookmarkGrid from '@/components/BookmarkGrid';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import PasswordDialog from '@/components/PasswordDialog';
import type { Bookmark, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, EyeOff, Eye } from 'lucide-react';

const LS_BOOKMARKS_KEY = 'wanfeng_bookmarks_v1_zh';
const LS_CATEGORIES_KEY = 'wanfeng_categories_v1_zh';
const LS_ADMIN_AUTH_KEY = 'wanfeng_admin_auth_v1'; 
const ADMIN_PASSWORD = "7";

export default function HomePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        icon: bm.icon, // Retain icon if it exists, otherwise it's undefined
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
      // Default category if none are stored
      const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
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
      // Set initial active category to the first visible one
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

  const handleAddCategory = (categoryName: string, icon?: string, isPrivate?: boolean) => {
    if (!isAdminAuthenticated) return;
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      // Consider using a toast notification here instead of console.warn
      console.warn("分类已存在");
      return;
    }
    const newCategory = { 
      id: Date.now().toString() + Math.random().toString(36).substring(2,7), 
      name: categoryName, 
      isVisible: true, 
      icon: icon || 'Folder', // Default icon if none provided
      isPrivate: isPrivate || false
    };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    if (!isAdminAuthenticated) return;
    // Delete bookmarks in this category
    setBookmarks(prev => prev.filter(bm => bm.categoryId !== categoryId));
    // Delete the category itself (ensure 'default' category cannot be deleted)
    setCategories(prev => prev.filter(cat => cat.id !== categoryId && cat.id !== 'default'));
    // If active category was deleted, switch to 'all' or first available
     if (activeCategory === categoryId) {
      const nextVisibleCategories = categories.filter(c => c.id !== categoryId && c.isVisible && (!c.isPrivate || isAdminAuthenticated));
      const nextCategory = nextVisibleCategories.length > 0 ? nextVisibleCategories[0] : categories.find(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));
      setActiveCategory(nextCategory?.id || 'all');
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem(LS_ADMIN_AUTH_KEY, 'true');
      setShowPasswordDialog(false);
    } else {
      alert("密码错误！"); // Consider using a toast for errors
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(LS_ADMIN_AUTH_KEY);
    // If current active category is private, switch to a public one or 'all'
    const currentCat = categories.find(c => c.id === activeCategory);
    if (currentCat && currentCat.isPrivate) {
        const firstPublicCategory = categories.find(c => c.isVisible && !c.isPrivate);
        setActiveCategory(firstPublicCategory?.id || 'all');
    }
  };
  
  // Filter categories based on visibility and admin authentication status
  const visibleCategories = categories.filter(c => c.isVisible && (!c.isPrivate || isAdminAuthenticated));

  // Filter bookmarks based on search query and privacy
  const filteredBookmarksBySearch = bookmarks.filter(bm => {
    // Hide private bookmarks if not admin
    if (!isAdminAuthenticated && bm.isPrivate) return false; 
    
    // Hide bookmarks in private categories if not admin
    const categoryOfBookmark = categories.find(c => c.id === bm.categoryId);
    if (!isAdminAuthenticated && categoryOfBookmark && categoryOfBookmark.isPrivate) return false;

    // Apply search query
    if (!searchQuery.trim()) return true; // Show all if search is empty
    const query = searchQuery.toLowerCase();
    return (
      bm.name.toLowerCase().includes(query) ||
      (bm.description && bm.description.toLowerCase().includes(query)) || // Check description too
      bm.url.toLowerCase().includes(query)
    );
  });

  // Further filter bookmarks by active category
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
    <div className="flex flex-col h-screen overflow-hidden"> {/* Main container is now flex-col */}
      <AppHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="flex flex-1 overflow-hidden"> {/* Container for sidebar and main content */}
        <AppSidebar
          categories={visibleCategories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          isAdminAuthenticated={isAdminAuthenticated}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onShowPasswordDialog={() => setShowPasswordDialog(true)}
        />
        <div className="flex-1 flex flex-col overflow-y-auto bg-background">
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
            
            <BookmarkGrid
              bookmarks={displayedBookmarks}
              categories={categories} // Pass all categories for name/icon lookup, filtering done internally or by displayedBookmarks
              onDeleteBookmark={handleDeleteBookmark}
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
        onClose={() => setIsAddBookmarkDialogOpen(false)}
        onAddBookmark={handleAddBookmark}
        categories={visibleCategories.filter(c => c.id !== 'all')} // Exclude 'all' from category selection
      />
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
}
