
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import type { Bookmark, Category } from '@/types';
import '../globals.css'; // Import global styles for the dialog to look correct
import { getCategoriesAction } from '@/actions/categoryActions';
import { addBookmarkAction } from '@/actions/bookmarkActions';
import { useToast } from "@/hooks/use-toast"; // Keep toast for potential errors

const AddBookmarkPopupPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [initialData, setInitialData] = useState<{ name?: string; url?: string; description?: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { toast } = useToast();


  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchCategoriesForPopup = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const fetchedCategories = await getCategoriesAction();
      if (fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        // Fallback if no categories found, though ideally main app populates this
        const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
        setCategories([defaultCategory]);
      }
    } catch (error) {
      console.error("Popup: Failed to fetch categories:", error);
      toast({ title: "错误", description: "加载分类失败。", variant: "destructive" });
      const defaultCategory = { id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
      setCategories([defaultCategory]); // Ensure there's always a category
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toast]);


  useEffect(() => {
    if (!isClient) return;

    fetchCategoriesForPopup();

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
  }, [isClient, fetchCategoriesForPopup]);

  const handleAddBookmark = async (newBookmarkData: Omit<Bookmark, 'id'>) => {
    if (!isClient) return;
    try {
      await addBookmarkAction(newBookmarkData);
      // No need to show toast here, as window closes.
      // The main page (if open) would ideally reflect the change if it polls or uses a real-time DB.
      // For now, localStorage on main page won't update automatically from this server action.
      // A more robust solution would involve websockets or server-sent events if instant reflection on main page is needed without refresh.
      window.close();
    } catch (error) {
      console.error("Popup: Failed to add bookmark:", error);
      toast({ title: "添加失败", description: "无法保存书签，请重试。", variant: "destructive" });
      // Don't close window on error, let user try again or cancel.
    }
  };

  const handleCloseDialog = () => {
    window.close();
  };

  if (!isClient || isLoadingCategories) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background"><p className="text-foreground">正在加载...</p></div>;
  }

  const selectableCategories = categories.filter(c => c.id !== 'all' && c.isVisible); // Assuming private categories are handled by server or not relevant for popup

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <AddBookmarkDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onAddBookmark={handleAddBookmark}
        categories={selectableCategories}
        initialData={initialData}
      />
    </div>
  );
}

export default AddBookmarkPopupPage;
