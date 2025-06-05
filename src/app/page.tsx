"use client";

import React, { useState, useEffect } from 'react';
import SiteHeader from '@/components/SiteHeader';
import DashboardInfo from '@/components/DashboardInfo';
import ControlsArea from '@/components/ControlsArea';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import BookmarkGrid from '@/components/BookmarkGrid';
import type { Bookmark, Category } from '@/types';

const LS_BOOKMARKS_KEY = 'aegisMarks_bookmarks_v1_zh'; // Changed key for Chinese version
const LS_CATEGORIES_KEY = 'aegisMarks_categories_v1_zh'; // Changed key for Chinese version

export default function HomePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddBookmarkDialogOpen, setIsAddBookmarkDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indicate client-side rendering is complete
  }, []);

  // Load data from localStorage on mount (only on client)
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

  // Save data to localStorage when it changes (only on client)
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
      // Potentially show a toast message for duplicate category name
      console.warn("分类已存在");
      return;
    }
    const newCategory = { id: Date.now().toString() + Math.random().toString(36).substring(2,7), name: categoryName, isVisible: true };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    setBookmarks(prev => prev.filter(bm => bm.categoryId !== categoryId));
    setCategories(prev => prev.filter(cat => cat.id !== categoryId && cat.id !== 'default')); // Prevent deleting default
  };

  if (!isClient) {
    // Render a loading state or null during SSR/SSG to avoid hydration mismatch with localStorage
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground items-center justify-center">
        <div className="animate-pulse text-2xl font-semibold text-primary">正在加载 AegisMarks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8 min-h-screen flex flex-col">
      <SiteHeader />
      <DashboardInfo />
      <ControlsArea
        categories={categories}
        onAddCategory={handleAddCategory}
        onToggleVisibility={handleToggleCategoryVisibility}
        onDeleteCategory={handleDeleteCategory}
        onOpenAddBookmarkDialog={() => setIsAddBookmarkDialogOpen(true)}
      />
      <main className="flex-grow mt-2">
        <BookmarkGrid bookmarks={bookmarks} categories={categories} onDeleteBookmark={handleDeleteBookmark} />
      </main>
      <AddBookmarkDialog
        isOpen={isAddBookmarkDialogOpen}
        onClose={() => setIsAddBookmarkDialogOpen(false)}
        onAddBookmark={handleAddBookmark}
        categories={categories}
      />
      <footer className="text-center py-6 mt-auto border-t border-border">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} AegisMarks. 版权所有.</p>
      </footer>
    </div>
  );
}
