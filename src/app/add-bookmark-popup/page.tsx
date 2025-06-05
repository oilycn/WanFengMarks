
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import AddBookmarkDialog from '@/components/AddBookmarkDialog';
import type { Bookmark, Category } from '@/types';
import '../globals.css';
import { getCategoriesAction } from '@/actions/categoryActions';
import { addBookmarkAction } from '@/actions/bookmarkActions';


const AddBookmarkPopupPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [initialData, setInitialData] = useState<{ name?: string; url?: string; description?: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchCategoriesForPopup = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const fetchedCategories = await getCategoriesAction();
      if (fetchedCategories && fetchedCategories.length > 0) {
        setCategories(fetchedCategories);
      } else {
        // Fallback if no categories found or error during fetch
        console.warn("Popup: No categories fetched or an error occurred, using fallback default.");
        const defaultCategory = { id: 'default-fallback-popup', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
        setCategories([defaultCategory]);
      }
    } catch (error) {
      console.error("Popup: Failed to fetch categories:", error);
      const defaultCategory = { id: 'default-fallback-popup-error', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false };
      setCategories([defaultCategory]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);


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
      // Let the dialog's onClose handle window.close() after successful submission
    } catch (error) {
      console.error("Popup: Failed to add bookmark:", error);
      // Display error within the dialog or use alert for critical feedback
      // This will be handled by AddBookmarkDialog's internal validation display now
      // alert("无法保存书签，请查看控制台获取更多信息。");
      throw error; // Re-throw to allow AddBookmarkDialog to catch and display validation
    }
  };

  const handleDialogClose = () => {
    // This is called by AddBookmarkDialog on any close action (submit, cancel, X, Esc)
    window.close();
  };


  if (!isClient || isLoadingCategories) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background"><p className="text-foreground">正在加载...</p></div>;
  }

  // Filter out 'all' pseudo-category and ensure categories are visible
  // For popup, we don't need to consider admin auth for category visibility
  // as this is a direct "add to" action. If a category is private, it should still be listable if fetched.
  const selectableCategories = categories.filter(c => c.id !== 'all' && c.id !== 'default-fallback-popup' && c.id !== 'default-fallback-popup-error');
  
  // Ensure at least one category is available for selection, use default if necessary
  const finalCategories = selectableCategories.length > 0 
    ? selectableCategories 
    : [{ id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false }];


  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <AddBookmarkDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose} // This will now also trigger window.close
        onAddBookmark={handleAddBookmark}
        categories={finalCategories} // Pass the potentially refined list
        initialData={initialData}
      />
    </div>
  );
}

export default AddBookmarkPopupPage;
