
'use server';

import type { Bookmark } from '@/types';
import { connectToDatabase, query } from '@/lib/mysql';
import type { RowDataPacket, OkPacket, PoolConnection } from 'mysql2/promise';

interface BookmarkRow extends RowDataPacket {
  id: number;
  name: string;
  url: string;
  category_id: number | null;
  description: string | null;
  is_private: boolean | number;
  priority: number;
}

interface MaxPriorityRow extends RowDataPacket {
  max_priority: number | null;
}

function mapDbRowToBookmark(row: BookmarkRow): Bookmark {
  return {
    id: String(row.id),
    name: row.name,
    url: row.url,
    categoryId: row.category_id ? String(row.category_id) : 'default',
    description: row.description || '',
    isPrivate: Boolean(row.is_private),
    priority: row.priority || 0,
  };
}

export async function getBookmarksAction(): Promise<Bookmark[]> {
  console.log('[BookmarkAction][getBookmarksAction] ENTRY');
  try {
    const rows = await query<BookmarkRow[]>("SELECT * FROM bookmarks ORDER BY priority DESC, created_at DESC");
    const bookmarks = rows.map(mapDbRowToBookmark);
    console.log(`[BookmarkAction][getBookmarksAction] SUCCESS_EXIT - Fetched ${bookmarks.length} bookmarks.`);
    return bookmarks;
  } catch (error: any) {
    console.error("[BookmarkAction][getBookmarksAction] ERROR_EXIT - Error fetching bookmarks. Message:", error.message, error);
    return [];
  }
}

export async function addBookmarkAction(bookmarkData: Omit<Bookmark, 'id' | 'priority'>): Promise<Bookmark> {
  console.log('[BookmarkAction][addBookmarkAction] ENTRY - Data:', bookmarkData);
  const { name, url, categoryId, description, isPrivate } = bookmarkData;

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const existingBookmarks = await connection.query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ?", [url]);
    if (existingBookmarks[0].length > 0) {
      throw new Error('此书签网址已存在，请勿重复添加。');
    }

    const [maxPriorityResult] = await connection.query<MaxPriorityRow[]>("SELECT MAX(priority) as max_priority FROM bookmarks");
    const nextPriority = (maxPriorityResult[0]?.max_priority || 0) + 1;

    const [result] = await connection.query<OkPacket>(
      "INSERT INTO bookmarks (name, url, category_id, description, is_private, priority) VALUES (?, ?, ?, ?, ?, ?)",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, nextPriority]
    );

    if (!result.insertId) {
        throw new Error('Failed to insert bookmark into MySQL DB.');
    }
    await connection.commit();
    const newBookmark = {
      id: String(result.insertId),
      ...bookmarkData,
      priority: nextPriority,
    };
    console.log('[BookmarkAction][addBookmarkAction] SUCCESS_EXIT - Bookmark added:', newBookmark);
    return newBookmark;

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("[BookmarkAction][addBookmarkAction] ERROR_EXIT - Error adding bookmark. Message:", error.message, error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

export async function updateBookmarkAction(bookmarkToUpdate: Bookmark): Promise<Bookmark> {
  console.log('[BookmarkAction][updateBookmarkAction] ENTRY - Bookmark to update:', bookmarkToUpdate);
  const { id, name, url, categoryId, description, isPrivate, priority } = bookmarkToUpdate;
  try {
    const existingBookmarks = await query<BookmarkRow[]>("SELECT id FROM bookmarks WHERE url = ? AND id != ?", [url, Number(id)]);
    if (existingBookmarks.length > 0) {
      throw new Error('此书签网址已存在于其他书签，请勿重复。');
    }

    await query(
      "UPDATE bookmarks SET name = ?, url = ?, category_id = ?, description = ?, is_private = ?, priority = ? WHERE id = ?",
      [name, url, categoryId === 'default' ? null : Number(categoryId), description || null, isPrivate || false, priority, Number(id)]
    );
    console.log('[BookmarkAction][updateBookmarkAction] SUCCESS_EXIT - Bookmark updated:', bookmarkToUpdate);
    return bookmarkToUpdate;
  } catch (error: any) {
    console.error("[BookmarkAction][updateBookmarkAction] ERROR_EXIT - Error updating bookmark. Message:", error.message, error);
    throw error;
  }
}

export async function deleteBookmarkAction(bookmarkId: string): Promise<{ id: string }> {
  console.log('[BookmarkAction][deleteBookmarkAction] ENTRY - Bookmark ID:', bookmarkId);
  try {
    const result = await query<OkPacket>("DELETE FROM bookmarks WHERE id = ?", [Number(bookmarkId)]);

    if (result.affectedRows === 0) {
      console.warn(`[BookmarkAction][deleteBookmarkAction] Bookmark with ID ${bookmarkId} not found for deletion, or already deleted.`);
    }
    console.log('[BookmarkAction][deleteBookmarkAction] SUCCESS_EXIT - Bookmark deleted. ID:', bookmarkId);
    return { id: bookmarkId };
  } catch (error: any) {
    console.error("[BookmarkAction][deleteBookmarkAction] ERROR_EXIT - Error deleting bookmark. Message:", error.message, error);
    throw error;
  }
}

export async function deleteBookmarksByCategoryIdAction(categoryId: string): Promise<{ deletedCount: number }> {
  console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] ENTRY - Category ID:', categoryId);
  try {
    if (categoryId === 'default' || categoryId === null || categoryId === undefined) {
        console.warn(`[BookmarkAction][deleteBookmarksByCategoryIdAction] Attempted to delete bookmarks for a non-specific category ID: ${categoryId}. No action taken.`);
        console.log('[BookmarkAction][deleteBookmarksByCategoryIdAction] SUCCESS_EXIT - No action taken for non-specific category ID.');
        return { deletedCount: 0 };
    }
    const result = await query<OkPacket>("DELETE FROM bookmarks WHERE category_id = ?", [Number(categoryId)]);
    console.log(`[BookmarkAction][deleteBookmarksByCategoryIdAction] SUCCESS_EXIT - Deleted ${result.affectedRows} bookmarks for category ID ${categoryId}`);
    return { deletedCount: result.affectedRows };
  } catch (error: any) {
    console.error(`[BookmarkAction][deleteBookmarksByCategoryIdAction] ERROR_EXIT - Error deleting bookmarks for category ID ${categoryId}. Message:`, error.message, error);
    throw error;
  }
}

export async function updateBookmarksOrderAction(orderedBookmarkIds: string[]): Promise<{ success: boolean }> {
  console.log('[BookmarkAction][updateBookmarksOrderAction] ENTRY - Ordered IDs:', orderedBookmarkIds);
  if (!orderedBookmarkIds || orderedBookmarkIds.length === 0) {
    console.log('[BookmarkAction][updateBookmarksOrderAction] SUCCESS_EXIT - No order to update.');
    return { success: true };
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await connectToDatabase();
    await connection.beginTransaction();

    const totalItems = orderedBookmarkIds.length;
    for (let i = 0; i < totalItems; i++) {
      const bookmarkId = orderedBookmarkIds[i];
      const priority = totalItems - 1 - i;
      await connection.query("UPDATE bookmarks SET priority = ? WHERE id = ?", [priority, Number(bookmarkId)]);
    }

    await connection.commit();
    console.log('[BookmarkAction][updateBookmarksOrderAction] SUCCESS_EXIT - Bookmarks order updated successfully.');
    return { success: true };
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("[BookmarkAction][updateBookmarksOrderAction] ERROR_EXIT - Error updating bookmarks order. Message:", error.message, error);
    return { success: false };
  } finally {
    if (connection) connection.release();
  }
}

    
