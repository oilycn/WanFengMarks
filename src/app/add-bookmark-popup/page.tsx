
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
    if (!isClient) return; // Should not happen if dialog is open
    try {
      await addBookmarkAction(newBookmarkData);
      // Success: AddBookmarkDialog's handleSubmit will call its onClose, which calls handleDialogClose here.
    } catch (error) {
      console.error("Popup: Failed to add bookmark via action:", error);
      // Re-throw the error so AddBookmarkDialog can catch it and display it
      throw error; 
    }
  };

  const handleDialogClose = () => {
    // This is called by AddBookmarkDialog on any close action (successful submit, cancel, X, Esc)
    // Only close the window if it's truly a popup context
    if (window.opener && window.opener !== window) {
        window.close();
    } else {
        // Fallback for cases where it might not be a true popup (e.g., direct navigation for testing)
        // Or handle differently if needed. For now, just log.
        console.log("Dialog closed, but not in a typical popup context (no window.opener or self-opener).");
    }
  };


  if (!isClient || isLoadingCategories) {
    return <div className="flex h-screen w-screen items-center justify-center bg-background"><p className="text-foreground">正在加载...</p></div>;
  }

  const selectableCategories = categories.filter(c => c.id !== 'all' && c.id !== 'default-fallback-popup' && c.id !== 'default-fallback-popup-error');
  
  
  const finalCategories = selectableCategories.length > 0 
    ? selectableCategories 
    : [{ id: 'default', name: '通用书签', isVisible: true, icon: 'Folder', isPrivate: false }];


  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <AddBookmarkDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose} 
        onAddBookmark={handleAddBookmark}
        categories={finalCategories} 
        initialData={initialData}
      />
    </div>
  );
}

export default AddBookmarkPopupPage;
