
"use client";

import React, { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import DashboardInfo from '@/components/DashboardInfo';
import ControlsArea from '@/components/ControlsArea';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import BookmarkGrid from '@/components/BookmarkGrid';
import type { Bookmark, Category } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const LS_BOOKMARKS_KEY = 'aegisMarks_bookmarks_v1_zh';
const LS_CATEGORIES_KEY = 'aegisMarks_categories_v1_zh';

export default function HomePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const storedBookmarks = localStorage.getItem(LS_BOOKMARKS_KEY);
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks));
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

  const handleAddBookmark = (newBookmarkData: Omit<Bookmark, 'id'>) => {
    const bookmarkWithId = { ...newBookmarkData, id: Date.now().toString() + Math.random().toString(36).substring(2,7) };
    setBookmarks(prev => [...prev, bookmarkWithId]);
    setIsAddBookmarkDialogOpen(false);
  };

  const handleDeleteBookmark = (bookmarkId: string) => {
    setBookmarks(prev => prev.filter(bm => bm.id !== bookmarkId));
  };

  const handleToggleCategoryVisibility = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isVisible: !cat.isVisible } : cat
      )
    );
  };

  const handleAddCategory = (categoryName: string) => {
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      console.warn("分类已存在");
      return;
    }
    const newCategory = { id: Date.now().toString() + Math.random().toString(36).substring(2,7), name: categoryName, isVisible: true };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    setBookmarks(prev => prev.filter(bm => bm.categoryId !== categoryId));
    setCategories(prev => prev.filter(cat => cat.id !== categoryId && cat.id !== 'default'));
  };

  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-primary">正在加载 AegisMarks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-2 min-h-screen flex flex-col">
      <SiteHeader />
      <DashboardInfo />
      
      <main className="flex-grow mt-2 mb-6">
        <BookmarkGrid bookmarks={bookmarks} categories={categories} onDeleteBookmark={handleDeleteBookmark} />
      </main>

      <Separator className="my-6" />

      <div className="mb-6">
        <Button variant="outline" onClick={() => setShowControls(!showControls)} className="mb-4 shadow-sm">
          <Settings className="mr-2 h-4 w-4" />
          {showControls ? '隐藏管理面板' : '显示管理面板'}
        </Button>

        {showControls && (
          <Card className="bg-muted/30 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">内容管理</CardTitle>
            </CardHeader>
            <CardContent>
              <ControlsArea
                categories={categories}
                onAddCategory={handleAddCategory}
                onToggleVisibility={handleToggleCategoryVisibility}
                onDeleteCategory={handleDeleteCategory}
                onOpenAddBookmarkDialog={() => setIsAddBookmarkDialogOpen(true)}
              />
            </CardContent>
          </Card>
        )}
      </div>
      
      <AddBookmarkDialog
        isOpen={isAddBookmarkDialogOpen}
        onClose={() => setIsAddBookmarkDialogOpen(false)}
        onAddBookmark={handleAddBookmark}
        categories={categories}
      />
      <footer className="text-center py-4 mt-auto border-t border-border">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AegisMarks. 版权所有.</p>
      </footer>
    </div>
  );
}
