
'use server';

import type { Bookmark } from '@/types';

// --- In-memory store (for demonstration - will reset on server restart) ---
let serverBookmarks: Bookmark[] = [
  { id: '1', name: '谷歌搜索', url: 'https://www.google.com', categoryId: 'default', description: '全球最大的搜索引擎', isPrivate: false },
  { id: '2', name: '哔哩哔哩', url: 'https://www.bilibili.com', categoryId: 'default', description: '国内领先的年轻人文化社区', isPrivate: false },
];
// --- End in-memory store ---

// Simulate network delay
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export async function getBookmarksAction(): Promise<Bookmark[]> {
  console.log('Server Action: getBookmarksAction called');
  await simulateDelay();
  // Return a deep copy to prevent direct modification of server-side array from client-side expectations
  return JSON.parse(JSON.stringify(serverBookmarks));
}

export async function addBookmarkAction(bookmarkData: Omit<Bookmark, 'id'>): Promise<Bookmark> {
  console.log('Server Action: addBookmarkAction called with:', bookmarkData);
  await simulateDelay();
  const newBookmark: Bookmark = {
    ...bookmarkData,
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Server generates ID
    description: bookmarkData.description || '',
    isPrivate: bookmarkData.isPrivate || false,
  };
  serverBookmarks.push(newBookmark);
  return JSON.parse(JSON.stringify(newBookmark));
}

export async function updateBookmarkAction(bookmarkToUpdate: Bookmark): Promise<Bookmark> {
  console.log('Server Action: updateBookmarkAction called with:', bookmarkToUpdate);
  await simulateDelay();
  const index = serverBookmarks.findIndex(bm => bm.id === bookmarkToUpdate.id);
  if (index !== -1) {
    serverBookmarks[index] = {
        ...bookmarkToUpdate,
        description: bookmarkToUpdate.description || '',
        isPrivate: bookmarkToUpdate.isPrivate || false,
    };
    return JSON.parse(JSON.stringify(serverBookmarks[index]));
  }
  throw new Error('Bookmark not found for update');
}

export async function deleteBookmarkAction(bookmarkId: string): Promise<{ id: string }> {
  console.log('Server Action: deleteBookmarkAction called for ID:', bookmarkId);
  await simulateDelay();
  const initialLength = serverBookmarks.length;
  serverBookmarks = serverBookmarks.filter(bm => bm.id !== bookmarkId);
  if (serverBookmarks.length === initialLength) {
    // throw new Error('Bookmark not found for deletion'); // Or just succeed silently
    console.warn(`Bookmark with ID ${bookmarkId} not found for deletion, but operation considered successful.`);
  }
  return { id: bookmarkId };
}
