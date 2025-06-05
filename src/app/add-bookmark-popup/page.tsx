
"use client";

import React, { useState, useEffect } from 'react';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import type { Bookmark, Category } from '@/types';
// import { Toaster } from "@/components/ui/toaster"; // Removed
// import { useToast } from "@/hooks/use-toast"; // Removed
import '../globals.css'; // Import global styles for the dialog to look correct

const LS_BOOKMARKS_KEY = 'wanfeng_bookmarks_v1_zh';
const LS_CATEGORIES_KEY = 'wanfeng_categories_v1_zh';

export default function AddBookmarkPopupPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(true); // Dialog is open by default
  const [initialData, setInitialData] = useState<{ name?: string; url?: string; description?: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  // const { toast } = useToast(); // Removed


  useEffect(() => {
    setIsClient(true);
    // This page is only for client-side rendering
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Load categories from localStorage
    const storedCategories = localStorage.getItem(LS_CATEGORIES_KEY);
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    } else {
      // Fallback if no categories found, though ideally main app populates this
      const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
      setCategories([defaultCategory]);
    }

    // Parse URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const nameFromQuery = queryParams.get('name');
    const urlFromQuery = queryParams.get('url');
    const descFromQuery = queryParams.get('desc');

    if (nameFromQuery && urlFromQuery) {
      setInitialData({
        name: decodeURIComponent(nameFromQuery),
        url: decodeURIComponent(urlFromQuery),
        description: descFromQuery ? decodeURIComponent(descFromQuery) : undefined,
      });
    }
    // No need to clean URL here as the window will close
  }, [isClient]);

  const handleAddBookmark = (newBookmarkData: Omit<Bookmark, 'id'>) => {
    if (!isClient) return;
    const bookmarkWithId = { ...newBookmarkData, id: Date.now().toString() + Math.random().toString(36).substring(2,7) };
    
    const storedBookmarks = localStorage.getItem(LS_BOOKMARKS_KEY);
    const currentBookmarks: Bookmark[] = storedBookmarks ? JSON.parse(storedBookmarks) : [];
    const updatedBookmarks = [...currentBookmarks, bookmarkWithId];
    localStorage.setItem(LS_BOOKMARKS_KEY, JSON.stringify(updatedBookmarks));
    
    // Toast for success (optional, as window closes quickly)
    // The toast call inside AddBookmarkDialog will attempt to fire, but without a Toaster here, it won't show.
    // This is fine as the window closes.

    // Close the popup window
    // A small delay might help ensure localStorage write completes, though usually fast
    setTimeout(() => window.close(), 100); 
  };

  const handleCloseDialog = () => {
    // Close the popup window
    window.close();
  };

  if (!isClient) {
    // Optional: show a loading state if needed, but this page should be very fast
    return <div className="flex h-screen w-screen items-center justify-center bg-background"><p className="text-foreground">正在加载...</p></div>;
  }

  // Filter out the 'all' pseudo-category if it exists by chance
  const selectableCategories = categories.filter(c => c.id !== 'all');

  return (
    // Minimal wrapper to center the dialog and provide background
    <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <AddBookmarkDialog
        isOpen={isDialogOpen} // Dialog is controlled to be always open initially
        onClose={handleCloseDialog}
        onAddBookmark={handleAddBookmark}
        categories={selectableCategories}
        // activeCategoryId is not relevant here, dialog will use its default logic
        initialData={initialData}
      />
      {/* <Toaster /> Removed */}
    </div>
  );
}
